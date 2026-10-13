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



