use std::collections::HashMap;
use crate::engine::{AboutFs, CloudAccount, RcloneClient, VaultQuota, VAULT_UNION_NAME};
use crate::AppState;

const KNOWN_PROVIDERS: &[(&str, &str)] = &[
    ("Google Drive", "gdrive"),
    ("OneDrive", "onedrive"),
];

/// Pure calculation helper to construct VaultQuota from dumped config and about metrics
pub fn calculate_vault_quota(
    config: &HashMap<String, HashMap<String, serde_json::Value>>,
    about_map: &HashMap<String, Result<AboutFs, String>>,
    prev_quota: Option<&VaultQuota>,
) -> VaultQuota {
    let mut accounts = Vec::new();

    for &(name, id) in KNOWN_PROVIDERS {
        let is_configured = config.contains_key(id);

        let prev_account = prev_quota.and_then(|q| q.accounts.iter().find(|a| a.provider == id));

        let (is_connected, needs_auth, used_bytes, total_bytes) = if is_configured {
            match about_map.get(id) {
                Some(Ok(about)) => (
                    true,
                    false,
                    about.used.unwrap_or(0),
                    about.total.unwrap_or(0),
                ),
                Some(Err(err))
                    if ["invalid_grant", "unauthorized", "token expired", "401"]
                        .iter()
                        .any(|k| err.to_lowercase().contains(k)) =>
                {
                    (false, true, 0, 0)
                }
                _ => {
                    if let Some(prev) = prev_account {
                        (prev.is_connected, prev.needs_auth, prev.used_bytes, prev.total_bytes)
                    } else {
                        (false, false, 0, 0)
                    }
                }
            }
        } else {
            (false, false, 0, 0)
        };

        accounts.push(CloudAccount {
            name: name.to_string(),
            provider: id.to_string(),
            used_bytes,
            total_bytes,
            is_connected,
            needs_auth,
        });
    }


    // Vault pool aggregated metrics
    let (total_bytes, used_bytes, free_bytes) = match about_map.get(VAULT_UNION_NAME) {
        Some(Ok(about)) => (
            about.total.unwrap_or(0),
            about.used.unwrap_or(0),
            about.free.unwrap_or(0),
        ),
        _ => {
            let total: u64 = accounts.iter().filter(|a| a.is_connected).map(|a| a.total_bytes).sum();
            let used: u64 = accounts.iter().filter(|a| a.is_connected).map(|a| a.used_bytes).sum();
            let free = total.saturating_sub(used);
            (total, used, free)
        }
    };

    VaultQuota {
        total_bytes,
        used_bytes,
        free_bytes,
        accounts,
    }
}

pub async fn fetch_vault_quota_internal(
    client: &RcloneClient,
    prev_quota: Option<&VaultQuota>,
) -> Result<VaultQuota, String> {
    let config = client.dump_config().await?;

    let gdrive_fut = async {
        if config.contains_key("gdrive") {
            Some(("gdrive".to_string(), client.get_about("gdrive:").await))
        } else {
            None
        }
    };

    let onedrive_fut = async {
        if config.contains_key("onedrive") {
            Some(("onedrive".to_string(), client.get_about("onedrive:").await))
        } else {
            None
        }
    };

    let union_fut = async {
        if config.contains_key(VAULT_UNION_NAME) {
            Some((
                VAULT_UNION_NAME.to_string(),
                client.get_about(&format!("{}:", VAULT_UNION_NAME)).await,
            ))
        } else {
            None
        }
    };

    let (gdrive_res, onedrive_res, union_res) = tokio::join!(gdrive_fut, onedrive_fut, union_fut);

    let mut about_map = HashMap::new();
    if let Some((id, res)) = gdrive_res {
        about_map.insert(id, res);
    }
    if let Some((id, res)) = onedrive_res {
        about_map.insert(id, res);
    }
    if let Some((id, res)) = union_res {
        about_map.insert(id, res);
    }

    Ok(calculate_vault_quota(&config, &about_map, prev_quota))
}

