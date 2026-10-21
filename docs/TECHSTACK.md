# Technology Stack Specification

## Project: Baulr (Local-First Unified Cloud Vault & Offloader)

**Status:** Approved  
**Document:** `TECHSTACK.md`  

---

## 1. Stack Summary Matrix

| Domain | Technology | Justification |
| :--- | :--- | :--- |
| **Desktop Framework** | **Tauri v2 (Rust)** | ~15 MB installer footprint, <40 MB idle RAM (vs 200MB+ in Electron). Built-in sidecar binary execution, native OS keychains, and cross-platform compilation. |
| **Storage Engine** | **Rclone (Precompiled CLI Binary)** | Executes as an independent daemon (`rclone rcd`). Zero custom cloud API maintenance; supports Google Drive, OneDrive, Dropbox out of the box. Upgraded independently without recompiling app code. |
| **Frontend Framework** | **React 19 + TypeScript + Vite** | High development velocity, vast ecosystem for transfer progress bars and file tables, strict type safety. |
| **Styling & UI** | **Tailwind CSS + Lucide Icons + Radix UI** | Modern, accessible, utility-first styling with zero runtime CSS-in-JS performance penalty. |
| **State Management** | **Zustand** | Minimalist (<1 KB), boilerplate-free client state store for connected accounts and active transfers. |
| **Local Database** | **SQLite (via `rusqlite`)** | Embedded, serverless SQL storage for transfer history, verification checksum logs, and cached remote file index. |
| **Mobile LAN Server** | **Axum (Rust)** | High-throughput asynchronous HTTP streaming for receiving iPhone Camera Roll uploads over local Wi-Fi without blocking the UI thread. |
| **Credential Security** | **`keyring-rs`** | Native OS-level credential storage (macOS Keychain, Windows Credential Manager). |
| **Package Manager** | **pnpm** | Fast, deterministic dependency resolution with deduplicated disk storage. |

---

## 2. Layer Deep Dive

### 2.1 Storage Engine: Rclone Sidecar Strategy
- **Distribution:** Precompiled Rclone binaries placed in `src-tauri/binaries/`:
  - `rclone-aarch64-apple-darwin` (Apple Silicon)
  - `rclone-x86_64-apple-darwin` (Intel Mac)
  - `rclone-x86_64-pc-windows-msvc.exe` (Windows 64-bit)
- **Execution:** Tauri `tauri-plugin-shell` spawns Rclone as an isolated background child process with `--rc-addr 127.0.0.1:0 --rc-no-auth`.
- **API Protocol:** Rust communicates with Rclone via `reqwest` sending JSON-RPC payloads over loopback HTTP.

### 2.2 Application Backend (Rust / Tauri v2)
- **Tauri Plugins:**
  - `tauri-plugin-shell`: Child process supervisor for the Rclone daemon.
  - `tauri-plugin-dialog`: Native system folder and file picker dialogs.
  - `tauri-plugin-fs`: High-speed local filesystem operations.
  - `tauri-plugin-notification`: System notifications when an offload batch finishes or needs verification.
- **Embedded Web Server (Axum):**
  - Serves single-page HTML uploader on home network (`0.0.0.0:<port>`).
  - Implements multipart streaming directly to disk (`tokio::io::copy`) so large 4K iPhone video files never buffer in RAM.

### 2.3 Frontend Application (React + Vite)
- **Layout Architecture:**
  - `StorageGauge`: High-impact unified capacity bar with segmented account breakdowns.
  - `AccountsDrawer`: Modal to manage connected cloud providers and initiate OAuth flows.
  - `OffloadDropzone`: Interactive target area for dragging folders to offload.
  - `TransferQueue`: Real-time transfer speed, ETA, and progress bar per file.
  - `FileTable`: Virtualized file list powered by `@tanstack/react-virtual` for buttery smooth scrolling through thousands of cloud files.

---

## 3. Directory Structure

```
baulr/
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── TECHSTACK.md
│   └── MVP.md
├── src-tauri/                     # Rust Desktop Backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── binaries/                  # Precompiled Rclone binaries per target
│   └── src/
│       ├── main.rs                # Entry point
│       ├── rclone_daemon.rs       # Daemon lifecycle & process supervisor
│       ├── rclone_client.rs       # JSON-RPC HTTP client
│       ├── lan_server.rs          # Axum QR-code mobile uploader
│       ├── db.rs                  # SQLite migrations and queries
│       └── commands.rs            # Tauri IPC commands exposed to UI
├── src/                           # Frontend (React + TypeScript)
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── StorageMeter.tsx
│   │   ├── OffloadWizard.tsx
│   │   ├── AccountsManager.tsx
│   │   ├── FileExplorer.tsx
│   │   └── MobileUploadModal.tsx
│   ├── store/
│   │   ├── vaultStore.ts
│   │   └── transferStore.ts
│   └── lib/
│       ├── tauriApi.ts
│       └── utils.ts
├── package.json
└── vite.config.ts
```

---

## 4. Why We Rejected Alternatives

| Rejected Tech | Chosen Tech | Why Rejected |
| :--- | :--- | :--- |
| **Electron** | **Tauri v2** | Electron inflates bundle to >150 MB and consumes 200MB+ of idle RAM. Tauri runs under 15 MB and uses native OS WebViews. |
| **`librclone` (Cgo / Go embedding)** | **Binary Sidecar (`rclone rcd`)** | Cgo creates cross-compilation nightmares on Windows/Mac and drags in hundreds of MBs of Go dependencies. Sidecar binary keeps concerns isolated and allows drop-in updates. |
| **Wails (Go)** | **Tauri (Rust)** | Tauri v2 has superior cross-platform bundle tooling, native code signing integrations, and `tauri-plugin-shell` sidecar management. |
| **Redux / MobX** | **Zustand** | Redux introduces immense boilerplate for simple UI state. Zustand has near-zero overhead and intuitive ergonomics. |
