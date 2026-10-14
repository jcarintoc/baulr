use std::path::{Path, PathBuf};
use std::time::Duration;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::Emitter;

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
    if !p.exists() {
        return Err(format!("Path does not exist: {path}"));
    }

    let name = p
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    let (size_bytes, is_dir) = calculate_path_size(&p)?;

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

    // Pre-flight Capacity Gate
    let quota = fetch_vault_quota_internal(client).await?;
    check_capacity(inspected.size_bytes, quota.free_bytes)?;

    let job_id = if inspected.is_dir {
        let dst_fs = format!("{}:{}/", VAULT_UNION_NAME, inspected.name);
        client.start_copy(&inspected.path, &dst_fs).await?
    } else {
        let parent = Path::new(&inspected.path)
            .parent()
            .and_then(|p| p.to_str())
            .unwrap_or(".");
        let dst_fs = format!("{}:", VAULT_UNION_NAME);
        client
            .start_copy_file(parent, &inspected.name, &dst_fs, &inspected.name)
            .await?
    };

    let job_info = OffloadJobInfo {
        job_id,
        path: inspected.path.clone(),
        name: inspected.name.clone(),
        size_bytes: inspected.size_bytes,
    };

    // Spawn background telemetry streaming task
    let client_clone = client.clone();
    let app_handle = app.clone();
    let job_info_clone = job_info.clone();

    tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_millis(500));
        loop {
            interval.tick().await;

            let job_status_res = client_clone.get_job_status(job_info_clone.job_id).await;
            let stats_res = client_clone.get_stats().await;

            match job_status_res {
                Ok(status) => {
                    if status.finished {
                        let final_status = if status.success {
                            "completed"
                        } else {
                            "error"
                        };
                        let error = if !status.success {
                            Some(status.error)
                        } else {
                            None
                        };

                        let _ = app_handle.emit(
                            "vault://offload-progress",
                            OffloadProgress {
                                job_id: job_info_clone.job_id,
                                name: job_info_clone.name.clone(),
                                transferred_bytes: job_info_clone.size_bytes,
                                total_bytes: job_info_clone.size_bytes,
                                speed_bytes_per_sec: 0.0,
                                eta_seconds: 0,
                                status: final_status.to_string(),
                                error,
                            },
                        );
                        break;
                    }
                }
                Err(err) => {
                    let _ = app_handle.emit(
                        "vault://offload-progress",
                        OffloadProgress {
                            job_id: job_info_clone.job_id,
                            name: job_info_clone.name.clone(),
                            transferred_bytes: 0,
                            total_bytes: job_info_clone.size_bytes,
                            speed_bytes_per_sec: 0.0,
                            eta_seconds: 0,
                            status: "error".to_string(),
                            error: Some(err),
                        },
                    );
                    break;
                }
            }

            if let Ok(stats) = stats_res {
                let speed = stats.speed;
                let transferred = stats.bytes.min(job_info_clone.size_bytes);
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
}
