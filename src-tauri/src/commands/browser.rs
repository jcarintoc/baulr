use std::path::Path;
use std::time::Duration;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::Emitter;
use tauri_plugin_dialog::DialogExt;

use crate::engine::{build_union_upstreams, RcloneItem, VaultQuota, VAULT_SUBDIR, VAULT_UNION_NAME};
use crate::AppState;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
    #[specta(type = f64)]
    pub job_id: u64,
    pub path: String,
    pub name: String,
    #[specta(type = f64)]
    pub transferred_bytes: u64,
    #[specta(type = f64)]
    pub total_bytes: u64,
    pub speed_bytes_per_sec: f64,
    #[specta(type = f64)]
    pub eta_seconds: u64,
    pub status: String,
    pub error: Option<String>,
    pub destination_dir: String,
}

pub fn resolve_unique_destination_name(
    destination_dir: &Path,
    item_name: &str,
    is_dir: bool,
) -> String {
    if !destination_dir.join(item_name).exists() {
        return item_name.to_string();
    }

    let (stem, ext) = if is_dir {
        (item_name.to_string(), String::new())
    } else {
        let path = Path::new(item_name);
        let stem = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or(item_name)
            .to_string();
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| format!(".{}", e))
            .unwrap_or_default();
        (stem, ext)
    };

    let mut counter = 1;
    loop {
        let candidate = format!("{} ({}){}", stem, counter, ext);
        if !destination_dir.join(&candidate).exists() {
            return candidate;
        }
        counter += 1;
    }
}

pub fn format_download_targets(
    item_path: &str,
    item_name: &str,
    is_dir: bool,
    destination_dir: &str,
    provider: Option<&str>,
) -> (String, String, String) {
    let dest_path = Path::new(destination_dir);
    let resolved_name = resolve_unique_destination_name(dest_path, item_name, is_dir);

    let base_remote = match provider.filter(|p| !p.trim().is_empty()) {
        Some(p) => format!("{p}:{VAULT_SUBDIR}"),
        None => format!("{VAULT_UNION_NAME}:"),
    };

    if is_dir {
        let src_fs = if base_remote.ends_with(':') {
            format!("{base_remote}{item_path}/")
        } else {
            format!("{base_remote}/{item_path}/")
        };
        let dst_fs = dest_path
            .join(&resolved_name)
            .to_string_lossy()
            .to_string();
        (src_fs, dst_fs, resolved_name)
    } else {
        (base_remote, destination_dir.to_string(), resolved_name)
    }
}

#[tauri::command]
#[specta::specta]
pub async fn list_vault_files(
    state: tauri::State<'_, AppState>,
    path: Option<String>,
) -> Result<Vec<RcloneItem>, String> {
    let client_guard = state.client.read().await;
    let client = client_guard.as_ref().ok_or("Vault engine is not running")?;
    let config = client.dump_config().await?;
    if !config.contains_key(VAULT_UNION_NAME) {
        return Ok(Vec::new());
    }
    let fs = format!("{}:", VAULT_UNION_NAME);
    let remote = path.unwrap_or_default();
    client.list_files(&fs, &remote).await
}

#[tauri::command]
#[specta::specta]
pub async fn list_provider_vault_files(
    state: tauri::State<'_, AppState>,
    provider: String,
    path: Option<String>,
) -> Result<Vec<RcloneItem>, String> {
    let client_guard = state.client.read().await;
    let client = client_guard.as_ref().ok_or("Vault engine is not running")?;
    let fs = format!("{}:{}", provider, VAULT_SUBDIR);
    let remote = path.unwrap_or_default();
    client.list_files(&fs, &remote).await
}

