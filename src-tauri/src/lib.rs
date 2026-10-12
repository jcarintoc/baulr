use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CloudAccount {
    pub name: String,
    pub provider: String,
    pub used_bytes: u64,
    pub total_bytes: u64,
    pub is_connected: bool,
    pub needs_auth: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultQuota {
    pub total_bytes: u64,
    pub used_bytes: u64,
    pub free_bytes: u64,
    pub accounts: Vec<CloudAccount>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_vault_quota]);

    if let Err(e) = builder.run(tauri::generate_context!()) {
        eprintln!("Failed to launch Baulr desktop application: {e}");
    }
}
