use axum::{
    extract::{DefaultBodyLimit, Multipart, Query, State},
    http::StatusCode,
    response::{Html, IntoResponse, Response},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::net::SocketAddr;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::io::AsyncWriteExt;
use tokio::net::TcpListener;
use tokio::sync::oneshot;
use tower_http::cors::CorsLayer;

use super::html::MOBILE_UPLOAD_HTML;
use super::qr::generate_qr_svg;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MobileReceiverInfo {
    pub url: String,
    pub ip: String,
    pub port: u16,
    pub token: String,
    pub qr_svg: String,
    pub staging_dir: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MobileFileReceivedEvent {
    pub file_name: String,
    pub file_path: String,
    #[specta(type = f64)]
    pub size_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MobileClientConnectedEvent {
    pub ip: String,
}

#[derive(Deserialize)]
struct TokenQuery {
    token: Option<String>,
}

struct AppServerState {
    token: String,
    staging_dir: PathBuf,
    app: AppHandle,
}

pub struct MobileServerHandle {
    pub info: MobileReceiverInfo,
    shutdown_tx: Option<oneshot::Sender<()>>,
}

impl MobileServerHandle {
    pub fn stop(&mut self) {
        if let Some(tx) = self.shutdown_tx.take() {
            let _ = tx.send(());
        }
    }
}

pub fn get_local_ip() -> String {
    std::net::UdpSocket::bind("0.0.0.0:0")
        .and_then(|s| {
            s.connect("8.8.8.8:80")?;
            s.local_addr()
        })
        .map(|a| a.ip().to_string())
        .ok()
        .filter(|ip| ip != "0.0.0.0")
        .unwrap_or_else(|| "127.0.0.1".to_string())
}

pub fn generate_pairing_token() -> String {
    use std::time::SystemTime;
    let millis = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    format!("{:x}", millis)
}

pub fn resolve_unique_staging_name(staging_dir: &Path, file_name: &str) -> (String, PathBuf) {
    let sanitized = Path::new(file_name)
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "upload.bin".to_string());

    let initial_path = staging_dir.join(&sanitized);
    if !initial_path.exists() {
        return (sanitized, initial_path);
    }

    let stem = Path::new(&sanitized)
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "file".to_string());

    let ext = Path::new(&sanitized)
        .extension()
        .map(|s| format!(".{}", s.to_string_lossy()))
        .unwrap_or_default();

    let mut counter = 1;
    loop {
        let candidate_name = format!("{}_{}{}", stem, counter, ext);
        let candidate_path = staging_dir.join(&candidate_name);
        if !candidate_path.exists() {
            return (candidate_name, candidate_path);
        }
        counter += 1;
    }
}

pub async fn start_server(
    app: AppHandle,
    staging_dir: PathBuf,
) -> Result<MobileServerHandle, String> {
    tokio::fs::create_dir_all(&staging_dir)
        .await
        .map_err(|e| format!("Failed to create staging directory: {e}"))?;

    let token = generate_pairing_token();
    let local_ip = get_local_ip();

    let listener = TcpListener::bind("0.0.0.0:0")
        .await
        .map_err(|e| format!("Failed to bind TCP listener: {e}"))?;

    let port = listener
        .local_addr()
        .map_err(|e| format!("Failed to read socket port: {e}"))?
        .port();

    let url = format!("http://{}:{}/?token={}", local_ip, port, token);
    let qr_svg = generate_qr_svg(&url)?;

    let state = Arc::new(AppServerState {
        token: token.clone(),
        staging_dir: staging_dir.clone(),
        app,
    });

    let app_router = Router::new()
        .route("/", get(handle_index))
        .route("/upload", post(handle_upload))
        .layer(DefaultBodyLimit::disable())
        .layer(CorsLayer::permissive())
        .with_state(state);

    let (shutdown_tx, shutdown_rx) = oneshot::channel::<()>();

    tokio::spawn(async move {
        let server = axum::serve(
            listener,
            app_router.into_make_service_with_connect_info::<SocketAddr>(),
        )
        .with_graceful_shutdown(async {
            let _ = shutdown_rx.await;
        });

        let _ = server.await;
    });

    let info = MobileReceiverInfo {
        url,
        ip: local_ip,
        port,
        token,
        qr_svg,
        staging_dir: staging_dir.to_string_lossy().to_string(),
    };

    Ok(MobileServerHandle {
        info,
        shutdown_tx: Some(shutdown_tx),
    })
}

async fn handle_index(
    State(state): State<Arc<AppServerState>>,
    Query(query): Query<TokenQuery>,
) -> Response {
    if query.token.as_deref() != Some(&state.token) {
        return (StatusCode::FORBIDDEN, "Invalid pairing token").into_response();
    }

    let _ = state.app.emit(
        "mobile://client-connected",
        MobileClientConnectedEvent {
            ip: "client".to_string(),
        },
    );

    Html(MOBILE_UPLOAD_HTML).into_response()
}

async fn handle_upload(
    State(state): State<Arc<AppServerState>>,
    Query(query): Query<TokenQuery>,
    mut multipart: Multipart,
) -> Response {
    if query.token.as_deref() != Some(&state.token) {
        return (StatusCode::FORBIDDEN, "Invalid pairing token").into_response();
    }

    let mut saved_count = 0;

    while let Ok(Some(mut field)) = multipart.next_field().await {
        let file_name = field
            .file_name()
            .map(|s| s.to_string())
            .unwrap_or_else(|| format!("upload_{}.bin", generate_pairing_token()));

        let (sanitized_name, target_path) =
            resolve_unique_staging_name(&state.staging_dir, &file_name);

        let mut file = match tokio::fs::File::create(&target_path).await {
            Ok(f) => f,
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to create destination file: {e}"),
                )
                    .into_response();
            }
        };

        let mut total_bytes = 0u64;

        while let Ok(Some(chunk)) = field.chunk().await {
            total_bytes += chunk.len() as u64;
            if let Err(e) = file.write_all(&chunk).await {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to write chunk: {e}"),
                )
                    .into_response();
            }
        }

        if let Err(e) = file.flush().await {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to flush file: {e}"),
            )
                .into_response();
        }

        let _ = state.app.emit(
            "mobile://file-received",
            MobileFileReceivedEvent {
                file_name: sanitized_name,
                file_path: target_path.to_string_lossy().to_string(),
                size_bytes: total_bytes,
            },
        );

        saved_count += 1;
    }

    if saved_count > 0 {
        (StatusCode::OK, "Files received successfully").into_response()
    } else {
        (StatusCode::BAD_REQUEST, "No files found in payload").into_response()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_unique_staging_name_no_collision() {
        let temp_dir = tempfile::tempdir().unwrap();
        let (name, path) = resolve_unique_staging_name(temp_dir.path(), "photo.jpg");
        assert_eq!(name, "photo.jpg");
        assert_eq!(path, temp_dir.path().join("photo.jpg"));
    }

    #[test]
    fn test_resolve_unique_staging_name_with_collision() {
        let temp_dir = tempfile::tempdir().unwrap();
        std::fs::write(temp_dir.path().join("photo.jpg"), "existing").unwrap();
        let (name, path) = resolve_unique_staging_name(temp_dir.path(), "photo.jpg");
        assert_eq!(name, "photo_1.jpg");
        assert_eq!(path, temp_dir.path().join("photo_1.jpg"));
    }

    #[test]
    fn test_resolve_unique_staging_name_multiple_collisions() {
        let temp_dir = tempfile::tempdir().unwrap();
        std::fs::write(temp_dir.path().join("video.mp4"), "existing1").unwrap();
        std::fs::write(temp_dir.path().join("video_1.mp4"), "existing2").unwrap();
        let (name, path) = resolve_unique_staging_name(temp_dir.path(), "video.mp4");
        assert_eq!(name, "video_2.mp4");
        assert_eq!(path, temp_dir.path().join("video_2.mp4"));
    }
}
