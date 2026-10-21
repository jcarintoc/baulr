# Product Requirements Document (PRD)

## Project: Baulr (Local-First Unified Cloud Vault & Offloader)

**Status:** Draft / Active  
**Author:** Engineering & Product  
**Target Release:** MVP v0.1.0  

---

## 1. Executive Summary & Problem Statement

### 1.1 The Problem
Casual laptop and smartphone users frequently encounter "Storage Almost Full" warnings due to large photo and 4K video libraries. Apple iCloud+, Google One, and Dropbox push recurring monthly subscriptions ($1.99–$9.99/mo). Simultaneously, users often own multiple free cloud accounts (Google Drive: 15 GB, OneDrive: 5 GB, Dropbox: 2 GB, Box: 10 GB) with underutilized capacity. 

However, managing files across disjointed cloud dashboards is tedious, existing multi-cloud tools (Rclone CLI, Air Explorer) are either too complex for normal users or cost-prohibitive web services with strict bandwidth quotas.

### 1.2 The Solution
**Baulr** is a lightweight, local-first desktop application that aggregates multiple free cloud storage accounts into a single, unified virtual storage pool. It allows users to offload large media files safely with cryptographic verification to reclaim device disk space, operating with 100% user privacy and $0 developer server overhead.

---

## 2. Target Persona & Use Cases

### 2.1 Target Audience
- **Budget-conscious creators & students:** Users with laptops running out of SSD space who refuse recurring monthly cloud fees.
- **iPhone / Mobile users:** Users whose Camera Roll consumes all device storage and want a quick way to push photos/videos to free storage without iTunes or iCloud.
- **Self-reliant tech enthusiasts:** Users who value data ownership and local-first software.

### 2.2 Core Use Cases
1. **Drive Consolidation:** Connect 2–3 free accounts (e.g., Google Drive + OneDrive) to gain 20–30 GB of pooled cloud backup space for zero dollars.
2. **One-Click Local Offload:** Select a heavy local folder (e.g., `~/Movies` or `~/Downloads`), back it up to the pooled vault, verify hashes, and delete local copies to free up disk space.
3. **LAN Camera Roll Ingestion:** Scan a QR code on a home Wi-Fi network with an iPhone, upload 5 GB of videos to the desktop app, and let the desktop route them into the cloud pool.

---

## 3. Goals & Non-Goals

### 3.1 Goals
- **Zero Server Costs:** 100% peer-to-cloud communication directly from the user's desktop to the cloud APIs.
- **Data Safety First:** Never delete any local file until the remote copy passes cryptographic hash verification (MD5/SHA-1/QuickXOR).
- **Dead-Simple Interface:** No CLI flags, no technical terminology ("remotes", "mount flags", "rclone daemon"). Clean UI showing a unified progress bar and an Offloader wizard.
- **Automated Routing:** Automatically route incoming files to the cloud provider with the most available space (`mfs` policy).

### 3.2 Non-Goals (What We Explicitly Do NOT Build for MVP)
- **NO File Chunking / Striping:** Files will not be split across multiple accounts. If a single file exceeds the capacity of every individual drive, it is rejected with a clear message. (Prevents corruption and guarantees files remain viewable in original provider web interfaces).
- **NO USB MTP / iOS Drivers:** No direct USB cable iPhone reading due to OS-level driver instability. Mobile ingestion is strictly over LAN Wi-Fi.
- **NO Bi-directional Live Sync:** This is an *Archival & Offload* vault, not a live real-time two-way sync folder like Dropbox Sync.
- **NO Complex Google Photos Clone in v1:** No high-overhead 60fps virtualized media gallery or face-recognition indexing in MVP.

---

## 4. Feature Requirements & Prioritization

### P0 (Must Have for MVP)