#[tauri::command]
#[specta::specta]
pub async fn get_vault_media_base_url(
    state: tauri::State<'_, AppState>,
) -> Result<Option<String>, String> {
    {
        let url_guard = state.media_server_url.read().await;
        if let Some(ref url) = *url_guard {
            return Ok(Some(url.clone()));
        }
    }

    let client_guard = state.client.read().await;
    let client = match client_guard.as_ref() {
        Some(c) => c,
        None => return Ok(None),
    };

    let config = client.dump_config().await?;
    if !config.contains_key(VAULT_UNION_NAME) {
        return Ok(None);
    }

    let fs = format!("{}:", VAULT_UNION_NAME);
    let info = client.start_http_server(&fs, "127.0.0.1:0").await?;
    let base_url = format!("http://{}", info.addr);

    *state.media_server_id.write().await = Some(info.id);
    *state.media_server_url.write().await = Some(base_url.clone());

    Ok(Some(base_url))
}

pub async fn stop_media_server(state: &AppState) {
    let id_opt = state.media_server_id.write().await.take();
    let _ = state.media_server_url.write().await.take();
    if let Some(id) = id_opt {
        if let Some(client) = state.client.read().await.as_ref() {
            let _ = client.stop_http_server(&id).await;
        }
    }
}

pub fn validate_folder_name(name: &str) -> Result<&str, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Folder name cannot be empty".to_string());
    }
    if trimmed.contains(&['/', '\\', ':', '*', '?', '"', '<', '>', '|']) {
        return Err("Folder name cannot contain special characters (/ \\ : * ? \" < > |)".to_string());
    }
    Ok(trimmed)
}

pub fn resolve_target_folder_upstream(
    target_provider: Option<&str>,
    connected_upstreams: &[String],
    quota: Option<&VaultQuota>,
) -> Result<String, String> {
    if connected_upstreams.is_empty() {
        return Err("No cloud accounts connected to create folder".to_string());
    }

    let is_auto = target_provider.map_or(true, |p| p.trim().is_empty() || p.eq_ignore_ascii_case("auto"));

    if !is_auto {
        let prov = target_provider.unwrap().trim();
        if let Some(upstream) = connected_upstreams
            .iter()
            .find(|u| u.split(':').next().is_some_and(|p| p.eq_ignore_ascii_case(prov)))
        {
            return Ok(upstream.clone());
        }
        return Err(format!("Selected provider '{prov}' is not connected"));
    }

    // Auto / pooled mode: pick the upstream provider with the most free space if quota is available
    if let Some(q) = quota {
        let candidate = q
            .accounts
            .iter()
            .filter(|a| a.is_connected && !a.needs_auth)
            .filter(|a| {
                connected_upstreams
                    .iter()
                    .any(|u| u.split(':').next().is_some_and(|p| p.eq_ignore_ascii_case(&a.provider)))
            })
            .max_by_key(|a| a.total_bytes.saturating_sub(a.used_bytes));

        if let Some(best) = candidate {
            return Ok(format!("{}:{}", best.provider, VAULT_SUBDIR));
        }
    }

    // Fallback: pick the first available connected upstream
    Ok(connected_upstreams[0].clone())
}

#[tauri::command]
#[specta::specta]
pub async fn create_vault_folder(
    state: tauri::State<'_, AppState>,
    folder_path: String,
    provider: Option<String>,
) -> Result<String, String> {
    let client_guard = state.client.read().await;
    let client = client_guard.as_ref().ok_or("Vault engine is not running")?;

    let clean_path = folder_path.trim().trim_matches('/');
    if clean_path.is_empty() {
        return Err("Folder path cannot be empty".to_string());
    }

    let leaf_name = clean_path.split('/').next_back().unwrap_or(clean_path);
    validate_folder_name(leaf_name)?;

    let config = client.dump_config().await.unwrap_or_default();
    let upstreams = build_union_upstreams(&config);
    if upstreams.is_empty() {
        return Err("No cloud accounts connected to create folder".to_string());
    }

    let cached_quota = state.cached_quota.read().await.clone();
    let target_upstream = resolve_target_folder_upstream(provider.as_deref(), &upstreams, cached_quota.as_ref())?;

    // Create folder on the single target upstream remote
    client.mkdir(&target_upstream, clean_path).await?;
    let _ = client.clear_fs_cache().await;

    // Extract provider identifier from target_upstream (e.g. "gdrive:BaulrVault" -> "gdrive")
    let provider_id = target_upstream
        .split(':')
        .next()
        .unwrap_or(&target_upstream)
        .to_string();

    Ok(provider_id)
}

