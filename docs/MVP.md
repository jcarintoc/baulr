# Minimum Viable Product (MVP) Specification & Execution Plan

## Project: Baulr (Local-First Unified Cloud Vault & Offloader)

**Status:** Ready for Execution  
**Document:** `MVP.md`  
**Target Release:** v0.1.0  

---

## 1. MVP Core Objective

Deliver the fastest working desktop application that successfully:
1. Connects **two free cloud accounts** (Google Drive + Microsoft OneDrive).
2. Unifies them into a single virtual pool with zero CLI friction.
3. Allows a user to drag a local folder, securely offload it to the pool, verify checksums, and safely delete local files to reclaim disk space.

---

## 2. In-Scope vs. Out-of-Scope (Strict YAGNI Gate)

### In-Scope (v0.1.0 MVP)
- [x] **Rclone Sidecar Supervisor:** Tauri spawns `rclone rcd` on loopback port, tracks health, and cleans up on exit.
- [x] **2 Cloud Connectors:** Google Drive (15 GB) + OneDrive (5 GB).
- [x] **Virtual Pool Creation:** Automated `rclone union` setup with `mfs` (Most Free Space) write policy.
- [x] **Storage Gauge UI:** Clean aggregated capacity bar showing Total Used, Total Free, and Breakdown by Account.
- [x] **Offload Engine:** Folder picker / drag-and-drop file queue transferring files into `baulr_vault:`.
- [x] **Integrity Verification:** Post-upload hash check comparing local checksum against remote checksum before offering local file deletion.
- [x] **Safe Local Cleanup:** Moves verified local files to the OS Trash/Recycle Bin (never destructive `rm`).
- [x] **Basic Remote File List:** Flat table view of files in the vault with "Download" and "Move to Cloud Trash" actions.

### Deferred (Post-MVP / v0.2.0+)
- [ ] *LAN Wi-Fi QR Code iPhone Uploader* (Deferred to v0.2.0).
- [ ] *Dropbox & Box Connectors* (Deferred to v0.2.0).
- [ ] *Local Image Thumbnail Cache & EXIF Extraction* (Deferred to v0.3.0).
- [ ] *Bandwidth Throttler* (Deferred to v0.3.0).
- [ ] *File Chunking / Multi-drive Striping* (Permanently rejected to prevent data corruption).

---

## 3. Implementation Milestones

```
+--------------------------------------------------------------------------+
| MILESTONE 1: Rclone Sidecar & Core IPC (Days 1-2)                       |
| - Bundle platform Rclone binary into src-tauri/binaries/                 |
| - Implement Rust daemon runner with loopback port detection              |
| - Implement JSON-RPC client (POST /rc/noop, /core/stats)                 |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| MILESTONE 2: OAuth & Union Management (Days 3-4)                         |
| - Wire Tauri commands to Rclone config/create for Google Drive & OneDrive|
| - Trigger loopback OAuth in default browser                              |
| - Automatically generate 'baulr_vault' union remote                      |
| - Query operations/about to calculate total aggregated quota             |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| MILESTONE 3: UI Dashboard & Offload Pipeline (Days 5-6)                  |
| - Build StorageGauge, AccountCard, and Dropzone in React + Tailwind      |
| - Offload queue calling Rclone sync/copy                                 |
| - Real-time progress bar polling core/stats                              |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| MILESTONE 4: Verification, Safe Delete & Remote File List (Day 7)        |
| - Cryptographic hash check post-transfer (MD5 / QuickXOR)                |
| - "Safe to Reclaim" confirmation modal -> Move local files to OS Trash   |
| - Remote file list via operations/list with download & trash buttons     |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| MILESTONE 5: End-to-End Testing & Cross-Platform Packaging (Day 8)       |
| - Validate macOS (DMG/App) and Windows (MSI/NSIS) builds                 |
| - Test edge cases: Network cutoff, full disk, revoked OAuth token        |
+--------------------------------------------------------------------------+
```

---

## 4. Acceptance Criteria & Verification Checklist

| Test Case | Scenario | Expected Result |
| :--- | :--- | :--- |
| **TC-01** | First Launch | Rclone daemon spawns silently on 127.0.0.1; dashboard shows 0 B total storage with prompt to add an account. |
| **TC-02** | Google Drive Connect | Browser opens OAuth; user signs in; app card turns green and reports remaining free space. |
| **TC-03** | OneDrive Connect | App card turns green; Storage Gauge updates to show combined free space (e.g. 15GB + 5GB = 20GB). |
| **TC-04** | Offload Folder (500 MB) | Files stream to whichever drive has more space; progress bar shows real-time transfer speed. |
| **TC-05** | Hash Verification | After transfer, all files are checked against remote checksums. If 100% match, show green "Verified" badge. |
| **TC-06** | Local Space Reclaim | Clicking "Reclaim Space" sends local files to Trash/Recycle Bin; local disk free space increases. |
| **TC-07** | Network Interruption | Disconnect Wi-Fi mid-transfer; transfer pauses gracefully; reconnecting Wi-Fi resumes transfer without re-uploading completed files. |
| **TC-08** | Token Expiration | If an account token is revoked, app flags that card with "Needs Re-authentication" and disables offload until resolved. |

---

## 5. Definition of Done (DoD)

1. Zero manual CLI commands required by the end user.
2. Codebase contains no mock or fake file transfers; real files upload to live Google Drive and OneDrive accounts.
3. Every transferred file is verified cryptographically before local deletion is offered.
4. Standalone desktop installer builds cleanly for macOS and Windows.
