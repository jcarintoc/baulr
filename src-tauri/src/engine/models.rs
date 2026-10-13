use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DaemonStatus {
    pub is_running: bool,
    pub port: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CoreStats {
    #[specta(type = f64)]
    pub bytes: u64,
    pub speed: f64,
    #[specta(type = f64)]
    pub transfers: u64,
    #[specta(type = f64)]
    pub total_bytes: u64,
    #[specta(type = f64)]
    pub errors: u64,
    pub fatal_error: bool,
}