#[tauri::command]
#[specta::specta]
pub async fn delete_vault_item(
    state: tauri::State<'_, AppState>,
    item_path: String,
    is_dir: bool,
    provider: Option<String>,
) -> Result<(), String> {
    let client_guard = state.client.read().await;
    let client = client_guard.as_ref().ok_or("Vault engine is not running")?;
    let fs = match provider.as_deref().filter(|p| !p.trim().is_empty()) {
        Some(p) => format!("{p}:{VAULT_SUBDIR}"),
        None => format!("{VAULT_UNION_NAME}:"),
    };

    if is_dir {
        client.purge_dir(&fs, &item_path).await
    } else {
        client.delete_file(&fs, &item_path).await
    }
}

#[tauri::command]
#[specta::specta]
pub async fn download_vault_item(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    item_path: String,
    item_name: String,
    is_dir: bool,
    destination_dir: String,
    provider: Option<String>,
) -> Result<f64, String> {
    let client_guard = state.client.read().await;
    let client = client_guard.as_ref().ok_or("Vault engine is not running")?;
    let group = format!(
        "download-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis()
    );

    let (src_fs, dst_fs, resolved_name) =
        format_download_targets(&item_path, &item_name, is_dir, &destination_dir, provider.as_deref());

    let dest_display = if is_dir {
        dst_fs.clone()
    } else {
        Path::new(&destination_dir)
            .join(&resolved_name)
            .to_string_lossy()
            .to_string()
    };

    let job_id = if is_dir {
        client.start_copy(&src_fs, &dst_fs, &group).await?
    } else {
        client
            .start_copy_file(&src_fs, &item_path, &dst_fs, &resolved_name, &group)
            .await?
    };

    let _ = app.emit(
        "vault://download-progress",
        DownloadProgress {
            job_id,
            path: item_path.clone(),
            name: resolved_name.clone(),
            transferred_bytes: 0,
            total_bytes: 0,
            speed_bytes_per_sec: 0.0,
            eta_seconds: 0,
            status: "downloading".to_string(),
            error: None,
            destination_dir: dest_display.clone(),
        },
    );

    let client_clone = client.clone();
    let app_handle = app.clone();
    let path_clone = item_path.clone();
    let name_clone = resolved_name.clone();
    let dest_clone = dest_display.clone();
    let group_clone = group.clone();

    tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_millis(500));
        loop {
            interval.tick().await;

            let job_status_res = client_clone.get_job_status(job_id).await;
            let stats_res = client_clone.get_stats(Some(&group_clone)).await;

            let terminal = match job_status_res {
                Ok(status) if status.finished => {
                    let (st, err) = if status.success {
                        ("completed", None)
                    } else {
                        ("error", Some(status.error))
                    };
                    Some((st, err))
                }
                Err(err) => Some(("error", Some(err))),
                _ => None,
            };

            if let Some((status, error)) = terminal {
                let total = stats_res.as_ref().map(|s| s.total_bytes).unwrap_or(0);
                let _ = app_handle.emit(
                    "vault://download-progress",
                    DownloadProgress {
                        job_id,
                        path: path_clone,
                        name: name_clone,
                        transferred_bytes: total,
                        total_bytes: total,
                        speed_bytes_per_sec: 0.0,
                        eta_seconds: 0,
                        status: status.to_string(),
                        error,
                        destination_dir: dest_clone,
                    },
                );
                break;
            }

            if let Ok(stats) = stats_res {
                let _ = app_handle.emit(
                    "vault://download-progress",
                    DownloadProgress {
                        job_id,
                        path: path_clone.clone(),
                        name: name_clone.clone(),
                        transferred_bytes: stats.bytes,
                        total_bytes: stats.total_bytes,
                        speed_bytes_per_sec: stats.speed,
                        eta_seconds: stats.eta.unwrap_or(0),
                        status: "downloading".to_string(),
                        error: None,
                        destination_dir: dest_clone.clone(),
                    },
                );
            }
        }
    });

    Ok(job_id as f64)
}

