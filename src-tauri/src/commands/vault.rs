use std::collections::HashMap;
use crate::engine::{AboutFs, CloudAccount, RcloneClient, VaultQuota};
use crate::AppState;

pub const KNOWN_PROVIDERS: &[(&str, &str)] = &[
    ("Google Drive", "gdrive"),
    ("OneDrive", "onedrive"),
    ("Dropbox", "dropbox"),
    ("Box", "box"),
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

        let account_email = config
            .get(id)
            .and_then(|cfg| cfg.get("account_email")?.as_str())
            .filter(|s| !s.is_empty())
            .map(Into::into)
            .or_else(|| prev_account?.account_email.clone());

        accounts.push(CloudAccount {
            name: name.to_string(),
            provider: id.to_string(),
            used_bytes,
            total_bytes,
            is_connected,
            needs_auth,
            account_email,
        });
    }


    // Vault pool aggregated metrics directly from active connected accounts
    let total_bytes: u64 = accounts.iter().filter(|a| a.is_connected).map(|a| a.total_bytes).sum();
    let used_bytes: u64 = accounts.iter().filter(|a| a.is_connected).map(|a| a.used_bytes).sum();
    let free_bytes = total_bytes.saturating_sub(used_bytes);

    VaultQuota {
        total_bytes,
        used_bytes,
        free_bytes,
        accounts,
    }
}

async fn check_provider_quota(
    client: &RcloneClient,
    config: &HashMap<String, HashMap<String, serde_json::Value>>,
    id: &'static str,
) -> Option<(String, Result<AboutFs, String>)> {
    if config.contains_key(id) {
        let remote = format!("{id}:");
        let res = tokio::time::timeout(
            std::time::Duration::from_secs(10),
            client.get_about(&remote),
        )
        .await
        .unwrap_or_else(|_| Err("Storage quota request timed out".to_string()));
        Some((id.to_string(), res))
    } else {
        None
    }
}

async fn resolve_account_email_if_missing(
    client: &RcloneClient,
    config: &HashMap<String, HashMap<String, serde_json::Value>>,
    provider: &'static str,
) -> Option<(&'static str, String)> {
    if !config.contains_key(provider) {
        return None;
    }
    let has_email = config
        .get(provider)
        .and_then(|cfg| cfg.get("account_email")?.as_str())
        .is_some_and(|s| !s.trim().is_empty());

    if has_email {
        return None;
    }

    crate::commands::accounts::fetch_and_save_account_identity(client, provider)
        .await
        .map(|email| (provider, email))
}

pub async fn fetch_vault_quota_internal(
    client: &RcloneClient,
    prev_quota: Option<&VaultQuota>,
) -> Result<VaultQuota, String> {
    let mut config = client.dump_config().await?;

    let (about_map, emails) = tokio::join!(
        async {
            let (g, o, d, b) = tokio::join!(
                check_provider_quota(client, &config, "gdrive"),
                check_provider_quota(client, &config, "onedrive"),
                check_provider_quota(client, &config, "dropbox"),
                check_provider_quota(client, &config, "box"),
            );
            [g, o, d, b].into_iter().flatten().collect::<HashMap<String, Result<AboutFs, String>>>()
        },
        async {
            let (g, o, d, b) = tokio::join!(
                resolve_account_email_if_missing(client, &config, "gdrive"),
                resolve_account_email_if_missing(client, &config, "onedrive"),
                resolve_account_email_if_missing(client, &config, "dropbox"),
                resolve_account_email_if_missing(client, &config, "box"),
            );
            [g, o, d, b].into_iter().flatten().collect::<Vec<(&'static str, String)>>()
        }
    );

    for (id, email) in emails {
        if let Some(cfg) = config.get_mut(id) {
            cfg.insert("account_email".to_string(), serde_json::Value::String(email));
        }
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
        assert_eq!(quota.accounts.len(), 4);
        assert!(quota.accounts.iter().all(|a| !a.is_connected && !a.needs_auth));
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
                    account_email: Some("test@gmail.com".into()),
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
                    account_email: None,
                },
                CloudAccount {
                    name: "OneDrive".into(),
                    provider: "onedrive".into(),
                    used_bytes: 1024 * 1024 * 1024,
                    total_bytes: 5 * 1024 * 1024 * 1024,
                    is_connected: true,
                    needs_auth: false,
                    account_email: None,
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

    #[test]
    fn test_calculate_vault_quota_with_timed_out_account() {
        let mut config = HashMap::new();
        config.insert("onedrive".to_string(), HashMap::new());

        let mut about_map = HashMap::new();
        about_map.insert("onedrive".to_string(), Err("Storage quota request timed out".to_string()));

        let quota = calculate_vault_quota(&config, &about_map, None);
        let onedrive = quota.accounts.iter().find(|a| a.provider == "onedrive").unwrap();
        assert!(!onedrive.is_connected);
        assert!(!onedrive.needs_auth);
        assert_eq!(quota.total_bytes, 0);
    }

    #[test]
    fn test_calculate_vault_quota_all_four_providers() {
        let mut config = HashMap::new();
        config.insert("gdrive".into(), HashMap::new());
        config.insert("onedrive".into(), HashMap::new());
        config.insert("dropbox".into(), HashMap::new());
        config.insert("box".into(), HashMap::new());

        let mut about_map = HashMap::new();
        about_map.insert("gdrive".into(), Ok(AboutFs { total: Some(15 * 1024 * 1024 * 1024), used: Some(2 * 1024 * 1024 * 1024), ..Default::default() }));
        about_map.insert("onedrive".into(), Ok(AboutFs { total: Some(5 * 1024 * 1024 * 1024), used: Some(1 * 1024 * 1024 * 1024), ..Default::default() }));
        about_map.insert("dropbox".into(), Ok(AboutFs { total: Some(2 * 1024 * 1024 * 1024), used: Some(500 * 1024 * 1024), ..Default::default() }));
        about_map.insert("box".into(), Ok(AboutFs { total: Some(10 * 1024 * 1024 * 1024), used: Some(1024 * 1024 * 1024), ..Default::default() }));

        let quota = calculate_vault_quota(&config, &about_map, None);
        assert_eq!(quota.accounts.len(), 4);
        assert_eq!(quota.total_bytes, 32 * 1024 * 1024 * 1024);
        let expected_used: u64 = (2 * 1024 * 1024 * 1024)
        + (1 * 1024 * 1024 * 1024)
        + (500 * 1024 * 1024)
        + (1024 * 1024 * 1024);
        assert_eq!(quota.used_bytes, expected_used);
        assert_eq!(quota.free_bytes, quota.total_bytes - quota.used_bytes);
    }

    #[test]
    fn test_calculate_vault_quota_reads_account_email_from_config() {
        let mut config = HashMap::new();
        let mut gdrive_cfg = HashMap::new();
        gdrive_cfg.insert("account_email".to_string(), serde_json::Value::String("user@gmail.com".to_string()));
        config.insert("gdrive".into(), gdrive_cfg);

        let mut about_map = HashMap::new();
        about_map.insert("gdrive".into(), Ok(AboutFs { total: Some(15 * 1024 * 1024 * 1024), used: Some(2 * 1024 * 1024 * 1024), ..Default::default() }));

        let quota = calculate_vault_quota(&config, &about_map, None);
        let gdrive = quota.accounts.iter().find(|a| a.provider == "gdrive").unwrap();
        assert_eq!(gdrive.account_email.as_deref(), Some("user@gmail.com"));
    }
}
