# Post-MVP Issues & Stabilization Plan

This document tracks issues, edge cases, and feature enhancements identified during local macOS desktop testing of the **v0.1.0 MVP release**, organized by priority and implementation phases before starting **v0.2.0**.

---

## 1. Issue Matrix

| ID | Issue Description | Priority | Complexity | Phase | Status |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **ISSUE-02** | OneDrive fails when uploading files/folders | 🔴 **P0** | Medium | Phase 1 | `[x] Resolved` |
| **ISSUE-03** | UI doesn't update on connect (requires double sync) | 🔴 **P0** | Low | Phase 1 | `[x] Resolved` |
| **ISSUE-04** | Disconnected account files remain in Vault Files tab | 🔴 **P0** | Low | Phase 1 | `[x] Resolved` |
| **ISSUE-06** | Drag and drop only accepts one file/folder at a time | 🟠 **P1** | Low | Phase 2 | `[ ] Open` |
| **ISSUE-07** | Upload errors lack dismiss/cancel button, blocking queue | 🟠 **P1** | Low | Phase 2 | `[ ] Open` |
| **ISSUE-01** | Choose upload cloud provider ("Let Baulr decide" vs manual) | 🟡 **P2** | Medium | Phase 3 | `[ ] Open` |
| **ISSUE-05** | Uploading duplicate folder names merges silently | 🟡 **P2** | High | Phase 3 | `[ ] Open` |
| **ISSUE-08** | Uploading duplicate file names creates conflicts / no-ops | 🟡 **P2** | High | Phase 3 | `[ ] Open` |

---

## 2. Issue Details & Root Causes

### 🔴 Phase 1: Critical Connection & State Synchronization (P0)

#### ISSUE-02: OneDrive Upload / Sync Failure
- **User Finding:** OneDrive connects successfully via browser OAuth, but file and folder uploads fail.
- **Root Cause:** In `src-tauri/src/commands/accounts.rs`, `resolve_provider_config("onedrive")` passes empty parameters (`HashMap::new()`). In Rclone, an OAuth-authenticated OneDrive remote requires `drive_type` (e.g., `personal`) and auto-detected `drive_id`. Rclone logs show:
  ```
  ERROR : rc: "operations/about": error: unable to get drive_id and drive_type - if you are upgrading from older versions of rclone, please run rclone config
  ```
- **Solution:** Pass `"drive_type": "personal"` during `create_oauth_remote` or auto-query the default drive ID via Rclone on initial connect so `onedrive:BaulrVault` can read/write normally.

#### ISSUE-03: Stale UI on Connect (Requires Double-Clicking Sync)
- **User Finding:** After connecting to a cloud provider in the browser, the UI does not immediately reflect the connected state or update the Vault Files tab without clicking sync multiple times.
- **Root Cause:**
  1. `connectAccount` in `useVaultStore` updates quota, but does not notify `useRemoteFilesStore.fetchFiles()` to refresh the file directory.
  2. The cached quota in `AppState` is not reactively invalidated immediately upon OAuth completion.
- **Solution:** In `useVaultStore.connectAccount`, automatically trigger `useRemoteFilesStore.getState().fetchFiles()` and ensure `get_vault_quota` reflects the newly updated union state.

#### ISSUE-04: Disconnected Account Files Remain Visible in Vault Files
- **User Finding:** Disconnecting an account (e.g., Google Drive) still shows the account's files in the 'Vault Files' tab.
- **Root Cause:** When an account is disconnected, if it was the only account, `sync_vault_union` deletes `baulr_vault:`. Subsequent calls to `list_vault_files` fail with an error. In `useRemoteFilesStore.ts`, the `catch` block sets an error message but leaves the stale `files` array in state.
- **Solution:**
  1. In `src-tauri/src/commands/browser.rs`, handle unconfigured/empty vault gracefully in `list_vault_files` by returning `Ok(vec![])`.
  2. In `useRemoteFilesStore.ts`, clear `files: []` when an error occurs or when an account is disconnected.
  3. Hook account disconnect in `useVaultStore` to refresh or reset the file store.

---

### 🟠 Phase 2: Queue & Drag-and-Drop Usability (P1)

