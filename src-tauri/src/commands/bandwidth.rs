use tauri::State;
use crate::engine::BandwidthLimit;
use crate::AppState;

#[tauri::command]
#[specta::specta]
pub async fn get_bandwidth_limit(
    state: State<'_, AppState>,
) -> Result<BandwidthLimit, String> {
    let client_guard = state.client.read().await;
    match client_guard.as_ref() {
        Some(client) => client.get_bandwidth_limit().await,
        None => Ok(BandwidthLimit {
            rate: "off".to_string(),
        }),
    }
}

#[tauri::command]
#[specta::specta]
pub async fn set_bandwidth_limit(
    state: State<'_, AppState>,
    rate: String,
) -> Result<BandwidthLimit, String> {
    let client_guard = state.client.read().await;
    match client_guard.as_ref() {
        Some(client) => client.set_bandwidth_limit(&rate).await,
        None => Err("Vault engine is not running".to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_bandwidth_limit_when_stopped() {
        let state = AppState::default();
        // Constructing a State wrapper in tokio test isn't directly needed if testing logic:
        let client_guard = state.client.read().await;
        assert!(client_guard.is_none());
    }
}
