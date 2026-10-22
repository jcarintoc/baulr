pub mod commands;
pub mod engine;
pub mod mobile;

use std::sync::Arc;
use tauri::Manager;
use tauri_specta::{collect_commands, Builder};
use tokio::sync::RwLock;

use crate::commands::accounts::{cancel_oauth, connect_account, disconnect_account};
use crate::commands::bandwidth::{get_bandwidth_limit, set_bandwidth_limit};
use crate::commands::browser::{
    create_vault_folder, delete_vault_item, download_vault_item, get_file_share_link,
    get_vault_media_base_url, list_provider_vault_files, list_vault_files, pick_destination_folder,
};
use crate::commands::mobile::{start_mobile_receiver, stop_mobile_receiver};
use crate::commands::offload::{
    cancel_offload, inspect_path, pick_offload_files, pick_offload_folder, reclaim_paths, start_offload,
};
use crate::commands::vault::get_vault_quota;
pub use crate::engine::{CloudAccount, VaultQuota};
use crate::engine::{DaemonStatus, RcloneClient, RcloneDaemon};


#[derive(Default, Clone)]
pub struct AppState {
    pub daemon: Arc<RwLock<Option<RcloneDaemon>>>,
    pub client: Arc<RwLock<Option<RcloneClient>>>,
    pub cached_quota: Arc<RwLock<Option<VaultQuota>>>,
    pub mobile_server: Arc<RwLock<Option<crate::mobile::MobileServerHandle>>>,
    pub media_server_id: Arc<RwLock<Option<String>>>,
    pub media_server_url: Arc<RwLock<Option<String>>>,
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

pub fn create_specta_builder() -> Builder<tauri::Wry> {
    Builder::<tauri::Wry>::new().commands(collect_commands![
        get_vault_quota,
        get_daemon_status,
        connect_account,
        disconnect_account,
        cancel_oauth,
        inspect_path,
        start_offload,
        cancel_offload,
        pick_offload_folder,
        pick_offload_files,
        reclaim_paths,
        list_vault_files,
        list_provider_vault_files,
        create_vault_folder,
        get_vault_media_base_url,
        delete_vault_item,
        download_vault_item,
        pick_destination_folder,
        get_file_share_link,
        start_mobile_receiver,
        stop_mobile_receiver,
        get_bandwidth_limit,
        set_bandwidth_limit
    ])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState::default();
    let daemon_holder = app_state.daemon.clone();
    let daemon_exit_holder = app_state.daemon.clone();
    let mobile_exit_holder = app_state.mobile_server.clone();
    let client_holder = app_state.client.clone();

    let specta_builder = create_specta_builder();

    #[cfg(debug_assertions)]
    specta_builder
        .export(
            specta_typescript::Typescript::default(),
            "../src/lib/bindings.ts",
        )
        .expect("Failed to export typescript bindings");

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
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

    let app = match builder.build(tauri::generate_context!()) {
        Ok(a) => a,
        Err(e) => {
            eprintln!("Failed to launch Baulr desktop application: {e}");
            return;
        }
    };

    app.run(move |_app_handle, event| {
        if let tauri::RunEvent::Exit = event {
            let _ = daemon_exit_holder.blocking_write().take();
            if let Some(mut server) = mobile_exit_holder.blocking_write().take() {
                server.stop();
            }
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_specta_builder_creation_and_export() {
        let builder = create_specta_builder();
        let export_res = builder.export(
            specta_typescript::Typescript::default(),
            "../src/lib/bindings.ts",
        );
        assert!(export_res.is_ok());
    }

    #[tokio::test]
    async fn test_get_daemon_status_when_stopped() {
        let state = AppState::default();
        let client_guard = state.client.read().await;
        assert!(client_guard.is_none());
    }
}
