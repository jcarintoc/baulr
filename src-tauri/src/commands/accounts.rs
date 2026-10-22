use std::collections::HashMap;
use tauri::Emitter;
use crate::commands::vault::fetch_vault_quota_internal;
use crate::engine::{sync_vault_union, VaultQuota};
use crate::AppState;

pub fn resolve_provider_config(provider: &str) -> Result<(&'static str, &'static str, HashMap<String, String>), String> {
    match provider.to_lowercase().as_str() {
        "gdrive" | "drive" | "google" => Ok(("gdrive", "drive", HashMap::from([("scope".into(), "drive".into())]))),
        "onedrive" | "microsoft" => Ok(("onedrive", "onedrive", HashMap::from([("drive_type".into(), "personal".into())]))),
        "dropbox" => Ok(("dropbox", "dropbox", HashMap::new())),
        "box" => Ok(("box", "box", HashMap::from([("box_sub_type".into(), "user".into())]))),
        other => Err(format!("Unsupported cloud provider: '{other}'")),
    }
}

pub async fn auto_configure_onedrive(client: &crate::engine::RcloneClient) -> Result<(), String> {
    let config = client.dump_config().await?;
    let onedrive_cfg = match config.get("onedrive") {
        Some(cfg) => cfg,
        None => return Ok(()),
    };

    if onedrive_cfg.get("drive_id").and_then(|v| v.as_str()).is_some_and(|s| !s.is_empty()) {
        return Ok(());
    }

    let token_raw = onedrive_cfg.get("token").and_then(|v| v.as_str()).unwrap_or_default();
    let token_val: serde_json::Value = serde_json::from_str(token_raw).unwrap_or_default();
    let Some(access_token) = token_val.get("access_token").and_then(|v| v.as_str()).filter(|s| !s.is_empty()) else {
        return Ok(());
    };

    let graph_resp = reqwest::Client::new()
        .get("https://graph.microsoft.com/v1.0/me/drive")
        .header("Authorization", format!("Bearer {access_token}"))
        .send()
        .await
        .map_err(|e| format!("Failed to connect to Microsoft Graph: {e}"))?;

    if !graph_resp.status().is_success() {
        let err_text = graph_resp.text().await.unwrap_or_default();
        return Err(format!("Microsoft Graph drive lookup failed: {err_text}"));
    }

    let drive_info: serde_json::Value = graph_resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse Microsoft Graph response: {e}"))?;

    let drive_id = drive_info
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or("Microsoft Graph response missing drive 'id'")?;

    let drive_type = drive_info
        .get("driveType")
        .and_then(|v| v.as_str())
        .unwrap_or("personal");

    let params = HashMap::from([
        ("drive_id".to_string(), drive_id.to_string()),
        ("drive_type".to_string(), drive_type.to_string()),
    ]);
    client.update_remote("onedrive", &params).await?;

    Ok(())
}

pub async fn fetch_and_save_account_identity(
    client: &crate::engine::RcloneClient,
    provider: &str,
) -> Option<String> {
    let config = client.dump_config().await.ok()?;
    let provider_cfg = config.get(provider)?;
    if let Some(cached) = provider_cfg.get("account_email").and_then(|v| v.as_str()).filter(|s| !s.is_empty()) {
        return Some(cached.to_string());
    }

    let token_raw = provider_cfg.get("token").and_then(|v| v.as_str())?;
    let token_val: serde_json::Value = serde_json::from_str(token_raw).ok()?;
    let access_token = token_val.get("access_token").and_then(|v| v.as_str())?;

    let http = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(3))
        .build()
        .ok()?;

    let (url, is_post) = match provider {
        "gdrive" => ("https://www.googleapis.com/drive/v3/about?fields=user", false),
        "onedrive" => ("https://graph.microsoft.com/v1.0/me/drive", false),
        "dropbox" => ("https://api.dropboxapi.com/2/users/get_current_account", true),
        "box" => ("https://api.box.com/2.0/users/me", false),
        _ => return None,
    };

    let req = if is_post {
        http.post(url)
            .header("Content-Type", "application/json")
            .body("{}")
    } else {
        http.get(url)
    };

    let resp = req
        .header("Authorization", format!("Bearer {access_token}"))
        .header("User-Agent", "Baulr/1.0")
        .send()
        .await
        .ok()?;

    if !resp.status().is_success() {
        return None;
    }

    let val: serde_json::Value = resp.json().await.ok()?;

    let email = match provider {
        "gdrive" => val.pointer("/user/emailAddress"),
        "onedrive" => val
            .pointer("/owner/user/email")
            .or_else(|| val.pointer("/owner/user/displayName")),
        "box" => val.get("login").or_else(|| val.get("name")),
        _ => val.get("email"),
    }
    .and_then(|v| v.as_str())
    .map(String::from);

    if let Some(ref email_str) = email {
        let params = HashMap::from([("account_email".to_string(), email_str.clone())]);
        let _ = client.update_remote(provider, &params).await;
    }

    email
}

