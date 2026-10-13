use std::collections::HashMap;
use crate::commands::vault::fetch_vault_quota_internal;
use crate::engine::{sync_vault_union, VaultQuota};
use crate::AppState;

pub fn resolve_provider_config(provider: &str) -> Result<(&'static str, &'static str, HashMap<String, String>), String> {
    match provider.to_lowercase().as_str() {
        "gdrive" | "drive" | "google" => Ok(("gdrive", "drive", HashMap::from([("scope".into(), "drive".into())]))),
        "onedrive" | "microsoft" => Ok(("onedrive", "onedrive", HashMap::new())),
        other => Err(format!("Unsupported cloud provider: '{other}'")),
    }
}

#[tauri::command]
#[specta::specta]
pub async fn connect_account(
    state: tauri::State<'_, AppState>,
    provider: String,
) -> Result<VaultQuota, String> {
    let client = state.client.read().await.clone().ok_or("Vault engine is not running")?;
    let (name, remote_type, params) = resolve_provider_config(&provider)?;

    client.create_oauth_remote(name, remote_type, &params).await?;
    let _ = sync_vault_union(&client).await;

    fetch_vault_quota_internal(&client).await
}

#[tauri::command]
#[specta::specta]
pub async fn disconnect_account(
    state: tauri::State<'_, AppState>,
    provider: String,
) -> Result<VaultQuota, String> {
    let client = state.client.read().await.clone().ok_or("Vault engine is not running")?;
    let (name, _, _) = resolve_provider_config(&provider)?;

    client.delete_remote(name).await?;
    let _ = sync_vault_union(&client).await;

    fetch_vault_quota_internal(&client).await
}

#[tauri::command]
#[specta::specta]
pub async fn cancel_oauth(
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    if let Some(client) = state.client.read().await.as_ref() {
        let _ = client.stop_oauth().await;
    }
    Ok(())
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_provider_config_gdrive() {
        let (name, rtype, params) = resolve_provider_config("gdrive").unwrap();
        assert_eq!(name, "gdrive");
        assert_eq!(rtype, "drive");
        assert_eq!(params.get("scope").map(String::as_str), Some("drive"));
    }

    #[test]
    fn test_resolve_provider_config_onedrive() {
        let (name, rtype, params) = resolve_provider_config("onedrive").unwrap();
        assert_eq!(name, "onedrive");
        assert_eq!(rtype, "onedrive");
        assert!(params.is_empty());
    }

    #[test]
    fn test_resolve_provider_config_unsupported() {
        assert!(resolve_provider_config("mega").is_err());
    }
}
