---
trigger: glob
globs: "src-tauri/**/*.{rs,toml,json}"
---

# Technology Rules: Tauri v2 & Rust Backend

**File:** `.agents/rules/tauri-rust.md`  
**Scope:** Applied to all files under `src-tauri/`  
**Audience:** AI agents writing or modifying Rust code

---

## 1. Core Persona: The "Boring Rust" BFF

The Rust backend in Baulr is a **Backend-For-Frontend (BFF)** bridge. Its only jobs are:

1. Spawning and monitoring the Rclone daemon sidecar.
2. Interfacing with native OS APIs (Keychains, File Dialogs, Trash).
3. Streaming files from the local LAN HTTP server (for mobile QR upload).

**The Rule:** Keep Rust simple, explicit, and readable for a Web Developer. If logic can cleanly live in TypeScript without sacrificing safety or performance, keep it in TypeScript.

---

## 2. The Zero-Panic Invariant

Panicking in Rust instantly terminates the desktop application without warning.

- **NEVER use `.unwrap()` or `.expect()` in production code.**
- Prohibited:
  ```rust
  // FORBIDDEN: Instant crash if port or file is missing
  let port = port_str.parse::<u16>().unwrap();
  ```
- Required:
  ```rust
  // CORRECT: Propagate or map error safely
  let port = port_str.parse::<u16>().map_err(|e| format!("Invalid port '{port_str}': {e}"))?;
  ```
- Use the `?` operator for clean error propagation.

---

## 3. Tauri v2 Command Architecture

### 3.1 Commands Are Thin Routers

Tauri commands (`#[tauri::command]`) must only validate input, delegate to an internal service module, and return a serialized result. Never write heavy business logic inside the command function itself.

```rust
// src-tauri/src/commands/vault.rs
#[tauri::command]
pub async fn get_vault_quota(
    state: tauri::State<'_, AppState>,
) -> Result<VaultQuota, String> {
    state.rclone.get_quota().await.map_err(|e| e.to_string())
}
```

### 3.2 Error Return Types

All commands must return `Result<T, String>` or `Result<T, AppError>` where `AppError: serde::Serialize`. Never swallow errors or return untyped empty options when something fails.

### 3.3 Asynchronous Non-Blocking I/O

- Every command that touches disk, network, or IPC **must be `async`**.
- Never block the Tokio async runtime with blocking std calls. Use `tokio::fs` instead of `std::fs` for file reads in async commands.

### 3.4 Automatic TypeScript Bindings (tauri-specta)

- All shared IPC structs must derive `specta::Type` alongside `Serialize` and `Deserialize`.
- All commands must be annotated with `#[specta::specta]` and registered via `tauri_specta::collect_commands![]`.
- Never manually hand-write TypeScript interfaces for IPC; let Specta generate `src/lib/bindings.ts`.
- When serializing byte-size integers (`u64`), annotate with `#[specta(type = f64)]` to prevent JavaScript BigInt precision runtime rejections.

### 3.5 Event Streams & Payload Hygiene

- **Event Streams Over Polling:** For live metrics or file transfer progress, do not poll `invoke()`. Have Rust push events to the webview via `app_handle.emit("event-name", payload)` and subscribe in React via `listen()`.
- **Pass Paths, Never Raw Bytes:** Never pass heavy binary files or video buffers over IPC JSON. Pass system file paths (`String` / `PathBuf`) and perform all reading/writing natively in Rust and Rclone.

---

## 4. State Management & Concurrency

- App-wide shared state is stored in `AppState` registered via `app.manage(AppState::new())`.
- For mutable shared state, use Tokio's async synchronization primitives:
  - `Arc<tokio::sync::RwLock<T>>` for read-heavy state (e.g. connected account list).
  - `Arc<tokio::sync::Mutex<T>>` for write-heavy state (e.g. transfer queue).
- **Rule:** Never use `std::sync::Mutex` inside async blocks (risks deadlocking the Tokio worker threads).

---

## 5. Folder & Module Structure

Keep files small (under 200 lines) and strictly organized:

```
src-tauri/src/
├── main.rs              # App entry point, Tauri plugin registrations, builder
├── state.rs             # AppState struct and shared resource definitions
├── error.rs             # AppError enum with human-readable error messages
├── commands/            # Tauri IPC command entry points (grouped by domain)
│   ├── mod.rs
│   ├── accounts.rs      # OAuth connect, disconnect, list accounts
│   ├── vault.rs         # Union quota, remote file listing
│   └── offload.rs       # Enqueue offload, cancel, check progress
├── engine/              # Rclone sidecar process manager & RPC client
│   ├── daemon.rs        # Spawning, health monitoring, graceful shutdown
│   ├── client.rs        # HTTP JSON-RPC client (reqwest)
│   └── models.rs        # Serde structs for Rclone JSON responses
├── storage/             # SQLite migrations and query helpers (rusqlite)
│   └── db.rs
└── utils/               # Native OS helpers (keychain, trash)
    ├── keychain.rs
    └── trash.rs
```

---

## 6. Web-Developer Readability Guidelines

1. **No Clever Lifetime Gymnastics:** Avoid complex manual lifetime parameters (`<'a, 'b>`) when owned data (`String`, `PathBuf`) is clear and fast enough.
2. **Descriptive Names:** Write full, descriptive variable names (`target_directory` instead of `tdir`; `remaining_bytes` instead of `rem`).
3. **Comment OS Quirks:** Whenever working around OS-specific differences (macOS vs Windows path separators, Windows executable extensions `.exe`), add a 1-line comment explaining the rationale.

---

## 7. Verification Checklist Before Completion

Before claiming any Rust task is done, the agent must run:

1. `cargo check` (must pass with 0 errors).
2. `cargo clippy -- -D warnings` (must pass with 0 warnings).
3. `cargo test` (all unit tests must pass).
