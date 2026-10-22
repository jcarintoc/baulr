use serde::Deserialize;
use std::collections::HashMap;
use std::time::Duration;
use crate::engine::models::{
    AboutFs, BandwidthLimit, CheckResult, CoreStats, HttpServerInfo, JobStatus, OAuthStatus,
    RcloneConfigExample, RcloneConfigResponse, RcloneItem, RcloneListResponse,
};

#[derive(Deserialize)]
struct JobIdResponse {
    jobid: u64,
}

#[derive(Debug, Clone)]
pub struct RcloneClient {
    port: u16,
    base_url: String,
    http: reqwest::Client,
    http_oauth: reqwest::Client,
}

pub fn resolve_config_answer(name: &str, default_str: &str, examples: &[RcloneConfigExample]) -> String {
    match name {
        "config_is_local" => "true".to_string(),
        "config_shared_client_id" => "true".to_string(),
        "teamdrive" => "false".to_string(),
        "config_refresh_token" => "true".to_string(),
        "config_drive_ok" => "true".to_string(),
        "box_sub_type" => "user".to_string(),
        "config_type" | "choose_type" => "onedrive".to_string(),
        "config_driveid" | "choose_drive" => {
            // Find the primary personal "OneDrive" drive, avoiding internal/system containers
            if let Some(onedrive_ex) = examples.iter().find(|ex| {
                let h = ex.help.to_lowercase();
                h.starts_with("onedrive") || h.contains("onedrive")
            }) {
                onedrive_ex.value.clone()
            } else if let Some(clean_ex) = examples.iter().find(|ex| {
                let h = ex.help.to_lowercase();
                !h.contains("archive")
                    && !h.contains("metadata")
                    && !h.contains("bundle")
                    && !ex.value.starts_with("b!")
            }) {
                clean_ex.value.clone()
            } else if let Some(first) = examples.first() {
                first.value.clone()
            } else if !default_str.is_empty() {
                default_str.to_string()
            } else {
                "0".to_string()
            }
        }
        _ => {
            if !default_str.is_empty() {
                default_str.to_string()
            } else if let Some(first) = examples.first() {
                first.value.clone()
            } else {
                String::new()
            }
        }
    }
}

impl RcloneClient {
    pub fn new(port: u16) -> Self {
        let http = reqwest::Client::builder()
            .timeout(Duration::from_secs(45))
            .build()
            .unwrap_or_default();

        let http_oauth = reqwest::Client::builder()
            .timeout(Duration::from_secs(180))
            .build()
            .unwrap_or_default();

        Self {
            port,
            base_url: format!("http://127.0.0.1:{port}"),
            http,
            http_oauth,
        }
    }

    pub fn port(&self) -> u16 {
        self.port
    }

    pub async fn noop(&self) -> Result<(), String> {
        let url = format!("{}/rc/noop", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({}))
            .send()
            .await
            .map_err(|e| format!("Failed to reach Rclone daemon at {url}: {e}"))?;

        if !resp.status().is_success() {
            return Err(format!("Daemon returned HTTP error: {}", resp.status()));
        }

        Ok(())
    }

    pub async fn get_stats(&self, group: Option<&str>) -> Result<CoreStats, String> {
        let url = format!("{}/core/stats", self.base_url);
        let mut body = serde_json::Map::new();
        if let Some(g) = group {
            body.insert("group".to_string(), serde_json::Value::String(g.to_string()));
        }
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::Value::Object(body))
            .send()
            .await
            .map_err(|e| format!("Failed to query core stats: {e}"))?;

