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
    #[specta(type = Option<f64>)]
    pub eta: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct JobStatus {
    #[specta(type = f64)]
    pub id: u64,
    pub finished: bool,
    pub success: bool,
    pub error: String,
    pub duration: f64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AboutFs {
    #[specta(type = Option<f64>)]
    pub total: Option<u64>,
    #[specta(type = Option<f64>)]
    pub used: Option<u64>,
    #[specta(type = Option<f64>)]
    pub free: Option<u64>,
    #[specta(type = Option<f64>)]
    pub trashed: Option<u64>,
    #[specta(type = Option<f64>)]
    pub other: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct OAuthStatus {
    pub status: String,
    #[serde(default)]
    pub auth_url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
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

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
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


