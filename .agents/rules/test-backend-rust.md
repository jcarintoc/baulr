---
trigger: glob
description: "Standards for Rust backend unit and integration testing in Tauri using cargo test, tauri::test, and filesystem isolation."
globs: "src-tauri/tests/**/*.rs, src-tauri/**/tests.rs, src-tauri/**/*test*.rs"
---

# Rust Backend Testing Rules (cargo test + tauri::test)

## Architectural Pattern: Thin Commands, Thick Domain

- **Decouple Logic from Tauri Runtime:** Write business logic, parsing, and file operations as pure Rust functions returning `Result<T, AppError>`.
- **Keep `#[tauri::command]` Thin:** Command handlers should only extract `tauri::State` or `AppHandle`, delegate to a pure domain function, and map errors.
- **Test Ratio:** 90% of Rust tests should test pure domain functions directly via `#[test]` or `#[tokio::test]` without initializing `tauri::test::MockRuntime`.

## Filesystem & Side-Effect Isolation

- **No Host Path Pollution:** Never read from or write to real OS user directories (`$APPDATA`, `$HOME`, `$CONFIG`) during tests.
- **Use Temporary Directories:** Always inject base paths into domain functions and use the `tempfile` crate (`tempfile::tempdir()`) to create self-cleaning sandboxes for file I/O tests.
- **Database Isolation:** For SQLite/database tests, initialize an in-memory instance (`sqlite::memory:`) or a temporary file inside `tempdir()`.

## Testing Stateful Tauri Commands

When a test specifically requires verifying `tauri::State<T>`, `AppHandle`, or event emission, use `tauri::test`:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;
    use tempfile::tempdir;
    use tauri::test::{mock_builder, mock_context, noop_assets};
    use tauri::Manager;

    // 1. Pure Domain Unit Test (Preferred)
    #[test]
    fn test_parse_config_file_valid() {
        let dir = tempdir().expect("failed to create temp dir");
        let file_path = dir.path().join("config.json");
        std::fs::write(&file_path, r#"{"theme": "dark"}"#).unwrap();

        let config = load_config_from_disk(&file_path).unwrap();
        assert_eq!(config.theme, "dark");
    }

    // 2. Tauri Command Integration Test (For State / AppHandle)
    #[tokio::test]
    async fn test_stateful_command_execution() {
        let app = mock_builder()
            .manage(AppState {
                counter: Mutex::new(0),
            })
            .invoke_handler(tauri::generate_handler![increment_counter])
            .build(mock_context(noop_assets()))
            .expect("failed to build mock tauri app");

        let webview = tauri::WebviewWindowBuilder::new(
            &app,
            "main",
            tauri::WebviewUrl::default(),
        )
        .build()
        .unwrap();

        let res = tauri::test::get_ipc_response(
            &webview,
            tauri::webview::InvokeRequest {
                cmd: "increment_counter".into(),
                callback: tauri::ipc::CallbackFn(0),
                error: tauri::ipc::CallbackFn(1),
                url: "[http://tauri.localhost](http://tauri.localhost)".parse().unwrap(),
                body: tauri::ipc::InvokeBody::default(),
                headers: Default::default(),
                invoke_key: tauri::test::INVOKE_KEY.to_string(),
            },
        );

        assert!(res.is_ok());
        assert_eq!(res.unwrap().deserialize::<i32>().unwrap(), 1);
    }
}
```

## Anti-Patterns (Forbidden)

- Never use `.unwrap()` in production command code; only use `.unwrap()` or `.expect("reason")` inside `#[cfg(test)]` modules.
- Do not rely on execution order between `#[test]` functions; Rust runs tests in parallel threads by default.
