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
