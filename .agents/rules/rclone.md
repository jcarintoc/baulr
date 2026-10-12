# Technology Rules: Rclone Sidecar Engine

**File:** `.agents/rules/rclone.md`  
**Scope:** Applied to Rclone subprocess management, configuration, and JSON-RPC communication  
**Audience:** AI agents writing or modifying Rclone integration code  

---

## 1. Core Rule: Persistent Daemon (`rcd`), Zero CLI Execs

### 1.1 Strictly Prohibited
Never spawn one-off CLI commands such as:
```rust
// FORBIDDEN: Spawning one-off CLI processes
Command::new("rclone").args(["copy", "/local", "remote:/"]).spawn();
```
*Why this is banned:* Spawning CLI processes re-parses config files, lacks real-time progress streaming, causes process leaks, and cannot be gracefully cancelled mid-flight.

### 1.2 Required Pattern
Run a single, persistent Rclone Remote Control Daemon (`rclone rcd`) as a managed child process. All actions (authentication, listing, copying, checking quotas) MUST be executed via HTTP JSON-RPC over loopback.

---

## 2. Daemon Startup & Port Allocation

### 2.1 Dynamic Port Binding (`127.0.0.1:0`)
Never hardcode port `5572`. Binding a fixed port fails if another Rclone process or developer tool is running.

Launch arguments:
```bash
rclone rcd \
  --rc-addr 127.0.0.1:0 \
  --rc-no-auth \
  --config "<APP_DATA_DIR>/rclone.conf" \
  --log-file "<APP_DATA_DIR>/rclone.log" \
  --log-level NOTICE
```

### 2.2 Port Extraction & Readiness Check
1. The Rust supervisor must monitor Rclone's stderr on startup to capture the dynamic port:
   `Serving remote control on http://127.0.0.1:[PORT]/`
2. Once extracted, the supervisor polls `POST http://127.0.0.1:[PORT]/rc/noop` every 100ms (up to a 5-second timeout) before marking the engine ready.

### 2.3 Process Supervision & Shutdown
- Keep a handle to the `Child` process.
- On application shutdown, send `POST /core/quit` or `SIGTERM`.
- Wait 3 seconds; if the process does not terminate, issue `SIGKILL`.

---

## 3. Storage Pooling (`rclone union`) Standards

### 3.1 Vault Configuration
All cloud accounts are grouped under a single virtual remote named `baulr_vault:`.

Standard configuration parameters:
- `type`: `union`
- `upstreams`: Space-separated list of target folders (e.g. `gdrive:BaulrVault onedrive:BaulrVault`)
- `action_policy`: `mfs` (Most Free Space — routes file modifications/writes to the remote with the most free storage)
- `create_policy`: `mfs` (New folders and uploads go to the emptiest drive)
- `search_policy`: `ff` (First Found — returns existing files from whichever upstream contains them)

### 3.2 Dynamic Pool Updating
When the user connects or disconnects a cloud account:
1. Update `rclone.conf` using `config/create` or `config/update`.
2. Reconfigure `baulr_vault` with the updated `upstreams` list.
3. Refresh quota metrics via `operations/about`.

---

## 4. JSON-RPC Communication Rules

All requests are HTTP `POST` requests with JSON bodies: `Content-Type: application/json`.

| Action | Endpoint | Rules & Precautions |
| :--- | :--- | :--- |
| **Health Check** | `/rc/noop` | Used on startup and periodic liveness heartbeats. |
| **OAuth Connect** | `/config/create` | Set `config_is_local=true` to initiate browser loopback on `127.0.0.1:53682`. |
| **Query Pool Quota** | `/operations/about` | Pass `{ "fs": "baulr_vault:" }`. Return total, used, and free bytes. |
| **List Files** | `/operations/list` | Always pass `{ "fs": "baulr_vault:", "remote": "" }`. Use `opt: { "showHash": true }`. |
| **Transfer Files** | `/sync/copy` | Pass `srcFs` and `dstFs`. Must run asynchronously; monitor via `/core/stats`. |
| **Transfer Progress** | `/core/stats` | Poll at 500ms intervals during active transfers. Stop polling when transfers reach 0. |
| **Cancel Transfer** | `/core/transfers-delete`| Used if the user clicks "Cancel" in the UI. |

---

## 5. Security & Secret Protection

1. **Zero Secret Logging:** Never write OAuth refresh tokens, access tokens, or client secrets to `stdout`, `stderr`, or persistent logs.
2. **Loopback Isolation:** The daemon MUST only listen on `127.0.0.1`. Never bind `0.0.0.0` for `rclone rcd`.
3. **No Chunker Overlay (MVP):** Do NOT enable `rclone chunker` in MVP. Keep files whole to avoid multi-account split corruption.

---

## 6. Verification Checklist

Before submitting code touching Rclone:
- [ ] Daemon boots and reports a dynamic port.
- [ ] `/rc/noop` succeeds.
- [ ] Connecting a drive updates `baulr_vault` definition.
- [ ] Killing the desktop app cleanly terminates the background `rclone` daemon.
