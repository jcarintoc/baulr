# Architecture Design Document

## Project: Baulr (Local-First Unified Cloud Vault & Offloader)

**Status:** Approved  
**Author:** Engineering & Architecture  
**Document:** `ARCHITECTURE.md`  

---

## 1. System Overview

Baulr operates on a **Local-First, Zero-Cloud-Server** architecture. All data processing, encryption, cloud API authentication, and file transfers occur directly on the user's host machine.

```
+---------------------------------------------------------------------------------+
|                                 BAULR CLIENT                                    |
|                                                                                 |
|  +---------------------------------------------------------------------------+  |
|  |                     Presentation Layer (Frontend UI)                      |  |
|  |             - Storage Pool Gauge        - Offload Drag & Drop             |  |
|  |             - Cloud Accounts Manager    - Remote File Explorer            |  |
|  |             - QR Code Wi-Fi Portal                                        |  |
|  +-------------------------------------+-------------------------------------+  |
|                                        | IPC (Tauri Commands / Events)          |
|  +-------------------------------------v-------------------------------------+  |
|  |                     Application Core (Rust Backend)                       |  |
|  |  +---------------------+ +----------------------+ +--------------------+  |  |
|  |  | Process Supervisor  | | Offload Orchestrator | | Embedded LAN Server|  |  |
|  |  | (Spawns & monitors  | | (Verifies checksums, | | (Axum HTTP Server,  |  |  |
|  |  |  Rclone sidecar)    | |  safe-delete state)  | |  QR mobile upload) |  |  |
|  |  +----------+----------+ +----------+-----------+ +---------+----------+  |  |
|  |             |                       |                       |             |  |
|  |             | Localhost HTTP RPC    | SQLite Query          | File Stream |  |
|  +-------------|-----------------------|-----------------------|-------------+  |
|                |                       |                       |                |
|  +-------------v-------------+ +-------v-------+ +-------------v-------------+  |
|  | Storage Engine (Sidecar)  | | Local Storage | | iPhone / Mobile Device    |  |
|  | Rclone Daemon (rcd)       | | SQLite Cache  | | Mobile Browser (Safari)   |  |
|  | (127.0.0.1:<random-port>) | | & Thumbnails  | | Connected via Home Wi-Fi  |  |
|  +-------------+-------------+ +---------------+ +---------------------------+  |
+----------------|----------------------------------------------------------------+
                 | Direct Cloud APIs (HTTPS / OAuth 2.0)
                 v
   +-----------------------------+-----------------------------+
   |                             |                             |
+--v------------------+  +-------v-------------+  +------------v--------+
| Google Drive API    |  | Microsoft Graph API |  | Dropbox API (P1)    |
| (15 GB Free Tier)   |  | (OneDrive 5 GB)     |  | (2 GB Free Tier)    |
+---------------------+  +---------------------+  +---------------------+
```

---

## 2. Core Subsystems

### 2.1 Storage Engine (Rclone Daemon Sidecar)

Rather than embedding `librclone` as a Cgo/Go dependency (which introduces massive compilation bloat and linkage bugs), Baulr packages a pre-compiled `rclone` binary as an external sidecar managed by the application lifecycle.

1. **Daemon Startup:**
   - App spawns: `rclone rcd --rc-addr 127.0.0.1:0 --rc-no-auth --config <app_data>/rclone.conf --log-file <app_data>/rclone.log`
   - Port `0` instructs the OS to bind an available ephemeral loopback port, avoiding port collisions.
   - App parses stdout to retrieve the assigned port and verifies liveness via `POST http://127.0.0.1:<port>/rc/noop`.
2. **Shutdown & Cleanup:**
   - On app exit or crash, the core issues `POST /core/quit` or sends `SIGTERM`. If unresponsive within 3 seconds, `SIGKILL` is issued.

### 2.2 Storage Virtualization (`rclone union`)

Cloud aggregation is implemented via Rclone's native `union` backend:

- **Upstream Remotes:** Dedicated folders inside each provider (e.g., `gdrive:BaulrVault`, `onedrive:BaulrVault`).
- **Union Remote Name:** `baulr_vault:`
- **Policies:**
  - `action_policy = mfs`: Routes file write operations to the remote with the **Most Free Space**.
  - `create_policy = mfs`: New directory paths and files created on the provider with highest remaining quota.
  - `search_policy = ff`: Searches first found across the pooled remotes.

```ini
[baulr_vault]
type = union
upstreams = gdrive:BaulrVault onedrive:BaulrVault
action_policy = mfs
create_policy = mfs
search_policy = ff
```

