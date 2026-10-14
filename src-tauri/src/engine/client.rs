use std::collections::HashMap;
use std::time::Duration;
use crate::engine::models::{AboutFs, CoreStats, JobStatus, OAuthStatus};

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
            .timeout(Duration::from_secs(5))
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

    pub async fn get_stats(&self) -> Result<CoreStats, String> {
        let url = format!("{}/core/stats", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({}))
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

    pub async fn start_copy(&self, src_fs: &str, dst_fs: &str) -> Result<u64, String> {
        let url = format!("{}/sync/copy", self.base_url);
        let payload = serde_json::json!({
            "srcFs": src_fs,
            "dstFs": dst_fs,
            "_async": true,
        });

        let resp = self
            .http
            .post(&url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Failed to initiate folder transfer: {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Folder transfer failed: {body}"));
        }

        let data = resp
            .json::<serde_json::Value>()
            .await
            .map_err(|e| format!("Failed to parse transfer job response: {e}"))?;

        data.get("jobid")
            .and_then(|v| v.as_u64())
            .ok_or_else(|| "Missing jobid in Rclone sync response".to_string())
    }

    pub async fn start_copy_file(
        &self,
        src_fs: &str,
        src_remote: &str,
        dst_fs: &str,
        dst_remote: &str,
    ) -> Result<u64, String> {
        let url = format!("{}/operations/copyfile", self.base_url);
        let payload = serde_json::json!({
            "srcFs": src_fs,
            "srcRemote": src_remote,
            "dstFs": dst_fs,
            "dstRemote": dst_remote,
            "_async": true,
        });

        let resp = self
            .http
            .post(&url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Failed to initiate file transfer: {e}"))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("File transfer failed: {body}"));
        }

        let data = resp
            .json::<serde_json::Value>()
            .await
            .map_err(|e| format!("Failed to parse file transfer response: {e}"))?;

        data.get("jobid")
            .and_then(|v| v.as_u64())
            .ok_or_else(|| "Missing jobid in Rclone copyfile response".to_string())
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
    fn test_core_stats_with_transferring_deserialization() {
        let json = r#"{
            "bytes": 5242880,
            "speed": 1048576.0,
            "transfers": 1,
            "totalBytes": 10485760,
            "errors": 0,
            "fatalError": false,
            "eta": 5,
            "transferring": [
                {
                    "name": "archive.zip",
                    "bytes": 5242880,
                    "size": 10485760,
                    "speed": 1048576.0,
                    "eta": 5,
                    "percentage": 50
                }
            ]
        }"#;
        let stats: CoreStats = serde_json::from_str(json).expect("deserialize core stats");
        assert_eq!(stats.bytes, 5242880);
        assert_eq!(stats.eta, Some(5));
        let files = stats.transferring.expect("transferring files list");
        assert_eq!(files.len(), 1);
        assert_eq!(files[0].name, "archive.zip");
        assert_eq!(files[0].percentage, 50);
    }
}
