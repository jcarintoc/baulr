# Project Logs & Decision Memory

### [2026-10-12] Project Inception & Specifications
- **asked:** create PRD, Architecture Design, Tech Stack, and MVP specifications for Baulr.
- **decided:** Tauri v2 (Rust) + Rclone sidecar daemon over HTTP JSON-RPC + React 19 frontend; reject chunker and USB MTP to eliminate corruption and complexity.
- **shipped:** PRD.md, ARCHITECTURE.md, TECHSTACK.md, MVP.md.

### [2026-10-12] Engineering Rules Architecture
- **asked:** establish rules for a Web Developer maintainer across Rust, Rclone, and Frontend.
- **decided:** single AGENTS.md for global rules; split tech rules into .agents/rules/tauri-rust.md, rclone.md, and frontend.md; zero panics in Rust.
- **shipped:** AGENTS.md, .agents/rules/tauri-rust.md, .agents/rules/rclone.md, .agents/rules/frontend.md.

### [2026-10-12] Agent Memory & Knowledge Graph
- **asked:** give agents persistent memory and roadmap tracking linked to BRAIN.md and AGENTS.md.
- **decided:** 3-line format (asked/decided/shipped) for memory logs; wiki-links for ROADMAP.md; BRAIN.md as the central knowledge hub.
- **shipped:** .agents/skills/project-logs.md, .agents/skills/roadmap.md, BRAIN.md, ROADMAP.md, PROJECT_LOGS.md.

### [2026-10-12] Move Specs and State Files to docs/
- **asked:** user moved markdown specs and state files to docs/, update paths to relative.
- **decided:** use portable relative paths across BRAIN.md, AGENTS.md, skills, and docs/.
- **shipped:** updated link references in BRAIN.md, AGENTS.md, .agents/skills/project-logs.md, and .agents/skills/roadmap.md.

### [2026-10-12] Standardize Skills Directory for Gemini
- **asked:** convert skills in .agents/skills to standard Gemini format with SKILL.md and update doc links.
- **decided:** folder-per-skill structure (.agents/skills/<name>/SKILL.md) with YAML frontmatter and relative link references.
- **shipped:** updated project-logs/SKILL.md, roadmap/SKILL.md, BRAIN.md, and AGENTS.md.

### [2026-10-12] Rust Environment Installed
- **asked:** install Rust compiler via Homebrew.
- **decided:** use Homebrew package manager for rust/cargo toolchain on macOS.
- **shipped:** verified rustc 1.99.0 and cargo 1.99.0 available on host.

### [2026-10-12] Scaffold Tauri v2 + React 19 Project
- **asked:** set up the app with Tauri v2, React 19, TypeScript, and modern tooling.
- **decided:** scaffold via create-tauri-app with Tailwind v4, Zustand, Lucide icons, and strict src/lib/api/ IPC layer.
- **shipped:** complete working frontend/backend skeleton with get_vault_quota IPC, verified with pnpm build and cargo check.

