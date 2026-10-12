use serde::{Deserialize, Serialize};
use specta::Type;
use tauri_specta::{collect_commands, Builder};

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let specta_builder = Builder::<tauri::Wry>::new()
        .commands(collect_commands![get_vault_quota]);

    #[cfg(debug_assertions)]
    specta_builder
        .export(
            specta_typescript::Typescript::default(),
            "../src/lib/bindings.ts",
        )
        .expect("Failed to export typescript bindings");

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
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
}
