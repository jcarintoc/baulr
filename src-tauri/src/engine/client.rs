use serde::Deserialize;
use std::collections::HashMap;
use std::time::Duration;
use crate::engine::models::{
    AboutFs, BandwidthLimit, CheckResult, CoreStats, JobStatus, OAuthStatus, RcloneItem,
    RcloneListResponse,
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

        Ok(())
    }

    pub async fn create_oauth_remote(
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

        Ok(())
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
}


