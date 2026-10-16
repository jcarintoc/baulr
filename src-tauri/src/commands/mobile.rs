use tauri::Manager;
use crate::mobile::MobileReceiverInfo;
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

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_mobile_server_state_initial() {
        let state = AppState::default();
        let guard = state.mobile_server.read().await;
        assert!(guard.is_none());
    }
}
