use std::collections::HashMap;
use crate::engine::client::RcloneClient;

pub const VAULT_UNION_NAME: &str = "baulr_vault";
pub const VAULT_SUBDIR: &str = "BaulrVault";

/// Supported cloud storage provider backend types in Rclone.
const SUPPORTED_TYPES: &[&str] = &["drive", "onedrive"];

/// Inspects the configured remotes and returns sorted upstream strings for the union remote.
pub fn build_union_upstreams(
    config: &HashMap<String, HashMap<String, serde_json::Value>>,
) -> Vec<String> {
    let mut upstreams = Vec::new();

    for (name, params) in config {
        if name == VAULT_UNION_NAME {
            continue;
        }

        if let Some(rtype_val) = params.get("type") {
            if let Some(rtype) = rtype_val.as_str() {
                if SUPPORTED_TYPES.contains(&rtype) {
                    upstreams.push(format!("{name}:{VAULT_SUBDIR}"));
                }
            }
        }
    }

    upstreams.sort();
    upstreams
}

/// Dynamically maintains the `baulr_vault:` union remote according to connected accounts.
/// Returns Some(upstreams_string) if active, or None if no accounts are connected.
pub async fn sync_vault_union(client: &RcloneClient) -> Result<Option<String>, String> {
    let config = client.dump_config().await?;
    let upstreams = build_union_upstreams(&config);

    if upstreams.is_empty() {
        if config.contains_key(VAULT_UNION_NAME) {
            let _ = client.delete_remote(VAULT_UNION_NAME).await;
        }
        return Ok(None);
    }

    let upstreams_str = upstreams.join(" ");
    let mut params = HashMap::new();
    params.insert("upstreams".to_string(), upstreams_str.clone());
    params.insert("action_policy".to_string(), "mfs".to_string());
    params.insert("create_policy".to_string(), "mfs".to_string());
    params.insert("search_policy".to_string(), "ff".to_string());

    client
        .create_remote(VAULT_UNION_NAME, "union", &params)
        .await?;

    Ok(Some(upstreams_str))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_union_upstreams_empty_when_no_supported_remotes() {
        let mut config = HashMap::new();
        let mut union_params = HashMap::new();
        union_params.insert("type".to_string(), serde_json::json!("union"));
        config.insert("baulr_vault".to_string(), union_params);

        let upstreams = build_union_upstreams(&config);
        assert!(upstreams.is_empty());
    }

    #[test]
    fn test_build_union_upstreams_combines_gdrive_and_onedrive() {
        let mut config = HashMap::new();

        let mut gdrive_params = HashMap::new();
        gdrive_params.insert("type".to_string(), serde_json::json!("drive"));
        config.insert("gdrive".to_string(), gdrive_params);

        let mut onedrive_params = HashMap::new();
        onedrive_params.insert("type".to_string(), serde_json::json!("onedrive"));
        config.insert("onedrive".to_string(), onedrive_params);

        let upstreams = build_union_upstreams(&config);
        assert_eq!(upstreams, vec!["gdrive:BaulrVault", "onedrive:BaulrVault"]);
    }

    #[test]
    fn test_build_union_upstreams_single_provider() {
        let mut config = HashMap::new();

        let mut gdrive_params = HashMap::new();
        gdrive_params.insert("type".to_string(), serde_json::json!("drive"));
        config.insert("gdrive".to_string(), gdrive_params);

        let upstreams = build_union_upstreams(&config);
        assert_eq!(upstreams, vec!["gdrive:BaulrVault"]);
    }
}
