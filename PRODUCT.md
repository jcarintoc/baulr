# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
General non-technical consumers wanting simple, automated backup for their personal documents, family photos, and videos without paying for costly recurring cloud storage subscriptions.

## Product Purpose
Baulr makes personal media offloading effortless and risk-free by pooling free cloud tiers (Google Drive 15 GB + OneDrive 5 GB) into a single virtual vault, verifying file integrity with checksums, and safely reclaiming local disk space via the OS Trash.

## Positioning
A friendly, local-first desktop vault with zero CLI intimidation, zero data loss (cryptographic hash verified before moving local files to Trash), zero monthly subscription, and no proprietary lock-in (files remain natively accessible on cloud web drives).

## Operating Context
Desktop operating systems (macOS, Windows, Linux) via a lightweight native webview (Tauri v2). Users drag and drop folders/files from their local file explorer (Finder/Explorer) or pick directories to offload when their laptop drive is full.

## Capabilities and Constraints
- **Capabilities:** Connects Google Drive and Microsoft OneDrive; automatically configures an aggregated `baulr_vault:` union remote with Most Free Space (`mfs`) write policy; visualizes unified storage capacity; handles folder drag-and-drop offloading; performs post-transfer cryptographic verification; safely deletes local files to OS Trash.
- **Constraints:** Zero CLI execs (persistent `rclone rcd` daemon over loopback HTTP JSON-RPC); zero hard deletions (`rm` banned; Trash only); cloud is the source of truth (local SQLite is an ephemeral cache); Web Developer maintainability first.

## Brand Commitments
- **Name:** Baulr (a friendly, reliable personal vault/trunk).
- **Voice:** Reassuring, clear, transparent, and non-intimidating. Plain language over technical jargon (e.g., "Verified safe to delete" instead of "MD5 checksum matched remote inode").
- **Visuals:** Dark mode default with warm, clean accents; high-clarity storage gauges and explicit status feedback.

## Evidence on Hand
- Detailed specifications in `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/TECHSTACK.md`, and `docs/MVP.md`.
- Working Tauri v2 + Rclone sidecar engine with dynamic port extraction, loopback JSON-RPC client, and verified unit/lifecycle tests.

## Product Principles
- **Zero-Loss Safety Above All:** Never delete a local file until its remote copy passes cryptographic hash verification, and always move to the OS Trash rather than permanently deleting.
- **Non-Technical Simplicity:** Mask all cloud infrastructure complexity behind an intuitive, single-button desktop experience anyone who uses Google Drive or Dropbox can immediately navigate.
- **Cloud is Sovereign Truth:** Local databases and indices are disposable caches; if local state conflicts with remote cloud state, remote state wins.
- **No Subscription Hostage:** Empower users to maximize the free cloud storage tiers they already own without paying $2.99–$9.99/mo for extra laptop space.

## Accessibility & Inclusion
- WCAG AA contrast compliance across all themes.
- Legible typography hierarchy utilizing variable font (`Manrope`).
- Keyboard-navigable modals and explicit screen-reader status alerts for background transfers and file verification results.
