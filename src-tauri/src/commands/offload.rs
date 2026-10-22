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
    #[specta(type = f64)]
    pub max_file_bytes: u64,
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

pub fn format_bytes_human(bytes: u64) -> String {
    const KB: f64 = 1024.0;
    const MB: f64 = KB * 1024.0;
    const GB: f64 = MB * 1024.0;
    const TB: f64 = GB * 1024.0;

    let b = bytes as f64;
    if b >= TB {
        format!("{:.1} TB", b / TB)
    } else if b >= GB {
        format!("{:.1} GB", b / GB)
    } else if b >= MB {
        format!("{:.1} MB", b / MB)
    } else if b >= KB {
        format!("{:.1} KB", b / KB)
    } else {
        format!("{} B", bytes)
    }
}

pub fn calculate_path_size(path: &Path) -> Result<(u64, bool, u64), String> {
    let metadata = std::fs::metadata(path)
        .map_err(|e| format!("Cannot read file info for {:?}: {e}", path))?;

    if metadata.is_file() {
        let len = metadata.len();
        return Ok((len, false, len));
    }

    if metadata.is_dir() {
        let mut total_size = 0u64;
        let mut max_file_size = 0u64;
        let entries = std::fs::read_dir(path)
            .map_err(|e| format!("Cannot read directory {:?}: {e}", path))?;

        for entry in entries.flatten() {
            let entry_path = entry.path();
            if let Ok((child_size, _, child_max_file)) = calculate_path_size(&entry_path) {
                total_size = total_size.saturating_add(child_size);
                max_file_size = max_file_size.max(child_max_file);
            }
        }
        return Ok((total_size, true, max_file_size));
    }

    Err("Unsupported filesystem entry".to_string())
}

pub fn check_capacity(
    inspected: &InspectPathResult,
    target_provider: Option<&str>,
    quota: &crate::engine::VaultQuota,
) -> Result<(String, Option<String>), String> {
    let connected_accounts: Vec<_> = quota
        .accounts
        .iter()
        .filter(|a| a.is_connected && !a.needs_auth)
        .collect();

    if connected_accounts.is_empty() {
        return Err("No cloud accounts connected. Please connect a cloud storage account before offloading files.".to_string());
    }

    let is_auto = target_provider.map_or(true, |p| p.is_empty() || p == "auto");

    if !is_auto {
        let req_prov = target_provider.unwrap();
        let account = connected_accounts
            .iter()
            .find(|a| a.provider.eq_ignore_ascii_case(req_prov) || a.name.eq_ignore_ascii_case(req_prov))
            .ok_or_else(|| format!("Target cloud account '{req_prov}' is not connected"))?;

        let prov_free = account.total_bytes.saturating_sub(account.used_bytes);
        if inspected.size_bytes > prov_free {
            return Err(format!(
                "Not enough space in {}. This upload requires {}, but only {} is free.",
                account.name,
                format_bytes_human(inspected.size_bytes),
                format_bytes_human(prov_free)
            ));
        }

        return Ok((format!("{}:{VAULT_SUBDIR}", account.provider), Some(account.name.clone())));
    }

    // Auto / pooled mode
    if inspected.size_bytes > quota.free_bytes {
        return Err(format!(
            "Not enough cloud storage space. This upload requires {}, but your combined cloud pool only has {} free.",
            format_bytes_human(inspected.size_bytes),
            format_bytes_human(quota.free_bytes)
        ));
    }

    let max_single_account = connected_accounts
        .iter()
        .max_by_key(|a| a.total_bytes.saturating_sub(a.used_bytes))
        .unwrap();
    let max_single_free = max_single_account.total_bytes.saturating_sub(max_single_account.used_bytes);

    if inspected.max_file_bytes > max_single_free {
        if inspected.is_dir {
            return Err(format!(
                "This folder contains a file ({}) that is too large for your cloud accounts. Your largest available account ({}) has {} free.",
                format_bytes_human(inspected.max_file_bytes),
                max_single_account.name,
                format_bytes_human(max_single_free)
            ));
        } else {
            return Err(format!(
                "This file ({}) is too large for any single cloud account. Your largest available account ({}) has {} free.",
                format_bytes_human(inspected.size_bytes),
                max_single_account.name,
                format_bytes_human(max_single_free)
            ));
        }
    }

    Ok((format!("{VAULT_UNION_NAME}:"), Some(max_single_account.name.clone())))
}