### [2026-10-12] Initialize shadcn with Preset
- **asked:** add shadcn into the project using preset b6t6Agpn6.
- **decided:** use shadcn init with preset, configure @/* path aliases in Vite & TS, install button and progress components.
- **shipped:** components.json, src/lib/utils.ts, src/components/ui/button.tsx, and src/components/ui/progress.tsx.

### [2026-10-12] Implement Tauri Specta & WebKit Hardening
- **asked:** review best practice tips and apply end-to-end type safety, WebKit hardening, and rule updates.
- **decided:** adopt tauri-specta for auto-generating TS bindings; reject TanStack Query in favor of Zustand + event streams; harden WebKit against drop navigation.
- **shipped:** tauri-specta in Cargo.toml, src/lib/bindings.ts, drop/contextmenu guards in src/main.tsx, updated .agents/rules/tauri-rust.md and frontend.md.

### [2026-10-12] Rule Activation Mode Migrated to Glob
- **asked:** switch rule activation mode from Always On to Glob across .agents/rules and determine appropriate glob patterns.
- **decided:** use trigger: glob with dual globs/glob fields and domain descriptions for maximum tool compatibility across Antigravity and Cursor.
- **shipped:** configured targeted glob patterns and descriptions across all 6 rule files in .agents/rules, fixing malformed frontmatter in test rules.

### [2026-10-12] Ponytail Review Complexity Reduction
- **asked:** review diff for over-engineering and apply simplifications.
- **decided:** delete boilerplate greet command, remove duplicate export test, remove duplicate types, prune speculative test rules, and standardize on single globs key.
- **shipped:** deleted test-desktop-e2e.md and test-frontend-unit.md, removed greet command and regenerated bindings, re-exported bindings in types.ts; verified via cargo test and pnpm tsc.

### [2026-10-13] Install & Configure Frontend and Backend Test Suites
- **asked:** install testing libraries for Rust backend and React frontend, configure test runners, and verify pipeline.
- **decided:** add Vitest + React Testing Library for frontend in vite.config.ts; add tempfile and tauri test feature in Cargo.toml; reject TanStack Query as YAGNI.
- **shipped:** src/test/setup.ts, src/test/formatters.test.ts, package.json test scripts, verified 4 frontend tests via pnpm test and 1 backend test via cargo test.

### [2026-10-13] Ponytail Review Cleanup (Net -15 Lines)
- **asked:** review diff for over-engineering and apply simplifications.
- **decided:** remove duplicate specta export block from unit test, prune speculative tokio/tauri test features from Cargo.toml, delete redundant type re-exports in types.ts and vault.ts, and shrink error guards.
- **shipped:** trimmed 15 lines across lib.rs, Cargo.toml, vault.ts, and types.ts; verified all tests and production builds pass.

### [2026-10-13] Milestone 1: Rclone Sidecar Supervisor & Loopback JSON-RPC
- **asked:** install rclone, bundle sidecar binary, and implement daemon supervisor and JSON-RPC client.
- **decided:** stream rclone stderr to dynamic port parser and local log file, poll /rc/noop for readiness, manage child process in AppState with graceful shutdown, derive Default on AppState, and cut 25 lines of duplicate constructor/port logic via ponytail review.
- **shipped:** src-tauri/src/engine/ (daemon.rs, client.rs, models.rs), bundled aarch64 binary in externalBin, added useDaemonStore, AccountCard, StoragePoolBar, verified 4/4 cargo tests and 4/4 frontend tests.

### [2026-10-13] Establish Design System via Impeccable (PRODUCT.md & DESIGN.md)
- **asked:** run /impeccable init and document to establish project truth and formal design system.
- **decided:** anchor aesthetic on "The Obsidian Vault" North Star; codify Ultra-Flat planar depth with The Zero-Shadow Rule, Earthen Obsidian palette, and Tabular Number formatting.
- **shipped:** PRODUCT.md, DESIGN.md (with normative YAML frontmatter tokens), and .impeccable/design.json sidecar with drop-in component snippets and tonal ramps.

### [2026-10-13] Implement Shaped Desktop Vault UI & Impeccable Craft Sweep
- **asked:** shape and implement the complete desktop vault interface according to DESIGN.md and Milestone 2 prerequisites.
- **decided:** dual-view toggle ("Offload & Capacity" vs "Vault Files"), modular components strictly under 150 lines, Zero-Shadow planar depth with 1px ghost borders, tabular numbers on all metrics, and 100% craft floor pass rate via impeccable detect.

### [2026-10-13] Offload Workspace Impeccable Critique & Refinement Pass
- **asked:** critique Offload Workspace (color overload, generic icons, ReclaimBanner layout collapse), then execute refinements one at a time.
- **decided:** adopt Quiet Obsidian earthen palette, enforce Semantic Signal Rule (reserve emerald for safety, cyan for capacity), replace generic icons with custom Google Drive/OneDrive SVG glyphs and Vault mark, eliminate CLI jargon, refactor ReclaimBanner responsive layout with mobile button stacking, and add 5-second Undo space recovery toast.
- **shipped:** src/components/offloader/ (ReclaimBanner.tsx, OffloadWorkspace.tsx, DropzoneCard.tsx, TransferQueue.tsx), ProviderIcons.tsx, updated AccountCard.tsx, OnboardingPrompt.tsx, StoragePoolBar.tsx, App.tsx; verified via pnpm tsc, pnpm test (8/8), cargo test (4/4), and 0 detector issues.

### [2026-10-13] Multi-Theme Architecture & Semantic CSS Tokens
- **asked:** de-hardcode colors like bg-green-600/bg-sky-500 into App.css tokens and add a theme switcher feature with 3 pre-made themes.
- **decided:** implement 3 pre-made themes (Obsidian, Titanium, Bronze) using Tailwind v4 @theme inline tokens (--vault-accent, --vault-accent-hover, --vault-accent-muted, --vault-accent-border, --vault-accent-text); unify all visual accents to eliminate clashing blue/green combinations; persist active theme to localStorage and html[data-theme]; keep all components under 150 lines and zero detector violations.
- **shipped:** src/App.css, src/store/useThemeStore.ts, src/components/common/ThemeSelector.tsx, updated App.tsx, StoragePoolBar.tsx, TransferQueue.tsx, ReclaimBanner.tsx, OffloadWorkspace.tsx, AccountCard.tsx, OnboardingPrompt.tsx, VaultBrowserTable.tsx, DESIGN.md; verified via 11 vitest tests, 4 cargo tests, pnpm build, and 0 detector findings.

### [2026-10-13] Ponytail Review Cleanup (Net -39 Lines)
- **asked:** review diff for over-engineering and apply simplifications.
- **decided:** remove duplicate obsidian CSS selector block and redundant .dark qualifiers in App.css, prune unused description property in ThemeConfig, eliminate redundant useEffect in App.tsx, inline single-caller handleSelect in ThemeSelector.tsx, and shrink getInitialTheme validation to 1 line.
- **shipped:** net -39 lines across src/App.css, src/App.tsx, src/components/common/ThemeSelector.tsx, and src/store/useThemeStore.ts; verified 11/11 vitest, 4/4 cargo test, pnpm build, and 0 detector findings.

### [2026-10-13] Establish shadcn Component Adoption & MCP Registry Rule
- **asked:** create a new rule requiring agents to always use shadcn components, check the local ui folder first, search the shadcn MCP registry and install missing components, and only create custom components when unavailable in shadcn.
- **decided:** establish .agents/rules/component-shadcn.md with a strict 4-step decision gate (local check -> MCP registry query -> CLI install -> custom fallback), linked across frontend.md, component-pattern.md, BRAIN.md, and AGENTS.md.
- **shipped:** .agents/rules/component-shadcn.md, updated frontend.md, component-pattern.md, BRAIN.md, and AGENTS.md.

### [2026-10-13] Codify shadcn Default Styling & SVG Icon Sizing Rules
- **asked:** add rules forbidding modifications to default shadcn styling/design and enforcing SVG icon sizing rules (omit dimensions in auto-sized shadcn components, use size-<n> over w-/h- in Card/wrappers).
- **decided:** add Section 4 (Preserving Default Styles) and Section 5 (SVG Icon Rules) to component-shadcn.md; update code-styling-tailwind.md rules and snippets to enforce size-<n> and omit redundant child icon dimensions.
- **shipped:** updated .agents/rules/component-shadcn.md and .agents/rules/code-styling-tailwind.md; verified typecheck and vitest suite pass.

### [2026-10-13] Milestone 2: OAuth & Cloud Union Management
- **asked:** implement Milestone 2 connecting Google Drive and OneDrive via Rclone loopback JSON-RPC, automated virtual union pool (baulr_vault), live quota telemetry, and account management commands.
- **decided:** use Rclone loopback OAuth listener (127.0.0.1:53682) with 180s client timeout and cancel_oauth stop endpoint; dynamically rebuild baulr_vault with mfs policy on account changes; calculate live telemetry from /operations/about and /config/dump; compose OAuthModal and AccountCard with shadcn Button, Badge, and AlertDialog under 150 lines.
### [2026-10-13] Ponytail Review Cleanup (Net -38 Lines)
- **asked:** review diff across commits 829eb06, d3c3f5b, 09e5edd for over-engineering and apply simplifications.
- **decided:** replace 15-line KnownProvider struct with tuple slice, inline client state unwrapping, borrow in cancel_oauth, use inline HashMap::from, remove redundant wildcard re-exports in commands/mod.rs, prune dead clearError store action, adopt size- utilities and omit manual icon dimensions in AccountCard.
- **shipped:** net -38 lines across src-tauri/src/commands/ (accounts.rs, vault.rs, mod.rs), src/components/accounts/ (AccountCard.tsx, OAuthModal.tsx), src/store/useVaultStore.ts, and src/test/stores.test.ts; verified 14/14 cargo tests, 19/19 vitest tests, and pnpm build.

### [2026-10-13] Frontend Component Rules Harmonization & Refactoring
- **asked:** refactor existing components and App.tsx to adhere strictly to the newly added component, shadcn, tailwind styling, and UI copy rules.
- **decided:** install shadcn input and table via CLI; replace custom dropdown with DropdownMenu, custom tabs with Tabs, custom progress with Progress, custom modal/banner with AlertDialog/Card/Button; enforce size- icon utility rules and 150-line file limit across all components.
- **shipped:** refactored App.tsx and all 11 component files under src/components/, added AppHeader to keep all files under 150 lines; verified via pnpm tsc, 19 vitest tests, 14 cargo tests, and pnpm build.

### [2026-10-13] Ponytail Review Cleanup (Net -180 Lines)
- **asked:** review diff for over-engineering and apply simplifications.
- **decided:** inline handleSync in App.tsx, unify daemon status Badge in AppHeader.tsx, map over provider options in OnboardingPrompt.tsx, inline AlertDialog in OffloadWorkspace.tsx and TableRow in VaultBrowserTable.tsx (deleting ReclaimConfirmModal.tsx and VaultFileRow.tsx), and simplify ProviderIcons.tsx to compact 24x24 vector paths.
- **shipped:** net -180 lines across App.tsx, AppHeader.tsx, OnboardingPrompt.tsx, OffloadWorkspace.tsx, VaultBrowserTable.tsx, and ProviderIcons.tsx; verified via 19 vitest tests, 14 cargo tests, and pnpm build.

### [2026-10-13] Fix ThemeSelector Dropdown Blackout & Onboarding Title Width
- **asked:** fix theme dropdown causing black screen when clicked, and relieve tight width on "Initialize your cloud vault" card title.
- **decided:** replace `@base-ui/react` `MenuPrimitive.GroupLabel` in `DropdownMenuLabel` with a standard styled `div` (eliminating the unhandled `MenuGroupContext is missing` error); relax `max-w-md` to `w-full max-w-xl` on `OnboardingPrompt` header.
- **shipped:** fixed `src/components/ui/dropdown-menu.tsx`, updated `src/components/accounts/OnboardingPrompt.tsx`, added `src/test/theme.test.tsx`; verified 20/20 vitest tests, 14/14 cargo tests, and production build.

### [2026-10-13] Dynamic Theme Palette & Tabler Icons Migration
- **asked:** eliminate hardcoded colors across components, make App.css and shadcn Card/surface colors dynamic per theme, replace Lucide React with Tabler Icons, and uninstall lucide-react.
- **decided:** replace hardcoded olive OKLCH tones in App.css with `--theme-hue` variable driven by `data-theme` (obsidian=149.2, titanium=230, bronze=65); replace all hardcoded `neutral-*` classes across components with semantic tokens (`bg-card`, `bg-muted`, `border-border`, `text-foreground`, `text-muted-foreground`); replace all Lucide icons with `@tabler/icons-react`; uninstall `lucide-react`.
- **shipped:** updated `src/App.css`, `src/App.tsx`, and all 7 component files; uninstalled `lucide-react`; updated `.agents/rules/frontend.md`; verified 20/20 vitest tests, 14/14 cargo tests, and production build.

### [2026-10-13] Ponytail Review Cleanup (Net -25 Lines)
- **asked:** review diff for over-engineering and apply simplifications.
- **decided:** eliminate redundant obsidian `:root` override block in `src/App.css`, inline `--theme-hue` directly into `[data-theme]` blocks, use nullish coalescing in `ThemeSelector.tsx`, and compact toast markup in `OffloadWorkspace.tsx`.
- **shipped:** net -25 lines across `src/App.css`, `src/components/common/ThemeSelector.tsx`, and `src/components/offloader/OffloadWorkspace.tsx`; verified via 20/20 vitest tests, 14/14 cargo tests, and production build.

### [2026-10-14] Update App Logo to Baulr SVG
- **asked:** change app logo to `public/baulr.svg`.
- **decided:** render `baulr.svg` directly inside `AppHeader` brand badge and update browser favicon in `index.html`.
- **shipped:** updated `src/components/common/AppHeader.tsx` and `index.html`; verified via 20/20 vitest tests, 14/14 cargo tests, and production build.

### [2026-10-14] Update Tauri Desktop Application Icon
- **asked:** use `dist/baulr.png` for Tauri application icon.
- **decided:** preserve source icon at `app-icon.png` and `public/baulr.png`; regenerate complete desktop icon bundle (`icon.icns`, `icon.ico`, `32x32.png`, `128x128.png`, `128x128@2x.png`, `StoreLogo.png`, `Square*.png`) via `tauri icon`.
- **shipped:** updated `src-tauri/icons/` desktop icons and added `app-icon.png` / `public/baulr.png`; verified via vitest, cargo test, and production build.

### [2026-10-14] Ponytail Review Cleanup (Net -89 Lines)
- **asked:** review diff across Milestone 3 offload pipeline commits for over-engineering and apply simplifications.
- **decided:** prune unused speculative `TransferringFile` struct and deserialization test; extract `JobIdResponse` in `RcloneClient` for `start_copy`/`start_copy_file`; eliminate redundant `p.exists()` filesystem stat in `inspect_path`; unify terminal progress emission in `start_offload`; compact `pick_offload_folder` with `let Some(...) else`; remove unused public re-exports in `lib.rs`.
- **shipped:** net -89 lines across `src-tauri/src/engine/` (`client.rs`, `models.rs`, `mod.rs`), `src-tauri/src/commands/offload.rs`, `src-tauri/src/lib.rs`, and `src/lib/bindings.ts`; verified via 25/25 vitest tests, 19/19 cargo tests, and production build.

### [2026-10-14] Milestone 3: Real Offload Engine & Vault Sync Pipeline
- **asked:** implement Milestone 3 (real offload execution, capacity gate, live telemetry, and native folder selection).
- **decided:** wire Tauri backend to Rclone async transfer RPC (`sync/copy`, `operations/copyfile`); enforce zero-loss capacity gate (`file_size <= remaining_vault_space`); stream live telemetry events (`vault://offload-progress`) via Tauri event bus; integrate `tauri-plugin-dialog` for native OS folder picker; connect Zustand `useTransferStore` and React UI components.
- **shipped:** `src-tauri/src/commands/offload.rs`, `src/lib/api/offload.ts`, updated `DropzoneCard.tsx`, `TransferQueue.tsx`, `OffloadWorkspace.tsx`, and `useTransferStore.ts`; added 10 unit/component tests in `stores.test.ts`, `offload-api.test.ts`, and `offloader.test.tsx`; verified via 30/30 vitest tests, 19/19 cargo tests, and production build.

### [2026-10-14] Milestone 3: Drag-Drop, High-Throughput Buffers, Provider Indicator & Safe Space Reclamation
- **asked:** fix drag-and-drop not registering dropped folders, slow 16MB upload speeds, missing cloud provider destination indicator in UI, and "free up space" button not moving local files to Trash.
- **decided:** wire Tauri native webview drop listener (`getCurrentWebview().onDragDropEvent`) to bypass WebKit browser path scrubbing; boost Rclone daemon throughput flags (`--drive-chunk-size 32M`, `--onedrive-chunk-size 32000k`, `--buffer-size 32M`, `--transfers 4`, `--checkers 8`); calculate `target_provider` via union mfs policy and expose in telemetry and UI badges; implement non-destructive `reclaim_paths` command using `trash` crate moving files directly to OS Trash.
- **shipped:** `src-tauri/src/commands/offload.rs`, `src-tauri/src/engine/daemon.rs`, `src-tauri/src/lib.rs`, `src/components/offloader/DropzoneCard.tsx`, `src/components/offloader/TransferQueue.tsx`, `src/components/offloader/OffloadWorkspace.tsx`, and updated test suites; verified via 32 vitest tests, 20 cargo tests, and production build.

### [2026-10-14] Ponytail Review Cleanup (Net -3 Lines)
- **asked:** review diff for over-engineering and apply simplifications.
- **decided:** simplify drag-and-drop path check with `paths?.[0]` in `DropzoneCard.tsx` and collapse two-step filter and map with `flatMap` in `OffloadWorkspace.tsx`.
- **shipped:** net -3 lines across `src/components/offloader/DropzoneCard.tsx` and `src/components/offloader/OffloadWorkspace.tsx`; verified via 32 vitest tests, 20 cargo tests, and production build.

### [2026-10-14] Rclone Upload Speed Optimization & Process Supervision
- **asked:** investigate and fix 20 KB/s upload speed during folder offload.
- **decided:** terminate 25 orphan rclone background daemons causing Google Drive rate-limit throttling; hook `tauri::RunEvent::Exit` in `src-tauri/src/lib.rs` to terminate sidecar on app quit; tune Rclone daemon flags (`--drive-pacer-min-sleep 10ms`, `--drive-pacer-burst 200`, `--transfers 8`, `--checkers 16`, `--fast-list`).
- **shipped:** updated `src-tauri/src/engine/daemon.rs` and `src-tauri/src/lib.rs`; killed orphan processes; verified 32 vitest tests, 20 cargo tests, and production build.

### [2026-10-14] Eliminate Pre-Upload Startup Lag & Progressive Ingestion
- **asked:** eliminate multi-second dead time before folder offload progress triggers.
- **decided:** bypass Rclone remote directory tree scan via `--no-traverse` and `--order-by size,ascending`; run cloud quota checks concurrently via `tokio::join!`; cache quota in `AppState` for instantaneous 0ms capacity checks; add optimistic `"preparing"` queue state in `useTransferStore` for sub-50ms instant UI feedback.
- **shipped:** updated `src-tauri/src/engine/daemon.rs`, `src-tauri/src/commands/vault.rs`, `src-tauri/src/commands/offload.rs`, `src/store/useTransferStore.ts`, `src/components/offloader/TransferQueue.tsx`, and test suites; verified via 34 vitest tests, 20 cargo tests, and production build.

### [2026-10-15] Single-Provider Alias Support & Benchmark Validation
- **asked:** benchmark folder offload speed via Rclone CLI on 16MB test folder and investigate remaining startup delay.
- **decided:** handle single connected cloud account by creating an `alias` remote instead of an invalid single-upstream `union` remote; benchmark 15.3MB folder (13 files) via CLI matching 13.7s; add `test-files/` to `.gitignore`.
- **shipped:** `src-tauri/src/engine/union.rs`, `.gitignore`, updated `docs/PROJECT_LOGS.md`; verified via 20/20 cargo tests, 34/34 vitest tests, and production build.

### [2026-10-15] Ponytail Review Cleanup (Net -120 Lines)
- **asked:** prune dead prototype methods, dead commands, redundant daemon store, and starter boilerplate without touching shadcn components.
- **decided:** remove dead `enqueueTransfer`, `updateItemProgress`, `markItemVerified` in `useTransferStore.ts`; delete unused `get_core_stats` and `fetchCoreStats`; merge `useDaemonStore` into `useVaultStore`; delete `types.ts`, starter SVGs (`react.svg`, `vite.svg`, `tauri.svg`); move `shadcn` to `devDependencies`.
- **shipped:** net -120 lines across 13 files; verified 20/20 cargo tests, 0 clippy warnings, 32/32 vitest tests, and production build.

### [2026-10-15] Update Tauri Desktop Icons from Updated Public Assets
- **asked:** update Tauri application icons in `src-tauri/icons` to match newly updated SVG and PNG in `public/`.
- **decided:** regenerate the full desktop Tauri icon suite (`icon.icns`, `icon.ico`, `icon.png`, `Square*`, `StoreLogo`, `32x32`, `128x128`, `128x128@2x`) from `public/baulr.png` via `tauri icon` and sync root `app-icon.png`.
- **shipped:** regenerated all desktop icons in `src-tauri/icons/` and synchronized `app-icon.png`; verified via 32 vitest tests, 20 cargo tests, and production build.

### [2026-10-15] Milestone 4: Live Cloud Vault Browser, File Retrieval & Verification Gate
- **asked:** implement Milestone 4 (live cloud vault file browsing, item deletion with confirmation, file/folder download to native OS picker destination, and post-offload hash verification gate).
- **decided:** add Rclone RPC operations (`operations/list`, `operations/deletefile`, `operations/purge`, `operations/check`); expose Tauri commands via Specta (`list_vault_files`, `delete_vault_item`, `download_vault_item`, `pick_destination_folder`); run automated hash verification gate before offload completion; modularize UI into `VaultBrowserTable.tsx`, `VaultItemRow.tsx`, and `DeleteVaultItemDialog.tsx` strictly under 150 lines with clean outcome-focused copy.
- **shipped:** `src-tauri/src/commands/browser.rs`, updated `models.rs`, `client.rs`, `offload.rs`, `lib.rs`, `src/lib/api/browser.ts`, `useRemoteFilesStore.ts`, `VaultBrowserTable.tsx`, `VaultItemRow.tsx`, `DeleteVaultItemDialog.tsx`, 6 new store tests, 5 new component tests, and 4 new backend tests; verified via 24/24 cargo tests, 0 clippy warnings, 43/43 vitest tests, and production build.

### [2026-10-15] Live Download Progress Telemetry & In-Row Feedback
- **asked:** show download progress and confirmation feedback when downloading files/folders so user knows download started and tracks completion.
- **decided:** emit `vault://download-progress` events from background telemetry loop in `download_vault_item`; render live progress percentage and saved state directly on `VaultItemRow.tsx`; show an active `DownloadBanner.tsx` with speed, ETA, destination, and completion badge; keep components strictly under 150 lines.
- **shipped:** updated `src-tauri/src/commands/browser.rs`, `src/lib/api/browser.ts`, `src/store/useRemoteFilesStore.ts`, `src/components/browser/DownloadBanner.tsx`, `src/components/browser/VaultItemRow.tsx`, `src/components/browser/VaultBrowserTable.tsx`, added 2 new tests in `browser-store.test.ts` and `browser-table.test.tsx`; verified via 45/45 vitest tests, 0 clippy warnings, and production build.

### [2026-10-15] Repeated Downloads & Destination Collision Renaming
- **asked:** allow downloading the same folder or file multiple times to the same destination without silent 0-byte syncs or locked UI buttons.
- **decided:** implement `resolve_unique_destination_name` in `browser.rs` to auto-disambiguate existing files and folders (`photos (1)`, `photos (2)`); keep download action button accessible in `VaultItemRow.tsx` whenever item is not actively downloading.
- **shipped:** updated `src-tauri/src/commands/browser.rs`, `VaultItemRow.tsx`, added collision resolution unit tests and re-download UI test; verified via 46/46 vitest tests, 0 clippy warnings, and production build.

### [2026-10-15] Ponytail Review Simplification (-31 Lines)
- **asked:** prune dead prototype methods and redundant mock tests identified during ponytail-review.
- **decided:** delete dead `deleteToCloudTrash` action and implementation from `useRemoteFilesStore.ts`; delete obsolete mock test block from `stores.test.ts` (covered by `browser-store.test.ts`).
- **shipped:** net -31 lines across `useRemoteFilesStore.ts` and `stores.test.ts`; verified 45/45 vitest tests, 0 clippy warnings, and production build.

### [2026-10-15] Milestone 5: Cross-Platform Desktop Packaging & Sidecar Hardening
- **asked:** implement Milestone 5 (standalone packaging, robust sidecar binary discovery, desktop window constraints, and automated release CI).
- **decided:** resolve bundled `rclone` relative to `current_exe()` (`Contents/MacOS/rclone` on macOS, adjacent directory on Windows); add Windows `CREATE_NO_WINDOW` process flags; set desktop window bounds to 840x620 (min 720x520); configure `.github/workflows/release.yml` matrix build.
- **shipped:** updated `src-tauri/src/engine/daemon.rs`, `src-tauri/tauri.conf.json`, `docs/ROADMAP.md`, created `.github/workflows/release.yml`, built standalone `Baulr.app` and `Baulr_0.1.0_aarch64.dmg` (32.7 MB); verified 45/45 vitest tests, 4/4 daemon tests, and clean binary launch.

### [2026-10-15] Minimal Standalone Download Landing Page
- **asked:** create a temporary minimal landing page within this repo with direct links to download the application.
- **decided:** build a self-contained, zero-dependency static page in `landing/index.html` referencing GitHub Releases and `.dmg` downloads; bundle logo assets; keep in repo to minimize overhead ahead of dedicated marketing site.
- **shipped:** created `landing/index.html`, copied `baulr.svg` and `baulr.png` into `landing/`, and verified clean browser render.

### [2026-10-16] Fix CI Build Release Action Lockfile & Sidecar Pipeline
- **asked:** fix GitHub Actions build-release workflow failure on macOS and Windows caused by lockfile dependency mismatch.
- **decided:** update `pnpm-lock.yaml` to sync `shadcn` in devDependencies; add explicit `permissions: contents: write` and cross-platform Rclone sidecar binary preparation steps in `.github/workflows/release.yml`.
- **shipped:** updated `pnpm-lock.yaml` and `.github/workflows/release.yml`; verified via `pnpm install --frozen-lockfile`, 45/45 vitest tests, `pnpm build`, and 27/27 cargo tests.

### [2026-10-16] Phase 1: Connection Sync, OneDrive Auto-Config & Vault Purge
- **asked:** resolve Phase 1 post-MVP issues: OneDrive upload failure, manual sync lag after connect/disconnect, and lingering vault files.
- **decided:** auto-configure OneDrive with `drive_type = "personal"` and Graph API drive resolution; make cache synchronization reactive; gracefully clear vault items on disconnect.
- **shipped:** updated `accounts.rs`, `vault.rs`, `union.rs`, `VaultFilesTab.tsx`, `useVaultStore.ts`; verified 27/27 cargo tests, 47/47 vitest tests, and ponytail review.

### [2026-10-16] Multi-Cloud Quota Stabilization, 45s Timeout & BaulrVault File Sync
- **asked:** fix multi-cloud connect timeout, Google Drive "Re-authenticate" false alert, 5 GB quota undercounting, and load files inside Google Drive `BaulrVault`.
- **decided:** increase Rclone HTTP client timeout from 5s to 45s; preserve connected state and quota cache during transient API latency; delete existing `baulr_vault` remote before recreating union remote; maintain `VAULT_SUBDIR = "BaulrVault"` sandbox for safety and speed; add Alert with retry CTA to `VaultBrowserTable.tsx`.
- **shipped:** updated `src-tauri/src/engine/client.rs`, `src-tauri/src/engine/union.rs`, `src-tauri/src/commands/vault.rs`, `src-tauri/src/commands/accounts.rs`, `src-tauri/src/commands/offload.rs`, `src/components/browser/VaultBrowserTable.tsx`, and added unit tests in `vault.rs` and `browser-table.test.tsx`; verified 28/28 cargo tests, 48/48 vitest tests, 0 clippy warnings, and clean `pnpm build`.

### [2026-10-16] Phase 2: Multi-Item Drag-and-Drop & Sequential Queue Resilience
- **asked:** resolve Phase 2 post-MVP issues: enable dropping multiple files/folders at once (`ISSUE-06`) and allow dismissing failed or queued items so other offloads continue (`ISSUE-07`).
- **decided:** upgrade `DropzoneCard` to extract all paths from Tauri drag-drop payload and browser fallback; implement autonomous sequential queue runner (`processNext`) in `useTransferStore`; add `<IconX />` dismiss action on errored items and remove action on queued items; split `TransferQueueItem` into dedicated modular component (<120 lines).
- **shipped:** updated `DropzoneCard.tsx`, `OffloadWorkspace.tsx`, `TransferQueue.tsx`, `useTransferStore.ts`, created `TransferQueueItem.tsx`, updated `docs/POST_MVP_ISSUES.md`, and added comprehensive unit tests in `offloader.test.tsx` and `stores.test.ts`; verified 51/51 vitest tests, 28/28 cargo tests, and clean production build.

### [2026-10-16] Ponytail Review Simplification (-59 Lines)
- **asked:** prune over-engineering in Phase 2 queue and offload components.
- **decided:** shrink manual file path extraction loop in `DropzoneCard.tsx`; unify `onCancel` and `onDismiss` into single `onDismiss` callback in `TransferQueue` & `TransferQueueItem`; shrink redundant `startOffload` in `useTransferStore.ts` to delegate to `enqueuePaths`.
- **shipped:** net -59 lines across `DropzoneCard.tsx`, `OffloadWorkspace.tsx`, `TransferQueue.tsx`, `TransferQueueItem.tsx`, `useTransferStore.ts`, and `offloader.test.tsx`; verified 51/51 vitest tests, 28/28 cargo tests, and production build.

### [2026-10-16] Phase 3: Upload Cloud Provider Selector & Collision Auto-Disambiguation
- **asked:** resolve Phase 3 post-MVP issues: upload cloud provider selector (`ISSUE-01`), duplicate folder name conflict resolution (`ISSUE-05`), and duplicate file name conflict resolution (`ISSUE-08`).
- **decided:** add `target_provider: Option<String>` to `start_offload` supporting manual cloud destination selection alongside "Let Baulr decide (Auto)"; implement pre-flight cloud duplicate inspection and numerical suffix auto-disambiguation (`resolve_unique_cloud_name`); add custom single-file hash verification on rename (`check_single_file_hash`); add compact destination dropdown inside `DropzoneCard.tsx`; modularize webview drop listener into `useWebviewDrop.ts` and reclaim confirmation into `ReclaimConfirmDialog.tsx` keeping all components under 150 lines.
- **shipped:** updated `src-tauri/src/commands/offload.rs`, `src-tauri/src/engine/client.rs`, `src/lib/bindings.ts`, `src/lib/api/offload.ts`, `src/store/useTransferStore.ts`, `src/components/offloader/DropzoneCard.tsx`, `src/components/offloader/OffloadWorkspace.tsx`, created `src/components/offloader/useWebviewDrop.ts` and `src/components/offloader/ReclaimConfirmDialog.tsx`, updated `docs/POST_MVP_ISSUES.md`, and added comprehensive unit tests across backend and frontend; verified 31/31 cargo tests, 54/54 vitest tests, and clean production build.

### [2026-10-16] Ponytail Review Simplification (-14 Lines)
- **asked:** prune unnecessary complexity in Phase 3 upload routing and collision handling.
- **decided:** eliminate unreachable fallback path reconstruction in `offload.rs` telemetry loop; replace manual mutable counter loop in `resolve_unique_cloud_name` with standard iterator pipeline; remove redundant `useEffect` for mutable ref syncing in `useWebviewDrop.ts`.
- **shipped:** net -14 lines across `src-tauri/src/commands/offload.rs` and `src/components/offloader/useWebviewDrop.ts`; verified 31/31 cargo tests, 54/54 vitest tests, and production build.

### [2026-10-16] Milestone 6: LAN Wi-Fi QR Mobile Upload (REQ-07)
- **asked:** implement Milestone 6: allow users to offload photos and videos from mobile phones directly to Baulr over local Wi-Fi without installing a mobile app.
- **decided:** build an embedded local network Axum HTTP streaming receiver on dynamic port with pairing token authentication; generate crisp vector QR code in Rust (`qrcode`); serve a responsive dark-mode mobile web uploader page; stream multipart chunks directly to disk staging to prevent OOM on large 4K video uploads; emit `mobile://file-received` to automatically enqueue files into `useTransferStore`; modularize UI into `MobileUploadModal.tsx`, `MobileReceivedList.tsx`, `DestinationCloudDropdown.tsx`, and `useMobileReceiver.ts` keeping all components strictly under 150 lines.
- **shipped:** created `src-tauri/src/mobile/`, `src-tauri/src/commands/mobile.rs`, `src/lib/api/mobile.ts`, `src/components/offloader/useMobileReceiver.ts`, `src/components/offloader/MobileUploadModal.tsx`, `src/components/offloader/MobileReceivedList.tsx`, `src/components/offloader/DestinationCloudDropdown.tsx`, `src/components/offloader/ReclaimSuccessToast.tsx`, updated `DropzoneCard.tsx`, `OffloadWorkspace.tsx`, `lib.rs`, `Cargo.toml`, and added unit tests in `mobile-api.test.ts` and `mobile-receiver.test.tsx`; verified 33/33 cargo tests, 61/61 vitest tests, and clean production build.

### [2026-10-16] Ponytail Review Simplification (-81 Lines)
- **asked:** prune speculative abstractions, redundant code, and verbose DOM constructions in Milestone 6.
- **decided:** delete unused `get_mobile_receiver_status` command and `MobileReceiverStatus` struct; streamline `get_local_ip` with stdlib combinators; replace 27 lines of imperative DOM construction in mobile uploader with template literal; collapse badge state switch into static lookup table; deduplicate `useMobileReceiver` cleanup hook.
- **shipped:** net -81 lines across `src-tauri/src/commands/mobile.rs`, `src-tauri/src/mobile/server.rs`, `src-tauri/src/mobile/html.rs`, `src/lib/api/mobile.ts`, `src/components/offloader/useMobileReceiver.ts`, and `src/components/offloader/MobileUploadModal.tsx`; verified 33/33 cargo tests, 60/60 vitest tests, and clean production build.

### [2026-10-17] Mobile Upload Multi-File & Video Resilience
- **asked:** resolve connection errors and dropped transfers when uploading batches of mixed photos and large videos from mobile devices.
- **decided:** disable Axum's default 2MB request body limit on the receiver (`DefaultBodyLimit::disable()`); replace concurrent request flooding in the mobile web uploader with an autonomous sequential queue; integrate Screen Wake Lock API (`navigator.wakeLock`) to prevent mobile OS sleep during multi-gigabyte video transfers; implement zero-loss staging filename auto-disambiguation (`resolve_unique_staging_name`); add inline retry button on interrupted files; restore activeLabel fallback in `DestinationCloudDropdown.tsx`.
- **shipped:** updated `src-tauri/src/mobile/server.rs`, `src-tauri/src/mobile/html.rs`, `src/components/offloader/DestinationCloudDropdown.tsx`, updated `walkthrough.md`, and added unit tests in `src-tauri/src/mobile/server.rs`; verified 36/36 cargo tests, 60/60 vitest tests, and clean production build.

### [2026-10-17] Background Mobile Connection & Disconnect Confirmation Dialog
- **asked:** prevent closing the QR code dialog from unintentionally closing the active phone connection; add a "Close Connection" action with confirmation alert dialog.
- **decided:** separate modal visibility (`Done`) from receiver lifecycle; keep receiver active in the background when modal is closed so uploads continue; add dedicated "Close Connection" button with an `AlertDialog` confirmation (`DisconnectMobileDialog.tsx`) that warns user before disconnecting; maintain components strictly under 150 lines.
- **shipped:** created `src/components/offloader/DisconnectMobileDialog.tsx`, updated `MobileUploadModal.tsx`, `useMobileReceiver.ts`, `mobile-receiver.test.tsx`, and `walkthrough.md`; verified 36/36 cargo tests, 61/61 vitest tests, and clean production build.

### [2026-10-17] Impeccable UI & Layout Polish for Mobile Web & QR Modal
- **asked:** polish mobile web uploader UI and desktop QR code modal layout using shadcn components and Baulr's Obsidian Vault design language.
- **decided:** upgrade mobile uploader (`html.rs`) with Apple/Android native ergonomics, Obsidian Vault design tokens, batch telemetry progress bar, and media-type SVG icons (photo, video, doc); extract `MobileQrViewfinder.tsx` to provide a framed viewfinder QR code presentation while keeping `MobileUploadModal.tsx` strictly under 150 lines (133 lines); enhance `MobileReceivedList.tsx` with media-type icons and parent-driven Tailwind selectors; ensure zero mechanical detector violations.
- **shipped:** created `src/components/offloader/MobileQrViewfinder.tsx`, updated `src/components/offloader/MobileUploadModal.tsx`, `src/components/offloader/MobileReceivedList.tsx`, and `src-tauri/src/mobile/html.rs`; verified 36/36 cargo tests, 61/61 vitest tests, and clean production build.

### [2026-10-17] Revert Upload Modal Layout to Single-Column Format
- **asked:** revert the desktop upload modal layout back to the single-column centered format.
- **decided:** revert `MobileUploadModal.tsx` from the 2-column grid (`grid-cols-2`) back to a focused, single-column vertical stack (`max-w-sm sm:max-w-md`); utilize adaptive `compact` QR sizing (`size-32` vs `size-44`) to maintain ergonomic dialog height while files are transferring; preserve continuous scrolling in the mobile uploader; keep component at 140 lines.
- **shipped:** updated `src/components/offloader/MobileUploadModal.tsx`; verified 61/61 vitest tests, 5/5 Rust mobile tests, and clean production build.

### [2026-10-17] Milestone 7: Bandwidth Throttler (REQ-09)
- **asked:** implement user-configurable upload bandwidth rate limiting to prevent cloud offloads from saturating home internet connections.
- **decided:** integrate with Rclone runtime `core/bwlimit` JSON-RPC; implement upload-focused rate syntax (`<rate>:off` / `"off"` for Unlimited); build `BandwidthMenu.tsx` dropdown in desktop header with presets (Unlimited, 25, 10, 5, 2 MB/s) and custom MB/s input; persist user preference in `localStorage` under `baulr:bandwidth_limit` and re-apply on daemon startup; keep components under 150 lines.
- **shipped:** created `src/components/common/BandwidthMenu.tsx`, `src/lib/api/bandwidth.ts`, `src/store/useBandwidthStore.ts`, and `src-tauri/src/commands/bandwidth.rs`; updated `AppHeader.tsx`, `App.tsx`, and `src-tauri/src/engine/`; added unit tests across Rust and Vitest; verified 76/76 vitest tests passing and clean production build.

### [2026-10-17] Fix DropdownMenu Typeahead Intercepting Custom Input in BandwidthMenu
- **asked:** fix issue where typing in the custom speed input field steals focus and jumps to fixed presets.
- **decided:** stop event propagation (`stopPropagation()`) on `onKeyDown` and `onKeyUp` inside the `<form>` and `<Input>` to prevent `@base-ui/react/menu` from intercepting keystrokes with its typeahead search; control dropdown `open` state to cleanly close after preset click or custom submit; maintain component at 126 lines.
- **shipped:** updated `BandwidthMenu.tsx`, added unit test in `bandwidth-menu.test.tsx`, verified 77/77 tests passing and clean production build.

### [2026-10-17] Dedicated Settings Page & App Header Decluttering
- **asked:** declutter the busy app header (speed limit, theme changer, sync button, badge) and create a dedicated settings page to house theme and bandwidth limits with room for future preferences.
- **decided:** declutter `AppHeader.tsx` down to 3 controls (Sync, Status Badge, Settings button); move Theme and Bandwidth Limiter into a dedicated `SettingsPage.tsx` with modular cards (`AppearanceSettingsCard.tsx`, `NetworkSettingsCard.tsx`, `AboutSettingsCard.tsx`); add `"settings"` view to `useViewStore.ts` with seamless `previousView` back-navigation; ensure all components remain strictly under 150 lines and 0 mechanical design violations.
- **shipped:** created `src/components/settings/SettingsPage.tsx`, `AppearanceSettingsCard.tsx`, `NetworkSettingsCard.tsx`, `AboutSettingsCard.tsx`, and `src/test/settings.test.tsx`; updated `AppHeader.tsx`, `App.tsx`, and `useViewStore.ts`; verified 83/83 vitest tests passing, 0 detector violations, and clean production build.

### [2026-10-17] Share Link Generation for Vault Files (REQ-10)
- **asked:** implement share link generation for any file or folder stored in the pooled cloud vault directly from the desktop Vault Files table.
- **decided:** leverage Rclone's `operations/publiclink` JSON-RPC method with `baulr_vault:` to delegate link resolution to the underlying provider (Google Drive or OneDrive); expose `get_file_share_link` Tauri command via Specta; build `ShareLinkModal.tsx` with copy-to-clipboard, "Open in browser", and retry states; modularize `VaultBrowserTable.tsx` with `VaultBrowserHeader.tsx` to maintain strict Web-Developer maintainability (< 150 lines per component); enforce zero banned backend jargon and zero mechanical design violations.
- **shipped:** created `src/components/browser/ShareLinkModal.tsx`, `VaultBrowserHeader.tsx`, and test suites `browser-api.test.ts` and `share-link-modal.test.tsx`; updated `src-tauri/src/engine/client.rs`, `src-tauri/src/commands/browser.rs`, `src-tauri/src/lib.rs`, `src/lib/bindings.ts`, `src/lib/api/browser.ts`, `src/components/browser/VaultItemRow.tsx`, `src/components/browser/VaultBrowserTable.tsx`, `src/test/browser-table.test.tsx`, and `docs/ROADMAP.md`; verified 84/84 vitest tests, 0 design detector violations, and clean production build.

### [2026-10-17] Ponytail Review Simplification (-90 Lines)
- **asked:** review diff for over-engineering and apply simplifications.
- **decided:** replace manual 13-line JSON `Value` navigation with `HashMap<String, String>` deserialization in `client.rs`; delete single-caller wrapper `VaultBrowserAlert.tsx` and inline the error `Alert` in `VaultBrowserTable.tsx` while keeping it at 142 lines (< 150); inline `window.open` directly in `ShareLinkModal.tsx`; prune 45 lines of duplicate browser tests in `browser-api.test.ts`.
- **shipped:** net -90 lines across `src-tauri/src/engine/client.rs`, `src/components/browser/ShareLinkModal.tsx`, `src/components/browser/VaultBrowserTable.tsx`, and `src/test/browser-api.test.ts`; deleted `src/components/browser/VaultBrowserAlert.tsx`; verified 84/84 vitest tests, 0 design detector violations, and clean production build.

### [2026-10-17] Fix Union Publiclink by Delegating to Active Upstreams (-17 Lines)
- **asked:** resolve `union root '' doesn't support public links` error when clicking share link in Vault Files table.
- **decided:** Rclone's `union` remote backend does not implement `PublicLinker`. Update `get_file_share_link` in `browser.rs` to dynamically query connected upstreams (e.g. `gdrive:BaulrVault`, `onedrive:BaulrVault`) from `build_union_upstreams(&config)`, calling `client.get_public_link(upstream, &clean_path)` to retrieve its native cloud link; prune speculative double-query fallback and collapse error checks (-17 lines); sanitize error formatting in `client.rs` to avoid exposing raw JSON payloads.
- **shipped:** updated `src-tauri/src/commands/browser.rs` and `src-tauri/src/engine/client.rs`; verified with `cargo check`, `cargo test`, `pnpm test` (84/84), and `cargo build`.

### [2026-10-17] Vault Files Progressive Loading & Share Link Performance Optimizations
- **asked:** optimize slow loading when opening the Vault Files tab and when generating share links; implement progressive loading so the fastest provider renders first, isolate failing providers with localized retry, and add hover prefetching.
- **decided:** parallelize cloud upstreams in Rust backend using `tokio::task::JoinSet` to race public link lookups across all connected remotes simultaneously, aborting remaining tasks on first success; add in-memory share link caching for 0ms repeat clicks; expose `list_provider_vault_files` in Tauri backend; refactor `useRemoteFilesStore.ts` to manage per-provider state (`filesByProvider`, `providerErrors`, `providerLoading`) with progressive streaming merge and stale-while-revalidate; extract `<ProviderSyncAlert />` (< 55 lines) with human-friendly copy complying with `RULE[user_global]`; add intent-driven hover prefetch on `ViewToggle.tsx` with 30s freshness window; keep all components under 150 lines.

### [2026-10-17] Reassuring Cloud Checking States to Prevent Perceived Data Loss
- **asked:** eliminate perceived data loss anxiety when vault files are still loading in the background (preventing the premature "No files found" empty state).
- **decided:** suppress the empty state while any cloud account is actively checking; display reassuring message ("Looking for your vault files", "Checking your connected accounts for saved files...") with an animated spinner; add a live status pill (`Checking OneDrive...`) in `VaultBrowserHeader.tsx`; render an in-table streaming row at the bottom of the table if some files are loaded while other providers are still in flight; extract `<VaultFilesList />` (78 lines) and `<VaultEmptyState />` (48 lines) to maintain strict web-developer maintainability (< 135 lines per component); enforce zero mechanical design violations via `/impeccable detect`.
- **shipped:** updated `VaultBrowserHeader.tsx`, `VaultBrowserTable.tsx`, `ProviderSyncAlert.tsx`; created `VaultEmptyState.tsx` and `VaultFilesList.tsx`; added test cases in `browser-table.test.tsx`; verified 100/100 vitest tests passing, 0 TypeScript errors on `pnpm build`, and 0 defects on `impeccable detect`.

### [2026-10-17] Ponytail Review Simplification (-133 Lines)
- **asked:** review progressive loading, share links, and reassuring UI diff for over-engineering and apply simplifications.
- **decided:** simplify file deduplication in `useRemoteFilesStore.ts` using flattened Map constructor; extract shared `loadProvider(provider: string)` helper in store to eliminate redundant try/catch blocks across `fetchFiles` and `retryProvider`; inline `<Table>` directly into `VaultBrowserTable.tsx` and delete single-caller pass-through component `VaultFilesList.tsx` while keeping `VaultBrowserTable.tsx` strictly under 150 lines (149 lines); deduplicate ternary account formatting by hoisting pre-formatted `checkingTarget` prop to `VaultBrowserHeader` and `VaultEmptyState`; remove redundant dummy test `test_browser_commands_engine_not_running` in `browser.rs`.
- **shipped:** net -133 lines across `src/store/useRemoteFilesStore.ts`, `src/components/browser/VaultBrowserTable.tsx`, `src/components/browser/VaultBrowserHeader.tsx`, `src/components/browser/VaultEmptyState.tsx`, and `src-tauri/src/commands/browser.rs`; deleted `src/components/browser/VaultFilesList.tsx`; verified 100/100 vitest tests, 2/2 cargo browser tests, clean `pnpm build`, and 0 defects on `impeccable detect`.

### [2026-10-17] Version Bump to v0.2.0
- **asked:** bump version to v0.2.0 after merging share link, progressive loading, and milestone features into main.
- **decided:** bump version synchronously across `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`; keep `Cargo.lock` synchronized.
- **shipped:** updated version strings to 0.2.0 in `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and `src-tauri/Cargo.lock`; verified with `pnpm test` (100/100 passing), `pnpm build`, and `cargo check`.

### [2026-10-17] Standardize Release & Versioning Technology Rules
- **asked:** create permanent engineering rule for release versioning standards and Tauri desktop packaging workflow in `.agents/rules/`.
- **decided:** formalize SemVer 2.0 rules, zero-major 0.x.x promotion guidelines, the 3-file version sync invariant (`package.json`, `tauri.conf.json`, `Cargo.toml`), and CI/CD release instructions in `.agents/rules/release-versioning.md`; index in `BRAIN.md`.
- **shipped:** created `.agents/rules/release-versioning.md` and linked in `BRAIN.md`.

### [2026-10-18] Media Preview, Thumbnail Grid & Subdirectory Folder Navigation (REQ-10)
- **asked:** implement media preview and thumbnail grid; include drilling down into folders and breadcrumb navigation; make files clickable in compact table list and open files in a new browser window instead of broken dialog modal.
- **decided:** leverage Rclone's native loopback HTTP server (`serve/start type=http`) on dynamic localhost port (`127.0.0.1:0`) for zero-dependency browser media streaming, native byte ranges, and HTTP disk caching; update `list_vault_files` and `list_provider_vault_files` to accept subdirectories; add `<VaultBreadcrumbs />` with ancestor drill-up; build `<MediaGridView />` with image thumbnails, video overlays, and dual view toggle; open clicked files directly in a new browser window via `@tauri-apps/plugin-opener` / `window.open` (eliminating cramped modal dialog and extra state); enable file clickability in compact `<VaultItemRow />`; keep all components under 150 lines.
- **shipped:** created `src/components/browser/MediaGridView.tsx`, `src/components/browser/VaultBreadcrumbs.tsx`, `src/test/browser-navigation.test.tsx`, updated `src/components/browser/VaultBrowserHeader.tsx`, `src/components/browser/VaultBrowserTable.tsx`, `src/components/browser/VaultItemRow.tsx`, `src-tauri/src/commands/browser.rs`, `src-tauri/src/commands/accounts.rs`, `src-tauri/src/engine/client.rs`, `src-tauri/src/engine/models.rs`, `src-tauri/src/lib.rs`, `src/lib/bindings.ts`, `src/lib/api/browser.ts`, `src/store/useRemoteFilesStore.ts`, `docs/ROADMAP.md`; verified 40/40 cargo tests, 111/111 vitest tests, and clean production build.

### [2026-10-18] Vault Files Tab & Grid View Craft Redesign (/impeccable)
- **asked:** redesign the Vault Files tab: declutter `VaultBrowserHeader` layout, separate the view mode switcher from breadcrumb path navigation to remove visual tightness, and redesign cards in grid view.
- **decided:** split the crowded single-card header into a clean directory summary & search header (`<VaultBrowserHeader />`) and a dedicated desktop path & view switcher strip (`<VaultBrowserToolbar />`); give breadcrumbs unconstrained horizontal breathing room while anchoring the segmented List/Grid switcher on the right; redesign grid cards with dedicated top preview viewports (supporting images, videos with glass play pills, folder containers, and file-type badges), floating glass micro-action pills on hover, and distinct bottom metadata footers for 100% text legibility; align all typography to DESIGN.md `text-xs` type ramp and pass mechanical detector checks with 0 warnings.
- **shipped:** created `src/components/browser/VaultBrowserToolbar.tsx`, updated `src/components/browser/VaultBrowserHeader.tsx`, `src/components/browser/VaultBreadcrumbs.tsx`, `src/components/browser/MediaGridView.tsx`, `src/components/browser/VaultBrowserTable.tsx`; verified 0 mechanical design warnings via `impeccable detect`, 111/111 vitest tests, and clean production build.

### [2026-10-18] Collapsed Breadcrumb Ellipsis Navigation for Deeply Nested Paths
- **asked:** collapse breadcrumbs with "..." when browsing deep folder paths so that long nested directory hierarchies do not visually crowd or overflow the breadcrumb bar.
- **decided:** add a collapsing threshold (`maxVisible = 3`) in `VaultBreadcrumbs.tsx`; retain immediate access to root `Vault`, the root subfolder, and the active folder; collapse intermediate path segments into an interactive `"..."` trigger powered by the existing `@base-ui/react` `DropdownMenu` primitive with hover tooltip, allowing one-click jump to any intermediate directory; keep component under 150 lines (143 lines).
- **shipped:** updated `src/components/browser/VaultBreadcrumbs.tsx`, added collapsing test case in `src/test/browser-navigation.test.tsx`; verified 112/112 vitest tests passing, 0 TypeScript errors on `pnpm build`, and 0 defects on `impeccable detect`.

### [2026-10-20] Fix Stale Provider State, Flush Rclone FsCache & Media Server Port Invalidation (Issue 2)
- **asked:** fix state desynchronization where disconnecting all cloud accounts and subsequently connecting a different Google Drive account would display ghost files and obsolete storage quotas from a previously connected provider (e.g. OneDrive's 5 GB pool), previous account metrics on Google Drive, and "127.0.0.1 refused to connect" when opening files after account changes.
- **decided:** add `fscache/clear` endpoint to `RcloneClient` and automatically flush Rclone's in-memory `fs.Fs` cache on all remote mutations (`create_remote`, `create_oauth_remote`, `delete_remote`, `update_remote`) so newly connected accounts never hit stale backend remotes; purge pre-existing remotes before starting OAuth in `connect_account`; remove redundant `baulr_vault:` query from `fetch_vault_quota_internal` and calculate `Combined Storage Pool` strictly by summing active connected `accounts` so pool metrics never contradict account cards; add `removeProviderFiles(provider)` to `useRemoteFilesStore` and reconcile active providers in `fetchFiles()`; reset `mediaBaseUrl = null` across account connection and disconnection transitions and fetch fresh base URLs in `VaultBrowserTable.tsx` so users never attempt connecting to dead media server ports.
- **shipped:** updated `src-tauri/src/engine/client.rs`, `src-tauri/src/commands/accounts.rs`, `src-tauri/src/commands/vault.rs`, `src/store/useRemoteFilesStore.ts`, `src/store/useVaultStore.ts`, `src/components/browser/VaultBrowserTable.tsx`; added unit tests across `browser-store.test.ts`, `stores.test.ts`, and `vault.rs`; verified 41/41 cargo tests, 116/116 vitest tests, and clean production build.

### [2026-10-21] Display Duplicate Filenames & Add Cloud Provider Column (Issue 1)
- **asked:** when multiple cloud accounts contain files with the same name, or when the same cloud contains duplicate filenames, show all instances rather than hiding/collapsing them; add a Cloud provider column to the Vault Browser table so users can identify which cloud account each file is uploaded to.
- **decided:** replace `Map`-based path deduplication in `mergeProviderFiles` to preserve every item tagged with its `provider` (`gdrive`, `onedrive`); add a dedicated `Cloud` column with provider brand icons (`GoogleDriveIcon`, `OneDriveIcon`) and labels in `VaultBrowserTable.tsx` and `VaultItemRow.tsx`; display provider badges on cards in `MediaGridView.tsx`; accept `provider` parameter in backend browser commands (`delete_vault_item`, `download_vault_item`, `get_file_share_link`) and frontend API to target operations to the specific provider remote rather than racing or deleting across the union; keep UI components under 150 lines.
- **shipped:** updated `src-tauri/src/commands/browser.rs`, `src/lib/bindings.ts`, `src/lib/api/browser.ts`, `src/store/useRemoteFilesStore.ts`, `src/components/browser/VaultBrowserTable.tsx`, `src/components/browser/VaultItemRow.tsx`, `src/components/browser/MediaGridView.tsx`, `src/components/browser/ShareLinkModal.tsx`, `docs/ISSUES_OCT_20.md`; added unit tests in `src-tauri/src/commands/browser.rs`, `src/test/browser-store.test.ts`, `src/test/browser-table.test.tsx`, `src/test/browser-api.test.ts`; verified 42/42 cargo tests, 121/121 vitest tests, and clean production build.


