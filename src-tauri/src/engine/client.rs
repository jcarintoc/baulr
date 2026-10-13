use std::time::Duration;
use crate::engine::models::CoreStats;

#[derive(Debug, Clone)]
pub struct RcloneClient {
    port: u16,
    base_url: String,
    http: reqwest::Client,
}

impl RcloneClient {
    pub fn new(port: u16) -> Self {
        let http = reqwest::Client::builder()
            .timeout(Duration::from_secs(5))
            .build()
            .unwrap_or_default();

        Self {
            port,
            base_url: format!("http://127.0.0.1:{port}"),
            http,
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