### 2.3 Offload & Verification Pipeline

Data loss prevention is paramount. The offloader executes a deterministic 6-step state machine:

```
[1. ENQUEUE]       User drops files/folders into Offloader UI.
       |
[2. CAPACITY]      Validate: Total batch size <= Total remaining space in pool
       |           Validate: max(file_size) <= max(remaining_space_per_drive).
       |
[3. TRANSFER]      Invoke Rclone `sync/copy` to `baulr_vault:`.
       |           Poll `core/stats` at 500ms intervals for real-time progress.
       |
[4. VERIFICATION]  Compute local hash (MD5 / SHA1) and query remote hash via
       |           Rclone `operations/fsinfo` or `operations/check`.
       |           If hash mismatch -> Abort, flag error, preserve local file.
       |
[5. CONFIRMATION]  UI modal displays: "X GB safely stored in cloud. Free up space?"
       |           User explicitly clicks "Reclaim Space".
       |
[6. SAFE DELETE]   Move verified local files to OS Trash / Recycle Bin (not raw unlink).
```

### 2.4 Mobile LAN Ingestion (Wi-Fi QR Portal)

To bypass iOS MTP and USB driver issues, the Rust core runs an embedded HTTP server (Axum):

1. User clicks **"Receive from Phone"** on the desktop.
2. Desktop retrieves primary local LAN IP (e.g., `192.168.1.145`) and binds `0.0.0.0:<port>`.
3. Desktop renders a QR code encoding `http://192.168.1.145:<port>?token=<session_secret>`.
4. User scans QR code with iPhone Camera app, opening Safari.
5. Safari loads a minimal web app featuring `<input type="file" multiple accept="image/*,video/*">`.
6. Files stream as `multipart/form-data` directly to a local desktop staging folder `~/Baulr/Staging/`.
7. Once received, the desktop app automatically ingests staging files into the Cloud Offload queue.

---

## 3. Communication Protocol (Rclone JSON-RPC)

All interactions between the Rust core and Rclone occur via HTTP JSON-RPC over loopback. Key endpoints:

| Action | RPC Endpoint | Payload Summary |
| :--- | :--- | :--- |
| **Ping Engine** | `POST /rc/noop` | `{}` |
| **Authenticate Provider** | `POST /config/create` | `{ "name": "gdrive", "type": "drive", "parameters": { ... } }` |
| **Create Vault Union** | `POST /config/create` | `{ "name": "baulr_vault", "type": "union", "parameters": { "upstreams": "..." } }` |
| **Query Pool Quota** | `POST /operations/about` | `{ "fs": "baulr_vault:" }` |
| **Query Remote Files** | `POST /operations/list` | `{ "fs": "baulr_vault:", "remote": "" }` |
| **Execute Transfer** | `POST /sync/copy` | `{ "srcFs": "/path/to/local", "dstFs": "baulr_vault:" }` |
| **Transfer Stats** | `POST /core/stats` | `{}` |
| **Stop Engine** | `POST /core/quit` | `{}` |

---

## 4. Local Persistence & Cache Architecture

```
~/.baulr/ (or %APPDATA%/Baulr / ~/Library/Application Support/Baulr)
├── rclone.conf             # Remote definitions and encrypted tokens
├── rclone.log              # Rotating log file (max 10MB)
├── baulr.db                # SQLite metadata and transfer history
└── thumbnails/             # Cached image previews (P2)
```

### SQLite Schema (`baulr.db`):
- `transfers`: Tracks active and completed offload batches `{ id, local_path, remote_path, size, status, hash, created_at, completed_at }`.
- `cached_index`: Ephemeral index of files found on the remote to render the file list instantly without blocking on cloud network latency.
- `settings`: User preferences (bandwidth throttle, auto-cleanup toggles).

---

## 5. Security & Authentication Architecture

1. **OAuth 2.0 Loopback:** 
   Authentication starts locally. Rclone opens a temporary HTTP server on `http://127.0.0.1:53682/` and opens the user's default browser to Google / Microsoft login.
2. **Credential Storage:**
   The `rclone.conf` file contains OAuth refresh tokens. On macOS and Windows, this file is encrypted with a master key generated on first run and stored in the **macOS Keychain** or **Windows Credential Manager**.
3. **LAN Upload Session Protection:**
   The mobile upload URL includes an ephemeral one-time session token (`?token=...`). Requests without a valid token are rejected with HTTP 403, preventing other devices on the same Wi-Fi network from pushing unauthorized files.