#[tauri::command]
#[specta::specta]
pub async fn get_vault_quota(
    state: tauri::State<'_, AppState>,
) -> Result<VaultQuota, String> {
    let client_guard = state.client.read().await;
    let client = client_guard.as_ref().ok_or("Vault engine is not running")?;
    let prev_cached = state.cached_quota.read().await.clone();
    let quota = fetch_vault_quota_internal(client, prev_cached.as_ref()).await?;
    *state.cached_quota.write().await = Some(quota.clone());
    Ok(quota)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_vault_quota_empty_when_no_config() {
        let config = HashMap::new();
        let about_map = HashMap::new();

        let quota = calculate_vault_quota(&config, &about_map, None);
        assert_eq!(quota.total_bytes, 0);
        assert_eq!(quota.used_bytes, 0);
        assert_eq!(quota.free_bytes, 0);
        assert_eq!(quota.accounts.len(), 2);
        assert!(!quota.accounts[0].is_connected);
        assert!(!quota.accounts[0].needs_auth);
        assert!(!quota.accounts[1].is_connected);
    }

    #[test]
    fn test_calculate_vault_quota_with_connected_account() {
        let mut config = HashMap::new();
        config.insert("gdrive".to_string(), HashMap::new());

        let mut about_map = HashMap::new();
        about_map.insert(
            "gdrive".to_string(),
            Ok(AboutFs {
                total: Some(15 * 1024 * 1024 * 1024),
                used: Some(5 * 1024 * 1024 * 1024),
                free: Some(10 * 1024 * 1024 * 1024),
                trashed: None,
                other: None,
            }),
        );

        let quota = calculate_vault_quota(&config, &about_map, None);
        assert_eq!(quota.total_bytes, 15 * 1024 * 1024 * 1024);
        assert_eq!(quota.used_bytes, 5 * 1024 * 1024 * 1024);
        assert_eq!(quota.free_bytes, 10 * 1024 * 1024 * 1024);
        assert!(quota.accounts[0].is_connected);
        assert_eq!(quota.accounts[0].used_bytes, 5 * 1024 * 1024 * 1024);
    }

    #[test]
    fn test_calculate_vault_quota_with_needs_auth_account() {
        let mut config = HashMap::new();
        config.insert("onedrive".to_string(), HashMap::new());

        let mut about_map = HashMap::new();
        about_map.insert("onedrive".to_string(), Err("Token expired".into()));

        let quota = calculate_vault_quota(&config, &about_map, None);
        let onedrive = quota.accounts.iter().find(|a| a.provider == "onedrive").unwrap();
        assert!(!onedrive.is_connected);
        assert!(onedrive.needs_auth);
    }

    #[test]
    fn test_calculate_vault_quota_transient_error_preserves_cache() {
        let mut config = HashMap::new();
        config.insert("gdrive".to_string(), HashMap::new());

        let mut about_map = HashMap::new();
        about_map.insert(
            "gdrive".to_string(),
            Err("failed to get Drive storageQuota: context canceled".into()),
        );

        let prev = VaultQuota {
            total_bytes: 15 * 1024 * 1024 * 1024,
            used_bytes: 2 * 1024 * 1024 * 1024,
            free_bytes: 13 * 1024 * 1024 * 1024,
            accounts: vec![
                CloudAccount {
                    name: "Google Drive".into(),
                    provider: "gdrive".into(),
                    used_bytes: 2 * 1024 * 1024 * 1024,
                    total_bytes: 15 * 1024 * 1024 * 1024,
                    is_connected: true,
                    needs_auth: false,
                },
            ],
        };

        let quota = calculate_vault_quota(&config, &about_map, Some(&prev));
        let gdrive = quota.accounts.iter().find(|a| a.provider == "gdrive").unwrap();
        assert!(gdrive.is_connected, "Transient error should not mark account disconnected");
        assert!(!gdrive.needs_auth, "Transient error should not flag needs_auth");
        assert_eq!(gdrive.total_bytes, 15 * 1024 * 1024 * 1024);
        assert_eq!(gdrive.used_bytes, 2 * 1024 * 1024 * 1024);
        assert_eq!(quota.total_bytes, 15 * 1024 * 1024 * 1024);
    }

    #[test]
    fn test_calculate_vault_quota_disconnected_provider_cleared_even_with_prev_cache() {
        // config has gdrive, but onedrive was removed from config
        let mut config = HashMap::new();
        config.insert("gdrive".to_string(), HashMap::new());

        let mut about_map = HashMap::new();
        about_map.insert(
            "gdrive".to_string(),
            Ok(AboutFs {
                total: Some(15 * 1024 * 1024 * 1024),
                used: Some(1024),
                free: Some(15 * 1024 * 1024 * 1024 - 1024),
                ..Default::default()
            }),
        );

        // Previous cache had BOTH gdrive and onedrive connected
        let prev = VaultQuota {
            total_bytes: 20 * 1024 * 1024 * 1024,
            used_bytes: 2 * 1024 * 1024 * 1024,
            free_bytes: 18 * 1024 * 1024 * 1024,
            accounts: vec![
                CloudAccount {
                    name: "Google Drive".into(),
                    provider: "gdrive".into(),
                    used_bytes: 1024,
                    total_bytes: 15 * 1024 * 1024 * 1024,
                    is_connected: true,
                    needs_auth: false,
                },
                CloudAccount {
                    name: "OneDrive".into(),
                    provider: "onedrive".into(),
                    used_bytes: 1024 * 1024 * 1024,
                    total_bytes: 5 * 1024 * 1024 * 1024,
                    is_connected: true,
                    needs_auth: false,
                },
            ],
        };

        let quota = calculate_vault_quota(&config, &about_map, Some(&prev));
        let onedrive = quota.accounts.iter().find(|a| a.provider == "onedrive").unwrap();
        assert!(!onedrive.is_connected, "Disconnected provider must not be marked connected");
        assert_eq!(onedrive.total_bytes, 0, "Disconnected provider must have 0 total bytes");
        assert_eq!(onedrive.used_bytes, 0, "Disconnected provider must have 0 used bytes");

        let gdrive = quota.accounts.iter().find(|a| a.provider == "gdrive").unwrap();
        assert!(gdrive.is_connected);
        assert_eq!(gdrive.total_bytes, 15 * 1024 * 1024 * 1024);

        // Combined pool must only sum gdrive
        assert_eq!(quota.total_bytes, 15 * 1024 * 1024 * 1024);
    }
}
