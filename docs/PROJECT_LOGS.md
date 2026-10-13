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
- **shipped:** src/components/ (ViewToggle, OffloadWorkspace, VaultBrowserTable, DropzoneCard, TransferQueue, ReclaimBanner, OnboardingPrompt), App.tsx shell, Zustand stores (useViewStore, useTransferStore, useRemoteFilesStore), stores.test.ts; verified via 8/8 tests, pnpm tsc, pnpm build, and 4/4 cargo tests.







