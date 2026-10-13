pub mod engine;

use std::sync::Arc;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::Manager;
use tauri_specta::{collect_commands, Builder};
use tokio::sync::RwLock;

use crate::engine::{CoreStats, DaemonStatus, RcloneClient, RcloneDaemon};

#[derive(Default, Clone)]
pub struct AppState {
    pub daemon: Arc<RwLock<Option<RcloneDaemon>>>,
    pub client: Arc<RwLock<Option<RcloneClient>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CloudAccount {
    pub name: String,
    pub provider: String,
    #[specta(type = f64)]
    pub used_bytes: u64,
    #[specta(type = f64)]
    pub total_bytes: u64,
    pub is_connected: bool,
    pub needs_auth: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct VaultQuota {
    #[specta(type = f64)]
    pub total_bytes: u64,
    #[specta(type = f64)]
    pub used_bytes: u64,
    #[specta(type = f64)]
    pub free_bytes: u64,
    pub accounts: Vec<CloudAccount>,
}

#[tauri::command]
#[specta::specta]
fn get_vault_quota() -> Result<VaultQuota, String> {
    Ok(VaultQuota {
        total_bytes: 20 * 1024 * 1024 * 1024,
        used_bytes: 5 * 1024 * 1024 * 1024,
        free_bytes: 15 * 1024 * 1024 * 1024,
        accounts: vec![
            CloudAccount {
                name: "Google Drive".into(),
                provider: "gdrive".into(),
                used_bytes: 3 * 1024 * 1024 * 1024,
                total_bytes: 15 * 1024 * 1024 * 1024,
                is_connected: true,
                needs_auth: false,
            },
            CloudAccount {
                name: "OneDrive".into(),
                provider: "onedrive".into(),
                used_bytes: 2 * 1024 * 1024 * 1024,
                total_bytes: 5 * 1024 * 1024 * 1024,
                is_connected: true,
                needs_auth: false,
            },
        ],
    })
}

#[tauri::command]
#[specta::specta]
async fn get_daemon_status(
    state: tauri::State<'_, AppState>,
) -> Result<DaemonStatus, String> {
    let client_guard = state.client.read().await;
    match client_guard.as_ref() {
        Some(client) => Ok(DaemonStatus {
            is_running: client.noop().await.is_ok(),
            port: client.port(),
        }),
        None => Ok(DaemonStatus {
            is_running: false,
            port: 0,
        }),
    }
}

#[tauri::command]
#[specta::specta]
async fn get_core_stats(
    state: tauri::State<'_, AppState>,
) -> Result<CoreStats, String> {
    let client_guard = state.client.read().await;
    let client = client_guard.as_ref().ok_or("Daemon is not running")?;
    client.get_stats().await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState::default();
    let daemon_holder = app_state.daemon.clone();
    let client_holder = app_state.client.clone();

    let specta_builder = Builder::<tauri::Wry>::new()
        .commands(collect_commands![get_vault_quota, get_daemon_status, get_core_stats]);

    #[cfg(debug_assertions)]
    specta_builder
        .export(
            specta_typescript::Typescript::default(),
            "../src/lib/bindings.ts",
        )
        .expect("Failed to export typescript bindings");

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(app_state)
        .setup(move |app| {
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let data_dir = app_handle
                    .path()
                    .app_data_dir()
                    .unwrap_or_else(|_| std::path::PathBuf::from("data"));

                match RcloneDaemon::start(&data_dir).await {
                    Ok(daemon) => {
                        let client = daemon.client().clone();
                        *daemon_holder.write().await = Some(daemon);
                        *client_holder.write().await = Some(client);
                    }
                    Err(e) => {
                        eprintln!("Failed to start Rclone sidecar daemon: {e}");
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(specta_builder.invoke_handler());

    if let Err(e) = builder.run(tauri::generate_context!()) {
        eprintln!("Failed to launch Baulr desktop application: {e}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vault_quota_returns_data() {
        let quota = get_vault_quota().expect("get_vault_quota failed");
        assert_eq!(quota.total_bytes, 20 * 1024 * 1024 * 1024);
        assert!(!quota.accounts.is_empty());
    }

    #[tokio::test]
    async fn test_get_daemon_status_when_stopped() {
        let state = AppState::default();
        let client_guard = state.client.read().await;
        assert!(client_guard.is_none());
    }
}
