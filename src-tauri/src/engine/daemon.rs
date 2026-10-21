use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

use crate::engine::client::RcloneClient;

pub struct RcloneDaemon {
    child: Option<Child>,
    client: RcloneClient,
}

impl RcloneDaemon {
    pub fn port(&self) -> u16 {
        self.client.port()
    }

    pub fn client(&self) -> &RcloneClient {
        &self.client
    }

    pub async fn start(data_dir: &Path) -> Result<Self, String> {
        let binary_path = resolve_rclone_binary()?;
        let config_path = data_dir.join("rclone.conf");
        let log_path = data_dir.join("rclone.log");

        if let Some(parent) = config_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }

        let mut cmd = Command::new(&binary_path);
        cmd.args([
            "rcd",
            "--rc-addr",
            "127.0.0.1:0",
            "--rc-no-auth",
            "--config",
            config_path.to_str().unwrap_or(""),
            "--log-level",
            "NOTICE",
            "--drive-chunk-size",
            "32M",
            "--drive-upload-cutoff",
            "32M",
            "--drive-pacer-min-sleep",
            "10ms",
            "--drive-pacer-burst",
            "200",
            "--onedrive-chunk-size",
            "32000k",
            "--buffer-size",
            "32M",
            "--transfers",
            "8",
            "--checkers",
            "16",
            "--fast-list",
            "--no-traverse",
            "--order-by",
            "size,ascending",
        ])
        .stderr(Stdio::piped())
        .stdout(Stdio::null());

        #[cfg(windows)]
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW

        let mut child = cmd
            .spawn()
            .map_err(|e| format!("Failed to spawn rclone daemon ({binary_path:?}): {e}"))?;

        let stderr = child
            .stderr
            .take()
            .ok_or_else(|| "Failed to capture rclone daemon stderr".to_string())?;

        let (tx, rx) = mpsc::channel();
        let log_path_clone = log_path.clone();

        // Background thread reads stderr lines to discover dynamic port and append to rclone.log
        thread::spawn(move || {
            let reader = BufReader::new(stderr);
            let mut log_file = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(&log_path_clone)
                .ok();

            let mut port_sent = false;
            for line in reader.lines().map_while(Result::ok) {
                if let Some(ref mut f) = log_file {
                    let _ = writeln!(f, "{line}");
                }
                if let Some(port) = extract_port_from_log_line(&line).filter(|_| !port_sent) {
                    let _ = tx.send(port);
                    port_sent = true;
                }
            }
        });

        let port = match rx.recv_timeout(Duration::from_secs(5)) {
            Ok(p) => p,
            Err(e) => {
                let _ = child.kill();
                return Err(format!("Timeout waiting for rclone port in stderr: {e}"));
            }
        };

        let client = RcloneClient::new(port);

        // Poll /rc/noop until daemon responds or timeout occurs
        let mut ready = false;
        for _ in 0..50 {
            if client.noop().await.is_ok() {
                ready = true;
                break;
            }
            tokio::time::sleep(Duration::from_millis(100)).await;
        }

        if !ready {
            let _ = child.kill();
            return Err("Daemon started but /rc/noop health check timed out".into());
        }

        Ok(Self {
            child: Some(child),
            client,
        })
    }

    pub async fn shutdown(&mut self) {
        let _ = self.client.quit().await;

        if let Some(mut child) = self.child.take() {
            // Give 1 second for graceful exit via quit, otherwise kill
            for _ in 0..10 {
                match child.try_wait() {
                    Ok(Some(_)) => return,
                    _ => thread::sleep(Duration::from_millis(100)),
                }
            }
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}

impl Drop for RcloneDaemon {
    fn drop(&mut self) {
        if let Some(mut child) = self.child.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}

pub fn extract_port_from_log_line(line: &str) -> Option<u16> {
    let needle = "Serving remote control on http://127.0.0.1:";
    let pos = line.find(needle)?;
    let rem = &line[pos + needle.len()..];
    let slash = rem.find('/')?;
    rem[..slash].parse::<u16>().ok()
}

pub fn rclone_sidecar_filename() -> &'static str {
    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    return "rclone-aarch64-apple-darwin";
    #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
    return "rclone-x86_64-apple-darwin";
    #[cfg(all(target_os = "windows", target_arch = "x86_64"))]
    return "rclone-x86_64-pc-windows-msvc.exe";
    #[cfg(all(target_os = "linux", target_arch = "x86_64"))]
    return "rclone-x86_64-unknown-linux-gnu";
    #[cfg(all(target_os = "linux", target_arch = "aarch64"))]
    return "rclone-aarch64-unknown-linux-gnu";

    #[allow(unreachable_code)]
    "rclone"
}

pub fn get_binary_search_candidates() -> Vec<PathBuf> {
    let mut candidates = Vec::new();
    let sidecar_name = rclone_sidecar_filename();

    // 1. Packaged location relative to current executable (Contents/MacOS on macOS)
    if let Some(exe_dir) = std::env::current_exe().ok().as_deref().and_then(Path::parent) {
        candidates.push(exe_dir.join(sidecar_name));
        candidates.push(exe_dir.join("rclone"));
        candidates.push(exe_dir.join("rclone.exe"));
        candidates.push(exe_dir.join("../Resources").join(sidecar_name));
        candidates.push(exe_dir.join("../Resources").join("rclone"));
    }

    // 2. Local workspace development paths
    candidates.push(PathBuf::from(format!("binaries/{sidecar_name}")));
    candidates.push(PathBuf::from(format!("src-tauri/binaries/{sidecar_name}")));
    candidates.push(PathBuf::from("binaries/rclone"));
    candidates.push(PathBuf::from("src-tauri/binaries/rclone"));

    // 3. System paths
    candidates.push(PathBuf::from("/opt/homebrew/bin/rclone"));
    candidates.push(PathBuf::from("/usr/local/bin/rclone"));
    candidates.push(PathBuf::from("/usr/bin/rclone"));

    candidates
}

fn resolve_rclone_binary() -> Result<PathBuf, String> {
    for path in get_binary_search_candidates() {
        if path.exists() {
            return Ok(path);
        }
    }

    // Fall back to standard PATH
    Ok(PathBuf::from("rclone"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_extract_port_from_log_line() {
        let log = "2026/10/13 11:50:44 NOTICE: Serving remote control on http://127.0.0.1:54437/";
        assert_eq!(extract_port_from_log_line(log), Some(54437));

        let invalid = "2026/10/13 11:50:44 NOTICE: Starting engine without remote";
        assert_eq!(extract_port_from_log_line(invalid), None);
    }

    #[test]
    fn test_binary_search_candidates() {
        let candidates = get_binary_search_candidates();
        assert!(!candidates.is_empty());
        let sidecar = rclone_sidecar_filename();
        assert!(candidates.iter().any(|c| {
            let s = c.to_string_lossy();
            s.contains(sidecar) || s.contains("rclone")
        }));
    }

    #[test]
    fn test_rclone_sidecar_filename_is_non_empty() {
        let name = rclone_sidecar_filename();
        assert!(!name.is_empty());
        assert!(name.contains("rclone"));
    }

    #[tokio::test]
    async fn test_daemon_lifecycle() {
        let dir = tempdir().expect("Failed to create tempdir");
        let mut daemon = RcloneDaemon::start(dir.path())
            .await
            .expect("Failed to start daemon in test");

        assert!(daemon.port() > 0);
        let noop_res = daemon.client().noop().await;
        assert!(noop_res.is_ok());

        daemon.shutdown().await;
    }
}
