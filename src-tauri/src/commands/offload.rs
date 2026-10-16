use std::path::{Path, PathBuf};
use std::time::Duration;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::Emitter;
use tauri_plugin_dialog::DialogExt;

use crate::commands::vault::fetch_vault_quota_internal;
use crate::engine::{VAULT_SUBDIR, VAULT_UNION_NAME};
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
    pub is_dir: bool,
}

pub fn determine_verification_terminal_status(
    transfer_success: bool,
    transfer_error: Option<String>,
    check_result: Option<Result<crate::engine::CheckResult, String>>,
) -> (&'static str, Option<String>) {
    if !transfer_success {
        return ("error", transfer_error);
    }

    match check_result {
        Some(Ok(check)) if check.success => ("completed", None),
        Some(Ok(check)) => ("error", Some(format!("Integrity check failed: {}", check.status))),
        Some(Err(err)) => ("error", Some(format!("Integrity check error: {err}"))),
        None => ("error", Some("Integrity check not performed".to_string())),
    }
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

pub fn resolve_unique_cloud_name(existing_names: &[&str], item_name: &str, is_dir: bool) -> String {
    if !existing_names.contains(&item_name) {
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

    (1..)
        .map(|i| format!("{stem} ({i}){ext}"))
        .find(|candidate| !existing_names.contains(&candidate.as_str()))
        .unwrap_or_else(|| item_name.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn start_offload(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    local_path: String,
    target_provider: Option<String>,
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
                let fresh = fetch_vault_quota_internal(client, None).await?;
                *state.cached_quota.write().await = Some(fresh.clone());
                fresh
            }
        }
    };

    // Determine target provider, destination base fs, and available bytes
    let is_auto = target_provider.as_deref().map_or(true, |p| p.is_empty() || p == "auto");

    let (dst_base_fs, chosen_provider_name, available_bytes) = if is_auto {
        let auto_account = quota
            .accounts
            .iter()
            .filter(|a| a.is_connected && !a.needs_auth)
            .max_by_key(|a| a.total_bytes.saturating_sub(a.used_bytes));
        let provider_name = auto_account.map(|a| a.name.clone());
        (format!("{VAULT_UNION_NAME}:"), provider_name, quota.free_bytes)
    } else {
        let req_prov = target_provider.as_deref().unwrap();
        let account = quota
            .accounts
            .iter()
            .find(|a| a.provider.eq_ignore_ascii_case(req_prov) || a.name.eq_ignore_ascii_case(req_prov))
            .ok_or_else(|| format!("Target cloud provider '{req_prov}' is not connected"))?;

        if !account.is_connected || account.needs_auth {
            return Err(format!("Target cloud provider '{}' requires authentication", account.name));
        }

        let prov_free = account.total_bytes.saturating_sub(account.used_bytes);
        (format!("{}:{VAULT_SUBDIR}", account.provider), Some(account.name.clone()), prov_free)
    };

    check_capacity(inspected.size_bytes, available_bytes)?;

    // Pre-flight Cloud Duplicate Disambiguation (ISSUE-05 & ISSUE-08)
    let existing_items = client.list_files(&dst_base_fs, "").await.unwrap_or_default();
    let existing_names: Vec<&str> = existing_items.iter().map(|i| i.name.as_str()).collect();
    let final_name = resolve_unique_cloud_name(&existing_names, &inspected.name, inspected.is_dir);

    let group = format!(
        "offload-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis()
    );

    let (job_id, dst_dir_fs) = if inspected.is_dir {
        let dst_fs = if dst_base_fs.ends_with(':') {
            format!("{dst_base_fs}{final_name}/")
        } else {
            format!("{dst_base_fs}/{final_name}/")
        };
        let jid = client.start_copy(&inspected.path, &dst_fs, &group).await?;
        (jid, Some(dst_fs))
    } else {
        let parent = Path::new(&inspected.path)
            .parent()
            .and_then(|p| p.to_str())
            .unwrap_or(".");
        let jid = client
            .start_copy_file(parent, &inspected.name, &dst_base_fs, &final_name, &group)
            .await?;
        (jid, None)
    };

    let job_info = OffloadJobInfo {
        job_id,
        path: inspected.path.clone(),
        name: final_name.clone(),
        size_bytes: inspected.size_bytes,
        target_provider: chosen_provider_name.clone(),
        is_dir: inspected.is_dir,
    };

    // Spawn background telemetry streaming task
    let client_clone = client.clone();
    let app_handle = app.clone();
    let job_info_clone = job_info.clone();
    let group_clone = group.clone();
    let original_name = inspected.name;
    let dst_base_fs_clone = dst_base_fs.clone();

    tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_millis(500));
        loop {
            interval.tick().await;

            let job_status_res = client_clone.get_job_status(job_info_clone.job_id).await;
            let stats_res = client_clone.get_stats(Some(&group_clone)).await;

            let terminal = match job_status_res {
                Ok(status) if status.finished => {
                    let check_res = if status.success {
                        let res = if job_info_clone.is_dir {
                            let dst_fs = dst_dir_fs.clone().unwrap_or_default();
                            client_clone.check_hashes(&job_info_clone.path, &dst_fs, None).await
                        } else {
                            let parent = Path::new(&job_info_clone.path)
                                .parent()
                                .and_then(|p| p.to_str())
                                .unwrap_or(".");
                            if job_info_clone.name == original_name {
                                client_clone.check_hashes(parent, &dst_base_fs_clone, Some(&job_info_clone.name)).await
                            } else {
                                client_clone.check_single_file_hash(parent, &original_name, &dst_base_fs_clone, &job_info_clone.name).await
                            }
                        };
                        Some(res)
                    } else {
                        None
                    };

                    let (st, err) = determine_verification_terminal_status(
                        status.success,
                        if status.success { None } else { Some(status.error) },
                        check_res,
                    );
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

    #[test]
    fn test_verification_status_determination() {
        let (st, err) = determine_verification_terminal_status(
            false,
            Some("network failed".to_string()),
            None,
        );
        assert_eq!(st, "error");
        assert_eq!(err.as_deref(), Some("network failed"));

        let good_check = Ok(crate::engine::CheckResult {
            success: true,
            status: "OK".to_string(),
            differ: vec![],
            error: vec![],
        });
        let (st, err) = determine_verification_terminal_status(true, None, Some(good_check));
        assert_eq!(st, "completed");
        assert!(err.is_none());

        let bad_check = Ok(crate::engine::CheckResult {
            success: false,
            status: "1 differences found".to_string(),
            differ: vec!["file.txt".to_string()],
            error: vec![],
        });
        let (st, err) = determine_verification_terminal_status(true, None, Some(bad_check));
        assert_eq!(st, "error");
        assert!(err.unwrap().contains("Integrity check failed"));

        let err_check = Err("rclone error".to_string());
        let (st, err) = determine_verification_terminal_status(true, None, Some(err_check));
        assert_eq!(st, "error");
        assert!(err.unwrap().contains("Integrity check error"));
    }

    #[test]
    fn test_resolve_unique_cloud_name_no_collision() {
        let existing = ["other.txt", "vacation.png"];
        assert_eq!(
            resolve_unique_cloud_name(&existing, "report.pdf", false),
            "report.pdf"
        );
        assert_eq!(
            resolve_unique_cloud_name(&existing, "Photos", true),
            "Photos"
        );
    }

    #[test]
    fn test_resolve_unique_cloud_name_collision_file() {
        let existing = ["report.pdf"];
        assert_eq!(
            resolve_unique_cloud_name(&existing, "report.pdf", false),
            "report (1).pdf"
        );

        let existing_multiple = ["report.pdf", "report (1).pdf"];
        assert_eq!(
            resolve_unique_cloud_name(&existing_multiple, "report.pdf", false),
            "report (2).pdf"
        );
    }

    #[test]
    fn test_resolve_unique_cloud_name_collision_directory() {
        let existing = ["Photos"];
        assert_eq!(
            resolve_unique_cloud_name(&existing, "Photos", true),
            "Photos (1)"
        );

        let existing_multiple = ["Photos", "Photos (1)"];
        assert_eq!(
            resolve_unique_cloud_name(&existing_multiple, "Photos", true),
            "Photos (2)"
        );
    }
}

