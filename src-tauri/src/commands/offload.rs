use std::path::{Path, PathBuf};
use std::time::Duration;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::Emitter;
use tauri_plugin_dialog::DialogExt;

use crate::commands::vault::fetch_vault_quota_internal;
use crate::engine::VAULT_UNION_NAME;
use crate::AppState;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct InspectPathResult {
    pub path: String,
    pub name: String,
    #[specta(type = f64)]
    pub size_bytes: u64,
    pub is_dir: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct OffloadJobInfo {
    #[specta(type = f64)]
    pub job_id: u64,
    pub path: String,
    pub name: String,
    #[specta(type = f64)]
    pub size_bytes: u64,
    pub target_provider: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct OffloadProgress {
    #[specta(type = f64)]
    pub job_id: u64,
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
    pub target_provider: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ReclaimResult {
    #[specta(type = f64)]
    pub reclaimed_bytes: u64,
    pub count: u32,
}

pub fn calculate_path_size(path: &Path) -> Result<(u64, bool), String> {
    let metadata = std::fs::metadata(path)
        .map_err(|e| format!("Cannot read file info for {:?}: {e}", path))?;

    if metadata.is_file() {
        return Ok((metadata.len(), false));
    }

    if metadata.is_dir() {
        let mut total_size = 0u64;
        let entries = std::fs::read_dir(path)
            .map_err(|e| format!("Cannot read directory {:?}: {e}", path))?;

        for entry in entries.flatten() {
            let entry_path = entry.path();
            if let Ok((child_size, _)) = calculate_path_size(&entry_path) {
                total_size = total_size.saturating_add(child_size);
            }
        }
        return Ok((total_size, true));
    }

    Err("Unsupported filesystem entry".to_string())
}

pub fn check_capacity(required_bytes: u64, available_bytes: u64) -> Result<(), String> {
    if required_bytes > available_bytes {
        return Err(format!(
            "Not enough cloud storage space. Selected item requires {} bytes, but only {} bytes are available.",
            required_bytes, available_bytes
        ));
    }
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn inspect_path(path: String) -> Result<InspectPathResult, String> {
    let p = PathBuf::from(&path);
    let (size_bytes, is_dir) = calculate_path_size(&p)?;
    let name = p
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    Ok(InspectPathResult {
        path,
        name,
        size_bytes,
        is_dir,
    })
}

#[tauri::command]
#[specta::specta]
pub async fn start_offload(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    local_path: String,
) -> Result<OffloadJobInfo, String> {
    let client_guard = state.client.read().await;
    let client = client_guard.as_ref().ok_or("Vault engine is not running")?;

    let inspected = inspect_path(local_path.clone()).await?;

    // Pre-flight Capacity Gate: use cached quota if available, fallback to live query
    let quota = {
        let cached = state.cached_quota.read().await.clone();
        match cached {
            Some(q) => q,
            None => {
                let fresh = fetch_vault_quota_internal(client).await?;
                *state.cached_quota.write().await = Some(fresh.clone());
                fresh
            }
        }
    };
    check_capacity(inspected.size_bytes, quota.free_bytes)?;

    // Determine target cloud provider (mfs policy routes to account with most free space)
    let target_provider = quota
        .accounts
        .iter()
        .filter(|a| a.is_connected && !a.needs_auth)
        .max_by_key(|a| a.total_bytes.saturating_sub(a.used_bytes))
        .map(|a| a.name.clone());

    let group = format!(
        "offload-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis()
    );

    let job_id = if inspected.is_dir {
        let dst_fs = format!("{}:{}/", VAULT_UNION_NAME, inspected.name);
        client.start_copy(&inspected.path, &dst_fs, &group).await?
    } else {
        let parent = Path::new(&inspected.path)
            .parent()
            .and_then(|p| p.to_str())
            .unwrap_or(".");
        let dst_fs = format!("{}:", VAULT_UNION_NAME);
        client
            .start_copy_file(parent, &inspected.name, &dst_fs, &inspected.name, &group)
            .await?
    };

    let job_info = OffloadJobInfo {
        job_id,
        path: inspected.path.clone(),
        name: inspected.name.clone(),
        size_bytes: inspected.size_bytes,
        target_provider: target_provider.clone(),
    };

    // Spawn background telemetry streaming task
    let client_clone = client.clone();
    let app_handle = app.clone();
    let job_info_clone = job_info.clone();
    let group_clone = group.clone();

    tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_millis(500));
        loop {
            interval.tick().await;

            let job_status_res = client_clone.get_job_status(job_info_clone.job_id).await;
            let stats_res = client_clone.get_stats(Some(&group_clone)).await;

            let terminal = match job_status_res {
                Ok(status) if status.finished => {
                    let (st, err) = if status.success {
                        ("completed", None)
                    } else {
                        ("error", Some(status.error))
                    };
                    Some((st, job_info_clone.size_bytes, err))
                }
                Err(err) => Some(("error", 0, Some(err))),
                _ => None,
            };

            if let Some((status, transferred, error)) = terminal {
                let _ = app_handle.emit(
                    "vault://offload-progress",
                    OffloadProgress {
                        job_id: job_info_clone.job_id,
                        name: job_info_clone.name.clone(),
                        transferred_bytes: transferred,
                        total_bytes: job_info_clone.size_bytes,
                        speed_bytes_per_sec: 0.0,
                        eta_seconds: 0,
                        status: status.to_string(),
                        error,
                        target_provider: job_info_clone.target_provider.clone(),
                    },
                );
                break;
            }

            if let Ok(stats) = stats_res {
                let speed = stats.speed;
                // Cap in-flight progress to 99% until terminal completion confirms 100%
                let max_in_flight = job_info_clone.size_bytes.saturating_sub(1);
                let transferred = stats.bytes.min(max_in_flight);
                let eta = stats.eta.unwrap_or(0);

                let _ = app_handle.emit(
                    "vault://offload-progress",
                    OffloadProgress {
                        job_id: job_info_clone.job_id,
                        name: job_info_clone.name.clone(),
                        transferred_bytes: transferred,
                        total_bytes: job_info_clone.size_bytes,
                        speed_bytes_per_sec: speed,
                        eta_seconds: eta,
                        status: "uploading".to_string(),
                        error: None,
                        target_provider: job_info_clone.target_provider.clone(),
                    },
                );
            }
        }
    });

    Ok(job_info)
}

#[tauri::command]
#[specta::specta]
pub async fn cancel_offload(
    state: tauri::State<'_, AppState>,
    job_id: u32,
) -> Result<(), String> {
    let client_guard = state.client.read().await;
    let client = client_guard.as_ref().ok_or("Vault engine is not running")?;
    client.stop_job(job_id as u64).await
}

#[tauri::command]
#[specta::specta]
pub async fn pick_offload_folder(
    app: tauri::AppHandle,
) -> Result<Option<InspectPathResult>, String> {
    let dialog_app = app.clone();
    let folder_opt = tokio::task::spawn_blocking(move || {
        dialog_app
            .dialog()
            .file()
            .set_title("Select Folder to Free Up Space")
            .blocking_pick_folder()
    })
    .await
    .map_err(|e| format!("Dialog task failed: {e}"))?;

    let Some(file_path) = folder_opt else {
        return Ok(None);
    };
    inspect_path(file_path.to_string()).await.map(Some)
}

#[tauri::command]
#[specta::specta]
pub async fn reclaim_paths(paths: Vec<String>) -> Result<ReclaimResult, String> {
    tokio::task::spawn_blocking(move || {
        let mut count = 0u32;
        let mut reclaimed_bytes = 0u64;

        for path_str in paths {
            let path = PathBuf::from(&path_str);
            if path.exists() {
                let size = calculate_path_size(&path).map(|(s, _)| s).unwrap_or(0);
                trash::delete(&path)
                    .map_err(|e| format!("Failed to move {:?} to Trash: {e}", path))?;
                count += 1;
                reclaimed_bytes = reclaimed_bytes.saturating_add(size);
            }
        }

        Ok(ReclaimResult {
            reclaimed_bytes,
            count,
        })
    })
    .await
    .map_err(|e| format!("Reclaim task failed: {e}"))?
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_calculate_path_size_file() {
        let dir = tempdir().expect("tempdir");
        let file_path = dir.path().join("test.txt");
        std::fs::write(&file_path, b"hello world 12345").expect("write test file");

        let (size, is_dir) = calculate_path_size(&file_path).expect("calculate size");
        assert_eq!(size, 17);
        assert!(!is_dir);
    }

    #[test]
    fn test_calculate_path_size_directory() {
        let dir = tempdir().expect("tempdir");
        let sub = dir.path().join("subdir");
        std::fs::create_dir(&sub).expect("create dir");
        std::fs::write(sub.join("a.txt"), b"12345").expect("write file a");
        std::fs::write(sub.join("b.txt"), b"67890").expect("write file b");

        let (size, is_dir) = calculate_path_size(&sub).expect("calculate dir size");
        assert_eq!(size, 10);
        assert!(is_dir);
    }

    #[test]
    fn test_capacity_check_fails_when_exceeding_free_space() {
        let free_space = 1000;
        let required_space = 2000;
        let result = check_capacity(required_space, free_space);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Not enough cloud storage space"));
    }

    #[test]
    fn test_capacity_check_succeeds_when_within_free_space() {
        let free_space = 5000;
        let required_space = 2000;
        let result = check_capacity(required_space, free_space);
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_reclaim_paths() {
        let dir = tempdir().expect("tempdir");
        let file_path = dir.path().join("reclaim_me.txt");
        std::fs::write(&file_path, b"delete this").expect("write file");

        let res = reclaim_paths(vec![file_path.to_string_lossy().to_string()])
            .await
            .expect("reclaim");
        assert_eq!(res.count, 1);
        assert_eq!(res.reclaimed_bytes, 11);
        assert!(!file_path.exists());
    }
}