#[tauri::command]
#[specta::specta]
pub async fn inspect_path(path: String) -> Result<InspectPathResult, String> {
    let p = PathBuf::from(&path);
    let (size_bytes, is_dir, max_file_bytes) = calculate_path_size(&p)?;
    let name = p
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    Ok(InspectPathResult {
        path,
        name,
        size_bytes,
        is_dir,
        max_file_bytes,
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

pub fn resolve_offload_destination_fs(dst_base_fs: &str, target_directory: Option<&str>) -> String {
    let clean_target_dir = target_directory
        .map(|d| d.trim().trim_matches('/'))
        .filter(|d| !d.is_empty());

    match clean_target_dir {
        Some(dir) => {
            let sep = if dst_base_fs.ends_with(':') { "" } else { "/" };
            format!("{dst_base_fs}{sep}{dir}")
        }
        None => dst_base_fs.to_string(),
    }
}

#[tauri::command]
#[specta::specta]
pub async fn start_offload(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    local_path: String,
    target_provider: Option<String>,
    target_directory: Option<String>,
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

    // Determine target destination and check capacity
    let (base_fs, chosen_provider_name) =
        check_capacity(&inspected, target_provider.as_deref(), &quota)?;

    let dst_base_fs = resolve_offload_destination_fs(&base_fs, target_directory.as_deref());

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
pub async fn pick_offload_files(
    app: tauri::AppHandle,
) -> Result<Option<Vec<String>>, String> {
    let dialog_app = app.clone();
    let files_opt = tokio::task::spawn_blocking(move || {
        dialog_app
            .dialog()
            .file()
            .set_title("Select Files to Free Up Space")
            .blocking_pick_files()
    })
    .await
    .map_err(|e| format!("Dialog task failed: {e}"))?;

    Ok(files_opt.map(|files| files.into_iter().map(|f| f.to_string()).collect()))
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
                let size = calculate_path_size(&path).map(|(s, _, _)| s).unwrap_or(0);
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

        let (size, is_dir, max_file) = calculate_path_size(&file_path).expect("calculate size");
        assert_eq!(size, 17);
        assert!(!is_dir);
        assert_eq!(max_file, 17);
    }

    #[test]
    fn test_calculate_path_size_directory() {
        let dir = tempdir().expect("tempdir");
        let sub = dir.path().join("subdir");
        std::fs::create_dir(&sub).expect("create dir");
        std::fs::write(sub.join("a.txt"), b"12345").expect("write file a");
        std::fs::write(sub.join("b.txt"), b"6789012").expect("write file b");

        let (size, is_dir, max_file) = calculate_path_size(&sub).expect("calculate dir size");
        assert_eq!(size, 12);
        assert!(is_dir);
        assert_eq!(max_file, 7);
    }

    #[test]
    fn test_format_bytes_human() {
        assert_eq!(format_bytes_human(500), "500 B");
        assert_eq!(format_bytes_human(1024), "1.0 KB");
        assert_eq!(format_bytes_human(1536 * 1024), "1.5 MB");
        assert_eq!(format_bytes_human(2 * 1024 * 1024 * 1024), "2.0 GB");
        assert_eq!(format_bytes_human(3 * 1024 * 1024 * 1024 * 1024), "3.0 TB");
    }

    #[test]
    fn test_capacity_check_fails_when_single_file_exceeds_largest_provider() {
        let quota = crate::engine::VaultQuota {
            total_bytes: 5 * 1024 * 1024 * 1024,
            used_bytes: 0,
            free_bytes: 5 * 1024 * 1024 * 1024,
            accounts: vec![
                crate::engine::CloudAccount {
                    name: "Google Drive".into(),
                    provider: "gdrive".into(),
                    total_bytes: 2 * 1024 * 1024 * 1024,
                    used_bytes: 0,
                    is_connected: true,
                    needs_auth: false,
                    account_email: None,
                },
                crate::engine::CloudAccount {
                    name: "OneDrive".into(),
                    provider: "onedrive".into(),
                    total_bytes: 3 * 1024 * 1024 * 1024,
                    used_bytes: 0,
                    is_connected: true,
                    needs_auth: false,
                    account_email: None,
                },
            ],
        };

        let inspected_large_file = InspectPathResult {
            path: "/path/video.mp4".into(),
            name: "video.mp4".into(),
            size_bytes: 4 * 1024 * 1024 * 1024,
            is_dir: false,
            max_file_bytes: 4 * 1024 * 1024 * 1024,
        };

        // Even though combined pool is 5 GB, 4 GB exceeds largest single account (3 GB OneDrive)
        let res = check_capacity(&inspected_large_file, None, &quota);
        assert!(res.is_err());
        let err = res.unwrap_err();
        assert!(err.contains("too large for any single cloud account"));
        assert!(err.contains("OneDrive"));
        assert!(err.contains("3.0 GB"));
    }

    #[test]
    fn test_capacity_check_fails_when_folder_contains_oversized_file() {
        let quota = crate::engine::VaultQuota {
            total_bytes: 10 * 1024 * 1024 * 1024,
            used_bytes: 0,
            free_bytes: 10 * 1024 * 1024 * 1024,
            accounts: vec![
                crate::engine::CloudAccount {
                    name: "OneDrive".into(),
                    provider: "onedrive".into(),
                    total_bytes: 2 * 1024 * 1024 * 1024,
                    used_bytes: 0,
                    is_connected: true,
                    needs_auth: false,
                    account_email: None,
                },
            ],
        };

        let inspected_folder = InspectPathResult {
            path: "/path/my_folder".into(),
            name: "my_folder".into(),
            size_bytes: 3 * 1024 * 1024 * 1024,
            is_dir: true,
            max_file_bytes: 2500 * 1024 * 1024,
        };

        let res = check_capacity(&inspected_folder, None, &quota);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("contains a file"));
    }

    #[test]
    fn test_capacity_check_fails_when_no_accounts_connected() {
        let quota = crate::engine::VaultQuota {
            total_bytes: 0,
            used_bytes: 0,
            free_bytes: 0,
            accounts: vec![],
        };

        let inspected = InspectPathResult {
            path: "/path/doc.pdf".into(),
            name: "doc.pdf".into(),
            size_bytes: 1024,
            is_dir: false,
            max_file_bytes: 1024,
        };

        let res = check_capacity(&inspected, None, &quota);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("No cloud accounts connected"));
    }

    #[test]
    fn test_capacity_check_succeeds_when_within_free_space() {
        let quota = crate::engine::VaultQuota {
            total_bytes: 10 * 1024 * 1024 * 1024,
            used_bytes: 0,
            free_bytes: 10 * 1024 * 1024 * 1024,
            accounts: vec![
                crate::engine::CloudAccount {
                    name: "OneDrive".into(),
                    provider: "onedrive".into(),
                    total_bytes: 10 * 1024 * 1024 * 1024,
                    used_bytes: 0,
                    is_connected: true,
                    needs_auth: false,
                    account_email: None,
                },
            ],
        };

        let inspected = InspectPathResult {
            path: "/path/doc.pdf".into(),
            name: "doc.pdf".into(),
            size_bytes: 1024,
            is_dir: false,
            max_file_bytes: 1024,
        };

        let res = check_capacity(&inspected, None, &quota);
        assert!(res.is_ok());
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

    #[test]
    fn test_resolve_offload_destination_fs() {
        assert_eq!(
            resolve_offload_destination_fs("baulr_vault:", None),
            "baulr_vault:"
        );
        assert_eq!(
            resolve_offload_destination_fs("baulr_vault:", Some("")),
            "baulr_vault:"
        );
        assert_eq!(
            resolve_offload_destination_fs("baulr_vault:", Some("   ")),
            "baulr_vault:"
        );
        assert_eq!(
            resolve_offload_destination_fs("baulr_vault:", Some("Documents")),
            "baulr_vault:Documents"
        );
        assert_eq!(
            resolve_offload_destination_fs("baulr_vault:", Some("/Documents/Work/")),
            "baulr_vault:Documents/Work"
        );
        assert_eq!(
            resolve_offload_destination_fs("gdrive:BaulrVault", None),
            "gdrive:BaulrVault"
        );
        assert_eq!(
            resolve_offload_destination_fs("gdrive:BaulrVault", Some("Documents")),
            "gdrive:BaulrVault/Documents"
        );
        assert_eq!(
            resolve_offload_destination_fs("gdrive:BaulrVault", Some("/Documents/Work/")),
            "gdrive:BaulrVault/Documents/Work"
        );
    }
}

