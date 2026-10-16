use tauri::Manager;
use crate::mobile::{MobileReceiverInfo, MobileReceiverStatus};
use crate::AppState;

#[tauri::command]
#[specta::specta]
pub async fn start_mobile_receiver(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<MobileReceiverInfo, String> {
    let mut server_guard = state.mobile_server.write().await;
    if let Some(existing) = server_guard.as_ref() {
        return Ok(existing.info.clone());
    }

    let staging_dir = app
        .path()
        .app_data_dir()
        .map(|p| p.join("mobile_staging"))
        .unwrap_or_else(|_| std::path::PathBuf::from("data/mobile_staging"));

    let handle = crate::mobile::start_server(app, staging_dir).await?;
    let info = handle.info.clone();
    *server_guard = Some(handle);

    Ok(info)
}

#[tauri::command]
#[specta::specta]
pub async fn stop_mobile_receiver(
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let mut server_guard = state.mobile_server.write().await;
    if let Some(mut handle) = server_guard.take() {
        handle.stop();
    }
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn get_mobile_receiver_status(
    state: tauri::State<'_, AppState>,
) -> Result<MobileReceiverStatus, String> {
    let server_guard = state.mobile_server.read().await;
    match server_guard.as_ref() {
        Some(handle) => Ok(MobileReceiverStatus {
            is_running: true,
            url: Some(handle.info.url.clone()),
            port: Some(handle.info.port),
        }),
        None => Ok(MobileReceiverStatus {
            is_running: false,
            url: None,
            port: None,
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_mobile_receiver_status_when_stopped() {
        let state = AppState::default();
        let guard = state.mobile_server.read().await;
        assert!(guard.is_none());
    }
}