#[tauri::command]
#[specta::specta]
pub async fn connect_account(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    provider: String,
) -> Result<VaultQuota, String> {
    let client = state.client.read().await.clone().ok_or("Vault engine is not running")?;
    let (name, remote_type, params) = resolve_provider_config(&provider)?;

    // Delete any pre-existing remote for this provider and clear fs cache before starting OAuth
    let _ = client.delete_remote(name).await;
    let _ = client.clear_fs_cache().await;

    if let Err(e) = client.create_oauth_remote(name, remote_type, &params).await {
        let _ = client.delete_remote(name).await;
        let _ = client.clear_fs_cache().await;
        return Err(e);
    }

    let _ = app.emit("oauth:finalizing", &provider);

    if name == "onedrive" {
        if let Err(e) = auto_configure_onedrive(&client).await {
            eprintln!("Warning: OneDrive secondary auto-configuration notice: {e}");
        }
    }

    let _ = fetch_and_save_account_identity(&client, name).await;

    let _ = sync_vault_union(&client).await;
    crate::commands::browser::stop_media_server(&state).await;
    let _ = client.clear_fs_cache().await;

    *state.cached_quota.write().await = None;
    let quota = fetch_vault_quota_internal(&client, None).await?;
    *state.cached_quota.write().await = Some(quota.clone());
    Ok(quota)
}

#[tauri::command]
#[specta::specta]
pub async fn disconnect_account(
    state: tauri::State<'_, AppState>,
    provider: String,
) -> Result<VaultQuota, String> {
    let client = state.client.read().await.clone().ok_or("Vault engine is not running")?;
    let (name, _, _) = resolve_provider_config(&provider)?;

    // Cleanly delete the union/alias remote first to prevent dangling alias locks on the provider
    let _ = client.delete_remote(crate::engine::VAULT_UNION_NAME).await;
    client.delete_remote(name).await?;
    let _ = sync_vault_union(&client).await;
    crate::commands::browser::stop_media_server(&state).await;
    let _ = client.clear_fs_cache().await;

    *state.cached_quota.write().await = None;
    let quota = fetch_vault_quota_internal(&client, None).await?;
    *state.cached_quota.write().await = Some(quota.clone());
    Ok(quota)
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
        assert_eq!(params.get("drive_type").map(String::as_str), Some("personal"));
    }

    #[test]
    fn test_resolve_provider_config_dropbox() {
        let (name, rtype, params) = resolve_provider_config("dropbox").unwrap();
        assert_eq!(name, "dropbox");
        assert_eq!(rtype, "dropbox");
        assert!(params.is_empty());
    }

    #[test]
    fn test_resolve_provider_config_box() {
        let (name, rtype, params) = resolve_provider_config("box").unwrap();
        assert_eq!(name, "box");
        assert_eq!(rtype, "box");
        assert_eq!(params.get("box_sub_type").map(String::as_str), Some("user"));
    }

    #[test]
    fn test_resolve_provider_config_unsupported() {
        assert!(resolve_provider_config("mega").is_err());
    }
}