        resp.json::<CoreStats>()
            .await
            .map_err(|e| format!("Failed to parse core stats response: {e}"))
    }

    pub async fn create_remote(
        &self,
        name: &str,
        remote_type: &str,
        parameters: &HashMap<String, String>,
    ) -> Result<(), String> {
        let url = format!("{}/config/create", self.base_url);
        let payload = serde_json::json!({
            "name": name,
            "type": remote_type,
            "parameters": parameters,
        });

        let resp = self
            .http
            .post(&url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Failed to create remote '{name}': {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Failed to create remote '{name}': {body}"));
        }

        let _ = self.clear_fs_cache().await;
        Ok(())
    }

    pub async fn create_oauth_remote(
        &self,
        name: &str,
        remote_type: &str,
        parameters: &HashMap<String, String>,
    ) -> Result<(), String> {
        let url = format!("{}/config/create", self.base_url);
        let mut state: Option<String> = None;
        let mut result: Option<String> = None;

        for _ in 0..15 {
            let mut opt = serde_json::json!({ "nonInteractive": true });
            if let Some(s) = &state {
                opt["continue"] = serde_json::json!(true);
                opt["state"] = serde_json::json!(s);
                opt["result"] = serde_json::json!(result.unwrap_or_default());
            }

            let payload = serde_json::json!({
                "name": name,
                "type": remote_type,
                "parameters": parameters,
                "opt": opt,
            });

            let resp = self
                .http_oauth
                .post(&url)
                .json(&payload)
                .send()
                .await
                .map_err(|e| format!("Authentication request failed for '{name}': {e}"))?;

            if !resp.status().is_success() {
                let body = resp.text().await.unwrap_or_default();
                return Err(format!("Authentication failed for '{name}': {body}"));
            }

            let config_res: RcloneConfigResponse = resp
                .json()
                .await
                .map_err(|e| format!("Failed to parse config response: {e}"))?;

            if !config_res.error.is_empty() {
                return Err(format!("Authentication error for '{name}': {}", config_res.error));
            }

            if config_res.state.is_empty() {
                let _ = self.clear_fs_cache().await;
                return Ok(());
            }

            let opt_info = config_res.option.ok_or_else(|| {
                format!("Remote configuration returned state '{}' without option details", config_res.state)
            })?;

            let answer = resolve_config_answer(&opt_info.name, &opt_info.default_str, &opt_info.examples);
            state = Some(config_res.state);
            result = Some(answer);
        }

        Err("OAuth configuration exceeded maximum negotiation steps".to_string())
    }

    pub async fn delete_remote(&self, name: &str) -> Result<(), String> {
        let url = format!("{}/config/delete", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({ "name": name }))
            .send()
            .await
            .map_err(|e| format!("Failed to delete remote '{name}': {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Failed to delete remote '{name}': {body}"));
        }

        let _ = self.clear_fs_cache().await;
        Ok(())
    }

    pub async fn update_remote(
        &self,
        name: &str,
        parameters: &HashMap<String, String>,
    ) -> Result<(), String> {
        let url = format!("{}/config/update", self.base_url);
        let payload = serde_json::json!({
            "name": name,
            "parameters": parameters,
        });

        let resp = self
            .http
            .post(&url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Failed to update remote '{name}': {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Failed to update remote '{name}': {body}"));
        }

        let _ = self.clear_fs_cache().await;
        Ok(())
    }

    pub async fn clear_fs_cache(&self) -> Result<(), String> {
        let url = format!("{}/fscache/clear", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({}))
            .send()
            .await
            .map_err(|e| format!("Failed to clear rclone fs cache: {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Failed to clear rclone fs cache: {body}"));
        }

        Ok(())
    }

    pub async fn dump_config(
        &self,
    ) -> Result<HashMap<String, HashMap<String, serde_json::Value>>, String> {
        let url = format!("{}/config/dump", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({}))
            .send()
            .await
            .map_err(|e| format!("Failed to query remote config: {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Config query failed: {body}"));
        }

        resp.json::<HashMap<String, HashMap<String, serde_json::Value>>>()
            .await
            .map_err(|e| format!("Failed to parse config dump: {e}"))
    }

    pub async fn get_about(&self, fs: &str) -> Result<AboutFs, String> {
        let url = format!("{}/operations/about", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({ "fs": fs }))
            .send()
            .await
            .map_err(|e| format!("Failed to query storage quota for '{fs}': {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Storage quota query failed for '{fs}': {body}"));
        }

        resp.json::<AboutFs>()
            .await
            .map_err(|e| format!("Failed to parse storage quota for '{fs}': {e}"))
    }

    pub async fn get_oauth_status(&self) -> Result<OAuthStatus, String> {
        let url = format!("{}/config/oauthstatus", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({}))
            .send()
            .await
            .map_err(|e| format!("Failed to query authentication status: {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Authentication status query failed: {body}"));
        }

        resp.json::<OAuthStatus>()
            .await
            .map_err(|e| format!("Failed to parse authentication status: {e}"))
    }

    pub async fn stop_oauth(&self) -> Result<(), String> {
        let url = format!("{}/config/oauthstop", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({}))
            .send()
            .await
            .map_err(|e| format!("Failed to stop authentication server: {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Stopping authentication server failed: {body}"));
        }

        Ok(())
    }

    async fn post_job(
        &self,
        endpoint: &str,
        payload: serde_json::Value,
        label: &str,
    ) -> Result<u64, String> {
        let url = format!("{}/{endpoint}", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Failed to initiate {label}: {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("{label} failed: {body}"));
        }

        resp.json::<JobIdResponse>()
            .await
            .map(|r| r.jobid)
            .map_err(|e| format!("Failed to parse {label} response: {e}"))
    }

    pub async fn start_copy(&self, src_fs: &str, dst_fs: &str, group: &str) -> Result<u64, String> {
        self.post_job(
            "sync/copy",
            serde_json::json!({ "srcFs": src_fs, "dstFs": dst_fs, "_async": true, "_group": group }),
            "folder transfer",
        )
        .await
    }

    pub async fn start_copy_file(
        &self,
        src_fs: &str,
        src_remote: &str,
        dst_fs: &str,
        dst_remote: &str,
        group: &str,
    ) -> Result<u64, String> {
        self.post_job(
            "operations/copyfile",
            serde_json::json!({
                "srcFs": src_fs,
                "srcRemote": src_remote,
                "dstFs": dst_fs,
                "dstRemote": dst_remote,
                "_async": true,
                "_group": group
            }),
            "file transfer",
        )
        .await
    }

    pub async fn get_job_status(&self, job_id: u64) -> Result<JobStatus, String> {
        let url = format!("{}/job/status", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({ "jobid": job_id }))
            .send()
            .await
            .map_err(|e| format!("Failed to query job status for #{job_id}: {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Job status query failed: {body}"));
        }

        resp.json::<JobStatus>()
            .await
            .map_err(|e| format!("Failed to parse job status response: {e}"))
    }

    pub async fn stop_job(&self, job_id: u64) -> Result<(), String> {
        let url = format!("{}/job/stop", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({ "jobid": job_id }))
            .send()
            .await
            .map_err(|e| format!("Failed to stop job #{job_id}: {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Stopping job failed: {body}"));
        }

        Ok(())
    }

    pub async fn list_files(&self, fs: &str, remote: &str) -> Result<Vec<RcloneItem>, String> {
        let url = format!("{}/operations/list", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({ "fs": fs, "remote": remote }))
            .send()
            .await
            .map_err(|e| format!("Failed to list vault files: {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            if body.contains("directory not found") {
                return Ok(Vec::new());
            }
            return Err(format!("Listing vault files failed: {body}"));
        }

        let list_resp = resp
            .json::<RcloneListResponse>()
            .await
            .map_err(|e| format!("Failed to parse file list: {e}"))?;

        Ok(list_resp.list)
    }

    pub async fn delete_file(&self, fs: &str, remote: &str) -> Result<(), String> {
        let url = format!("{}/operations/deletefile", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({ "fs": fs, "remote": remote }))
            .send()
            .await
            .map_err(|e| format!("Failed to delete vault file: {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Deleting vault file failed: {body}"));
        }

        Ok(())
    }

    pub async fn purge_dir(&self, fs: &str, remote: &str) -> Result<(), String> {
        let url = format!("{}/operations/purge", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({ "fs": fs, "remote": remote }))
            .send()
            .await
            .map_err(|e| format!("Failed to delete vault folder: {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Deleting vault folder failed: {body}"));
        }

        Ok(())
    }

    pub async fn mkdir(&self, fs: &str, remote: &str) -> Result<(), String> {
        let url = format!("{}/operations/mkdir", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({ "fs": fs, "remote": remote }))
            .send()
            .await
            .map_err(|e| format!("Failed to create folder: {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Failed to create folder: {body}"));
        }

        Ok(())
    }

    pub async fn check_hashes(
        &self,
        src_fs: &str,
        dst_fs: &str,
        filter_file: Option<&str>,
    ) -> Result<CheckResult, String> {
        let url = format!("{}/operations/check", self.base_url);
        let mut payload = serde_json::json!({
            "srcFs": src_fs,
            "dstFs": dst_fs,
            "oneWay": true,
            "download": false,
        });

        if let Some(file) = filter_file {
            payload["_filter"] = serde_json::json!({ "IncludeRule": [format!("/{file}")] });
        }

        let resp = self
            .http
            .post(&url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Failed to check hashes: {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Hash check failed: {body}"));
        }

        resp.json::<CheckResult>()
            .await
            .map_err(|e| format!("Failed to parse hash check result: {e}"))
    }

    pub async fn get_file_hash(
        &self,
        fs: &str,
        remote: &str,
        hash_type: &str,
    ) -> Result<String, String> {
        let url = format!("{}/operations/hashsumfile", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({
                "fs": fs,
                "remote": remote,
                "hashType": hash_type,
                "download": true,
            }))
            .send()
            .await
            .map_err(|e| format!("Failed to compute hash for '{remote}': {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Hash computation failed for '{remote}': {body}"));
        }

        let res: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse hash response for '{remote}': {e}"))?;

        res.get("hash")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .ok_or_else(|| format!("No hash returned for '{remote}'"))
    }

    pub async fn check_single_file_hash(
        &self,
        src_fs: &str,
        src_remote: &str,
        dst_fs: &str,
        dst_remote: &str,
    ) -> Result<CheckResult, String> {
        let src_hash = self.get_file_hash(src_fs, src_remote, "MD5").await?;
        let dst_hash = self.get_file_hash(dst_fs, dst_remote, "MD5").await?;

        if !src_hash.is_empty() && src_hash == dst_hash {
            Ok(CheckResult {
                success: true,
                status: "OK".to_string(),
                differ: Vec::new(),
                error: Vec::new(),
            })
        } else {
            Ok(CheckResult {
                success: false,
                status: "Hash mismatch".to_string(),
                differ: vec![dst_remote.to_string()],
                error: Vec::new(),
            })
        }
    }

    pub async fn get_bandwidth_limit(&self) -> Result<BandwidthLimit, String> {
        let url = format!("{}/core/bwlimit", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({}))
            .send()
            .await
            .map_err(|e| format!("Failed to query bandwidth limit: {e}"))?;

        if !resp.status().is_success() {
            return Err(format!("Daemon returned HTTP error: {}", resp.status()));
        }

        resp.json::<BandwidthLimit>()
            .await
            .map_err(|e| format!("Failed to parse bandwidth limit: {e}"))
    }

    pub async fn set_bandwidth_limit(&self, rate: &str) -> Result<BandwidthLimit, String> {
        let url = format!("{}/core/bwlimit", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({ "rate": rate }))
            .send()
            .await
            .map_err(|e| format!("Failed to set bandwidth limit: {e}"))?;

        if !resp.status().is_success() {
            return Err(format!("Daemon returned HTTP error: {}", resp.status()));
        }

        resp.json::<BandwidthLimit>()
            .await
            .map_err(|e| format!("Failed to parse bandwidth limit response: {e}"))
    }

    pub async fn get_public_link(&self, fs: &str, remote: &str) -> Result<String, String> {
        let url = format!("{}/operations/publiclink", self.base_url);
        let payload = serde_json::json!({
            "fs": fs,
            "remote": remote,
        });

        let resp = self
            .http
            .post(&url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Failed to generate share link: {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            let msg = serde_json::from_str::<serde_json::Value>(&body)
                .ok()
                .and_then(|v| v.get("error").and_then(|e| e.as_str()).map(ToString::to_string))
                .unwrap_or(body);
            return Err(format!("Cloud provider error generating link: {msg}"));
        }

        let mut res: HashMap<String, String> = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse public link response: {e}"))?;

        res.remove("url")
            .ok_or_else(|| "No URL returned for public link".to_string())
    }

    pub async fn start_http_server(&self, fs: &str, addr: &str) -> Result<HttpServerInfo, String> {
        let url = format!("{}/serve/start", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({
                "type": "http",
                "fs": fs,
                "addr": addr,
            }))
            .send()
            .await
            .map_err(|e| format!("Failed to start media server: {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Media server startup failed: {body}"));
        }

        resp.json::<HttpServerInfo>()
            .await
            .map_err(|e| format!("Failed to parse media server response: {e}"))
    }

    pub async fn stop_http_server(&self, id: &str) -> Result<(), String> {
        let url = format!("{}/serve/stop", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({ "id": id }))
            .send()
            .await
            .map_err(|e| format!("Failed to stop media server: {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Stopping media server failed: {body}"));
        }

        Ok(())
    }

    pub async fn quit(&self) -> Result<(), String> {
        let url = format!("{}/core/quit", self.base_url);
        let _ = self
            .http
            .post(&url)
            .json(&serde_json::json!({}))
            .send()
            .await;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_public_link_response_deserialization() {
        let json = r#"{"url": "https://drive.google.com/file/d/test1234/view?usp=sharing"}"#;
        let mut res: HashMap<String, String> = serde_json::from_str(json).expect("deserialize public link");
        assert_eq!(
            res.remove("url").as_deref(),
            Some("https://drive.google.com/file/d/test1234/view?usp=sharing")
        );
    }

    #[test]
    fn test_models_deserialization() {
        let json = r#"{"total": 15000000000, "used": 5000000000, "free": 10000000000}"#;
        let about: AboutFs = serde_json::from_str(json).expect("deserialize about");
        assert_eq!(about.total, Some(15000000000));
        assert_eq!(about.used, Some(5000000000));
        assert_eq!(about.free, Some(10000000000));

        let oauth_json = r#"{"status": "running", "authUrl": "http://127.0.0.1:53682/auth"}"#;
        let oauth: OAuthStatus = serde_json::from_str(oauth_json).expect("deserialize oauth");
        assert_eq!(oauth.status, "running");
        assert_eq!(oauth.auth_url.as_deref(), Some("http://127.0.0.1:53682/auth"));
    }

    #[test]
    fn test_job_status_deserialization() {
        let json = r#"{
            "id": 42,
            "finished": true,
            "success": true,
            "error": "",
            "duration": 4.125
        }"#;
        let status: JobStatus = serde_json::from_str(json).expect("deserialize job status");
        assert_eq!(status.id, 42);
        assert!(status.finished);
        assert!(status.success);
        assert_eq!(status.error, "");
        assert_eq!(status.duration, 4.125);
    }

    #[test]
    fn test_rclone_item_deserialization() {
        let json = r#"{
            "Path": "documents/report.pdf",
            "Name": "report.pdf",
            "Size": 1048576,
            "MimeType": "application/pdf",
            "ModTime": "2026-10-15T19:00:00Z",
            "IsDir": false
        }"#;
        let item: RcloneItem = serde_json::from_str(json).expect("deserialize rclone item");
        assert_eq!(item.name, "report.pdf");
        assert_eq!(item.path, "documents/report.pdf");
        assert_eq!(item.size, 1048576);
        assert_eq!(item.mime_type.as_deref(), Some("application/pdf"));
        assert_eq!(item.mod_time.as_deref(), Some("2026-10-15T19:00:00Z"));
        assert!(!item.is_dir);

        let list_json = format!(r#"{{"list": [{json}]}}"#);
        let list_resp: RcloneListResponse = serde_json::from_str(&list_json).expect("deserialize list response");
        assert_eq!(list_resp.list.len(), 1);
        assert_eq!(list_resp.list[0].name, "report.pdf");
    }

    #[test]
    fn test_check_result_deserialization() {
        let json = r#"{
            "differ": [],
            "error": [],
            "hashType": "md5",
            "missingOnDst": [],
            "missingOnSrc": [],
            "status": "OK",
            "success": true
        }"#;
        let check: CheckResult = serde_json::from_str(json).expect("deserialize check result");
        assert!(check.success);
        assert_eq!(check.status, "OK");
        assert!(check.differ.is_empty());
        assert!(check.error.is_empty());

        let failure_json = r#"{
            "differ": ["corrupt.png"],
            "error": ["failed to read"],
            "status": "1 differences found",
            "success": false
        }"#;
        let fail_check: CheckResult = serde_json::from_str(failure_json).expect("deserialize failure check");
        assert!(!fail_check.success);
        assert_eq!(fail_check.differ, vec!["corrupt.png".to_string()]);
        assert_eq!(fail_check.error, vec!["failed to read".to_string()]);
    }

    #[test]
    fn test_bandwidth_limit_deserialization() {
        let json = r#"{
            "bytesPerSecond": 10485760,
            "bytesPerSecondTx": 10485760,
            "bytesPerSecondRx": -1,
            "rate": "10M:off"
        }"#;
        let limit: BandwidthLimit = serde_json::from_str(json).expect("deserialize bandwidth limit");
        assert_eq!(limit.rate, "10M:off");

        let off_json = r#"{
            "bytesPerSecond": -1,
            "bytesPerSecondTx": -1,
            "bytesPerSecondRx": -1,
            "rate": "off"
        }"#;
        let off_limit: BandwidthLimit = serde_json::from_str(off_json).expect("deserialize off limit");
        assert_eq!(off_limit.rate, "off");
    }

    #[test]
    fn test_http_server_info_deserialization() {
        let json = r#"{"addr": "127.0.0.1:57104", "id": "http-60e63eb7"}"#;
        let info: HttpServerInfo = serde_json::from_str(json).expect("deserialize http server info");
        assert_eq!(info.addr, "127.0.0.1:57104");
        assert_eq!(info.id, "http-60e63eb7");
    }

    #[test]
    fn test_resolve_config_answer_defaults() {
        assert_eq!(resolve_config_answer("config_is_local", "true", &[]), "true");
        assert_eq!(resolve_config_answer("config_shared_client_id", "false", &[]), "true");
        assert_eq!(resolve_config_answer("teamdrive", "false", &[]), "false");
        assert_eq!(resolve_config_answer("choose_type", "onedrive", &[]), "onedrive");

        let examples = vec![
            RcloneConfigExample { value: "b!system_container_123".into(), help: "C022FB8E-9907-45F9 (personal)".into() },
            RcloneConfigExample { value: "02C1CD0E661CC2D0".into(), help: "OneDrive (personal)".into() },
            RcloneConfigExample { value: "b!archive_456".into(), help: "ODCMetadataArchive (personal)".into() },
        ];
        assert_eq!(resolve_config_answer("config_driveid", "", &examples), "02C1CD0E661CC2D0");
        assert_eq!(resolve_config_answer("choose_drive", "", &examples), "02C1CD0E661CC2D0");
        assert_eq!(resolve_config_answer("config_drive_ok", "true", &[]), "true");
    }

    #[test]
    fn test_rclone_config_response_deserialization() {
        let json = r#"{
            "State": "*oauth-islocal,choose_type,,",
            "Option": {
                "Name": "config_is_local",
                "DefaultStr": "true",
                "Examples": [
                    {"Value": "true", "Help": "Yes"},
                    {"Value": "false", "Help": "No"}
                ]
            },
            "Error": ""
        }"#;
        let resp: RcloneConfigResponse = serde_json::from_str(json).expect("deserialize config response");
        assert_eq!(resp.state, "*oauth-islocal,choose_type,,");
        let opt = resp.option.unwrap();
        assert_eq!(opt.name, "config_is_local");
        assert_eq!(opt.default_str, "true");
        assert_eq!(opt.examples.len(), 2);
    }
}