| ID | Feature | Description | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **REQ-01** | **Cloud Authentication** | OAuth 2.0 loopback authentication for Google Drive and Microsoft OneDrive. | User can click "Connect Google Drive" / "Connect OneDrive", authenticate in system browser, and see account status change to "Connected". |
| **REQ-02** | **Account Health & Quota** | Read used and total free space for each connected account. | App accurately computes total pooled capacity and remaining free space. Flags expired tokens with a "Re-authenticate" badge. |
| **REQ-03** | **Unified Storage Pool** | Create an internal `union` remote with `mfs` (Most Free Space) write policy. | Uploaded files are automatically written to the drive currently having the largest free quota. |
| **REQ-04** | **Offload Engine** | Drag-and-drop or folder picker to offload local files. | App queues files, uploads them to the union pool, and displays real-time transfer progress and transfer speed. |
| **REQ-05** | **Integrity Verification & Safe Delete** | Checksum verification post-transfer. | After upload, compare checksums. Only prompt user "Delete local files to reclaim X GB?" once 100% of files match remote hashes. Local deletion requires explicit user confirmation. |
| **REQ-06** | **Remote File Browser** | Basic list view of pooled files with download & delete actions. | User can view all files in the pool regardless of which cloud holds them, trigger a download to local disk, or delete a file. |

### P1 (Should Have - Fast Follow)

| ID | Feature | Description | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **REQ-07** | **LAN Wi-Fi Mobile Upload** | Desktop starts local HTTP server + displays QR code. iPhone opens web uploader. | Scanning QR on same Wi-Fi opens a lightweight web page with multi-file picker. Files stream to desktop staging folder and enter the upload queue. |
| **REQ-08** | **Dropbox & Box Support** | Expand supported providers to Dropbox (2 GB) and Box (10 GB). | Users can attach Dropbox and Box to the union pool. |
| **REQ-09** | **Bandwidth Limiter** | User-configurable maximum upload/download speed limit. | Prevents Baulr from saturating home internet during large video uploads. |

### P2 (Nice to Have - Post MVP)

| ID | Feature | Description |
| :--- | :--- | :--- |
| **REQ-10** | **Media Preview & Thumbnail Grid** | Lightweight local thumbnail caching for image files. |
| **REQ-11** | **Duplicate Detection** | Pre-upload hash check to avoid uploading identical photos/videos already backed up. |
| **REQ-12** | **Scheduled Idle Backups** | Option to pause uploads when laptop is on battery or active user input. |

---

## 5. User Workflows

```
Workflow 1: Account Setup
[Open App] -> [Click "Add Account"] -> [Select Google Drive] 
           -> [Browser OAuth Sign-In] -> [Token Stored Securely] 
           -> [Vault Bar updates: "15 GB Available"]

Workflow 2: Offloading Local Media
[Drag Folder into Offloader] -> [App checks available pooled space]
                             -> [Transfers files via Rclone Union (mfs)]
                             -> [Verifies Checksums against Remote]
                             -> [Modal: "12.4 GB safely stored. Free up local disk?"]
                             -> [User clicks Confirm -> Local files sent to Trash/Recycle Bin]

Workflow 3: Mobile Photo Offload (P1)
[Click "Receive from Phone"] -> [Desktop displays QR code]
                             -> [User scans with iPhone Camera]
                             -> [Safari opens LAN Web Uploader]
                             -> [User selects videos/photos]
                             -> [Streams directly to Desktop -> Queued to Cloud Vault]
```

---

## 6. Edge Cases & Risk Mitigation

1. **Token Invalidation / Expiry:**
   - *Risk:* Refresh tokens expire or are revoked by the provider.
   - *Mitigation:* Pre-flight health check on app startup. If any remote in the union fails authentication, the app alerts the user immediately and locks offload writes until refreshed.
2. **File Exceeds Free Space of Any Single Drive:**
   - *Risk:* A 12 GB 4K video cannot fit into an 8 GB remaining Google Drive or a 5 GB OneDrive.
   - *Mitigation:* Strict validation before upload. Check file size against `max(remaining_space_per_drive)`. If insufficient, display: *"This file (12 GB) is larger than the available space on any single connected drive. Please connect an account with at least 12 GB free."*
3. **Accidental Deletion of Cloud Files:**
   - *Mitigation:* Deleting a file in Baulr moves it to the respective cloud provider's **Trash / Recycle Bin** rather than executing a hard permanent delete.
4. **Network Interruption During Upload:**
   - *Mitigation:* Chunked resume supported natively via Rclone's multipart/resumable upload logic.

---

## 7. Success Metrics

- **Zero Data Loss Incident Rate:** 0% corruption or premature local file deletion.
- **Onboarding Completion Rate:** >80% of users successfully connect at least 1 cloud account within 3 minutes.
- **Space Reclaimed per Active User:** Average of >15 GB local space reclaimed per user.