#[tauri::command]
#[specta::specta]
pub async fn pick_destination_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let dialog_app = app.clone();
    let folder_opt = tokio::task::spawn_blocking(move || {
        dialog_app
            .dialog()
            .file()
            .set_title("Choose Download Destination Folder")
            .blocking_pick_folder()
    })
    .await
    .map_err(|e| format!("Dialog task failed: {e}"))?;

    Ok(folder_opt.map(|p| p.to_string()))
}

#[tauri::command]
#[specta::specta]
pub async fn get_file_share_link(
    state: tauri::State<'_, AppState>,
    path: String,
    provider: Option<String>,
) -> Result<String, String> {
    let client_guard = state.client.read().await;
    let client = client_guard.as_ref().ok_or("Vault engine is not running")?;
    let clean_path = path.trim_start_matches('/').to_string();

    if let Some(p) = provider.as_deref().filter(|p| !p.trim().is_empty()) {
        let upstream = format!("{p}:{VAULT_SUBDIR}");
        return client.get_public_link(&upstream, &clean_path).await;
    }

    let config = client.dump_config().await?;
    let upstreams = build_union_upstreams(&config);
    if upstreams.is_empty() {
        return Err("No cloud accounts connected".to_string());
    }

    let mut set = tokio::task::JoinSet::new();
    for upstream in upstreams {
        let client_clone = client.clone();
        let target_path = clean_path.clone();
        set.spawn(async move {
            client_clone.get_public_link(&upstream, &target_path).await
        });
    }

    let mut last_error = String::new();
    while let Some(res) = set.join_next().await {
        match res {
            Ok(Ok(link)) => {
                set.abort_all();
                return Ok(link);
            }
            Ok(Err(err)) => {
                last_error = err;
            }
            Err(join_err) => {
                last_error = join_err.to_string();
            }
        }
    }

    Err(if last_error.is_empty() || last_error.contains("not found") || last_error.contains("itemNotFound") {
        "File not found in any connected cloud account".to_string()
    } else {
        last_error
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_download_targets_no_collision() {
        let (src_dir, dst_dir, name) =
            format_download_targets("photos", "photos", true, "/nonexistent_dir/downloads", None);
        assert_eq!(src_dir, "baulr_vault:photos/");
        assert_eq!(dst_dir, "/nonexistent_dir/downloads/photos");
        assert_eq!(name, "photos");

        let (src_file, dst_file, file_name) =
            format_download_targets("doc.pdf", "doc.pdf", false, "/nonexistent_dir/downloads", None);
        assert_eq!(src_file, "baulr_vault:");
        assert_eq!(dst_file, "/nonexistent_dir/downloads");
        assert_eq!(file_name, "doc.pdf");
    }

    #[test]
    fn test_format_download_targets_with_specific_provider() {
        let (src_dir, dst_dir, name) =
            format_download_targets("photos", "photos", true, "/nonexistent_dir/downloads", Some("onedrive"));
        assert_eq!(src_dir, "onedrive:BaulrVault/photos/");
        assert_eq!(dst_dir, "/nonexistent_dir/downloads/photos");
        assert_eq!(name, "photos");

        let (src_file, dst_file, file_name) =
            format_download_targets("doc.pdf", "doc.pdf", false, "/nonexistent_dir/downloads", Some("gdrive"));
        assert_eq!(src_file, "gdrive:BaulrVault");
        assert_eq!(dst_file, "/nonexistent_dir/downloads");
        assert_eq!(file_name, "doc.pdf");
    }

    #[test]
    fn test_resolve_unique_destination_name_collision() {
        let tmp = std::env::temp_dir().join(format!(
            "baulr_test_coll_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_nanos()
        ));
        let _ = std::fs::create_dir_all(&tmp);

        // Directory collision
        let folder1 = tmp.join("photos");
        std::fs::create_dir(&folder1).unwrap();
        assert_eq!(resolve_unique_destination_name(&tmp, "photos", true), "photos (1)");

        let folder2 = tmp.join("photos (1)");
        std::fs::create_dir(&folder2).unwrap();
        assert_eq!(resolve_unique_destination_name(&tmp, "photos", true), "photos (2)");

        // File collision
        let file1 = tmp.join("report.pdf");
        std::fs::write(&file1, b"test").unwrap();
        assert_eq!(resolve_unique_destination_name(&tmp, "report.pdf", false), "report (1).pdf");

        let file2 = tmp.join("report (1).pdf");
        std::fs::write(&file2, b"test2").unwrap();
        assert_eq!(resolve_unique_destination_name(&tmp, "report.pdf", false), "report (2).pdf");

        let _ = std::fs::remove_dir_all(&tmp);
    }

    #[test]
    fn test_validate_folder_name() {
        assert_eq!(validate_folder_name("Projects").unwrap(), "Projects");
        assert_eq!(validate_folder_name("  My Folder 2026  ").unwrap(), "My Folder 2026");

        // Empty checks
        assert!(validate_folder_name("").is_err());
        assert!(validate_folder_name("   ").is_err());

        // Banned characters
        assert!(validate_folder_name("Project/Sub").is_err());
        assert!(validate_folder_name("Project\\Sub").is_err());
        assert!(validate_folder_name("Doc:Name").is_err());
        assert!(validate_folder_name("Starred*").is_err());
        assert!(validate_folder_name("What?").is_err());
        assert!(validate_folder_name("\"Quotes\"").is_err());
        assert!(validate_folder_name("<Angle>").is_err());
        assert!(validate_folder_name("Pipe|Line").is_err());
    }

    #[test]
    fn test_resolve_target_folder_upstream_specific_provider() {
        let upstreams = vec![
            "gdrive:BaulrVault".to_string(),
            "onedrive:BaulrVault".to_string(),
        ];
        // Exact match
        let chosen = resolve_target_folder_upstream(Some("gdrive"), &upstreams, None).unwrap();
        assert_eq!(chosen, "gdrive:BaulrVault");

        // Provider not connected returns error
        let err = resolve_target_folder_upstream(Some("dropbox"), &upstreams, None).unwrap_err();
        assert!(err.contains("Selected provider 'dropbox' is not connected"));
    }

    #[test]
    fn test_resolve_target_folder_upstream_auto_picks_max_free_space() {
        use crate::engine::CloudAccount;
        let upstreams = vec![
            "gdrive:BaulrVault".to_string(),
            "onedrive:BaulrVault".to_string(),
        ];
        let quota = VaultQuota {
            total_bytes: 30_000_000_000,
            used_bytes: 10_000_000_000,
            free_bytes: 20_000_000_000,
            accounts: vec![
                CloudAccount {
                    name: "Google Drive".to_string(),
                    provider: "gdrive".to_string(),
                    total_bytes: 15_000_000_000,
                    used_bytes: 12_000_000_000, // 3 GB free
                    is_connected: true,
                    needs_auth: false,
                },
                CloudAccount {
                    name: "OneDrive".to_string(),
                    provider: "onedrive".to_string(),
                    total_bytes: 15_000_000_000,
                    used_bytes: 5_000_000_000, // 10 GB free
                    is_connected: true,
                    needs_auth: false,
                },
            ],
        };

        // Auto mode should pick onedrive because it has 10 GB free vs 3 GB
        let chosen_auto = resolve_target_folder_upstream(Some("auto"), &upstreams, Some(&quota)).unwrap();
        assert_eq!(chosen_auto, "onedrive:BaulrVault");

        // None provider should also behave like auto
        let chosen_none = resolve_target_folder_upstream(None, &upstreams, Some(&quota)).unwrap();
        assert_eq!(chosen_none, "onedrive:BaulrVault");
    }

    #[test]
    fn test_resolve_target_folder_upstream_auto_fallback_without_quota() {
        let upstreams = vec![
            "gdrive:BaulrVault".to_string(),
            "onedrive:BaulrVault".to_string(),
        ];
        let chosen = resolve_target_folder_upstream(None, &upstreams, None).unwrap();
        assert_eq!(chosen, "gdrive:BaulrVault");
    }
}