#### ISSUE-06: Drag-and-Drop Limited to One Item at a Time
- **User Finding:** Dragging multiple folders or files only processes the first one.
- **Root Cause:** In `src/components/offloader/DropzoneCard.tsx`:
  - Line 28: `if (!disabled && event.payload.paths?.[0]) { onSelectPath(event.payload.paths[0]); }`
  - Line 74: `const path = (e.dataTransfer.files[0] as unknown as { path?: string })?.path;`
  Only index `0` is passed, discarding the rest of the array.
- **Solution:** Update `onSelectPath` to `onSelectPaths: (paths: string[]) => void`. In `DropzoneCard`, pass all dropped paths (`event.payload.paths`), and loop over them in `useTransferStore.startOffload` to queue each item.

#### ISSUE-07: Upload Errors Lack Cancel / Dismiss Action
- **User Finding:** When a file upload encounters an error, there is no cancel or dismiss button, leaving the errored transfer stuck in the queue.
- **Root Cause:** In `src/components/offloader/TransferQueue.tsx`, line 86 checks `item.jobId && onCancel && item.status === "uploading"`. The cancel button is completely omitted when `item.status === "error"`.
- **Solution:** Add a dismiss/remove button (`<IconX />`) for items with `item.status === "error"` that calls `removeQueueItem(item.id)`, allowing users to dismiss failed jobs and keep other queue items running cleanly.

---

### 🟡 Phase 3: Upload Routing & Cloud Name Conflicts (P2)

#### ISSUE-01: Upload Cloud Provider Selector ("Let Baulr Decide" vs Manual)
- **User Finding:** Users want the ability to explicitly pick which cloud account receives an upload, with a default "Let Baulr decide" option.
- **Root Cause:** `start_offload` hardcodes destination to `baulr_vault:` (`mfs` write policy).
- **Solution:**
  1. Extend `start_offload` to accept an optional `target_provider: Option<String>` (`"auto"`, `"gdrive"`, `"onedrive"`).
  2. If a specific provider is chosen, target `<provider>:BaulrVault/` directly; otherwise target `baulr_vault:`.
  3. Add a selector dropdown in `DropzoneCard` or the offloader header defaulting to "Let Baulr decide (Auto)".

#### ISSUE-05 & ISSUE-08: Duplicate Folder and File Upload Conflicts
- **User Finding:**
  - Uploading a folder with the same name as an existing cloud folder merges silently without warning or indicating it exists.
  - Uploading a file with the same name as an existing cloud file either skips or fails to upload.
- **Root Cause:** Unlike downloads (where we implemented `resolve_unique_destination_name`), uploads directly copy to `dst_fs` with the exact local name.
- **Solution:**
  1. Add a pre-flight cloud existence check (`operations/list` on destination) before starting upload.
  2. Provide automatic conflict resolution: auto-disambiguate on duplicate (`name (1)`, `name (2)`) or prompt user to overwrite/skip.

---

## 3. Execution Checklist

### Phase 1: Critical Connection & Sync Fixes
- [x] Fix OneDrive `drive_type` / drive ID configuration in `src-tauri/src/commands/accounts.rs`.
- [x] Auto-refresh Vault Files and Quota reactively on account connection.
- [x] Clear file store and return empty list when vault has no connected accounts.
- [x] Extend Rclone HTTP client timeout to 45s to eliminate Google Drive & union listing timeouts.
- [x] Stabilize multi-cloud Combined Storage Pool (20 GB) and prevent false "Re-authenticate" warnings.
- [x] Recreate union cleanly on account transitions and preserve `BaulrVault` scoping.
- [x] Add user-friendly error Alert and retry CTA in `VaultBrowserTable.tsx`.
- [x] Verify Phase 1 test suite (`cargo test`, `pnpm test`, production build).

### Phase 2: Queue & Drag-and-Drop UX
- [ ] Support multi-path drops in `DropzoneCard.tsx`.
- [ ] Queue multiple items sequentially/concurrently in `useTransferStore.ts`.
- [ ] Add dismiss button for failed/errored items in `TransferQueue.tsx`.
- [ ] Verify Phase 2 test suite.

### Phase 3: Upload Routing & Name Conflicts
- [ ] Support `target_provider` in `start_offload` backend and frontend API.
- [ ] Add provider selector UI ("Let Baulr decide", "Google Drive", "OneDrive").
- [ ] Implement cloud pre-flight collision disambiguation for uploads.
- [ ] Verify Phase 3 test suite.
