# Global Agent Rules & Project Standards

## Project: Baulr (Local-First Unified Cloud Vault & Offloader)

**File:** `AGENTS.md`  
**Scope:** Universal across all agents, models, and contributors  

---

## 1. Prime Directive: Web-Developer-First Maintainability

The maintainer of this project is a **Web Developer**. 
All AI agents must design code that is:
- **Readable:** Avoid clever one-liners, obscure macros, and complex lifetime gymnastics.
- **Maintainable:** Clear separation of concerns; no monolithic multi-thousand-line files.
- **Scalable:** Clean API boundaries and modular folder structure.
- **Easy to Manage:** Boring, standard patterns over novel, experimental techniques.

---

## 2. The Ponytail Engineering Principle (YAGNI & Simplicity)

The best code is the code never written. Follow this ladder on every task:
1. **Does this need to exist?** If it is a speculative need or "for later", do not build it.
2. **Already in codebase?** Reuse existing helpers and patterns before creating new ones.
3. **Stdlib / native feature first:** Use standard library and browser/platform features before adding third-party dependencies.
4. **Shortest working diff wins:** The simplest solution that completely and safely solves the problem is the right one.
5. **No unrequested abstractions:** No interfaces with one implementation, no factories for one product, no config for values that never change.

---

## 3. Data Safety & Zero-Loss Invariant

Baulr handles personal media, family photos, and documents. Data loss is fatal.

- **Verify Before Delete:** NEVER delete a local file until its remote copy passes cryptographic hash verification (MD5, SHA-1, or QuickXOR).
- **Non-Destructive Deletions:** Local file reclamation MUST move files to the OS Trash / Recycle Bin. Never invoke hard `rm` or `std::fs::remove_file()` on user files.
- **Capacity Gate:** Always perform a pre-flight capacity check (`file_size <= remaining_space`) before starting any upload.
- **Cloud is Source of Truth:** Local databases (SQLite) are ephemeral caches and indices. If local state conflicts with remote cloud state, remote state wins.

---

## 4. Architecture & Technology Boundary

The project is split into distinct layers governed by specialized rules in `.agents/rules/`:

1. **Rust / Tauri v2 Layer (`.agents/rules/tauri-rust.md`):**
   - Serves as a thin, safe Backend-for-Frontend (BFF).
   - Manages OS keychain, filesystem dialogs, and subprocess supervision.
   - Zero panics allowed (`.unwrap()` and `.expect()` strictly forbidden in production).
2. **Rclone Sidecar Engine (`.agents/rules/rclone.md`):**
   - Persistent daemon (`rclone rcd`) over loopback HTTP JSON-RPC.
   - Dynamic port allocation (`127.0.0.1:0`).
   - Zero one-off CLI execs; zero plaintext secrets in logs.
3. **Frontend Layer (`.agents/rules/frontend.md`):**
   - React 19 + TypeScript + Tailwind CSS + Zustand.
   - Strict API boundary (`src/lib/api/`) separating UI from Tauri IPC.
   - Modular components under 150 lines.
   - Strict shadcn-first protocol ([`.agents/rules/component-shadcn.md`](.agents/rules/component-shadcn.md)): local check -> MCP registry -> install -> custom fallback.

---

## 5. Development & Verification Rules

- **Explain Less, Verify More:** Before claiming a task is done, run verification commands (typecheck, lint, build, or tests).
- **Graceful Error Handling:** Every user-facing action must report errors through UI toasts or alerts; never swallow errors silently in `catch` blocks or empty `match` arms.
- **Clean Diffs:** Avoid reformatting unrelated files or making sweeping style changes across the codebase.

---

## 6. Central Knowledge Hub & Agent Memory (BRAIN.md)

All agents must traverse the project knowledge path starting from [`BRAIN.md`](BRAIN.md).
- **Agent Memory:** Follow [`.agents/skills/project-logs/SKILL.md`](.agents/skills/project-logs/SKILL.md) to log requests, decisions, and shipped deliverables in [`docs/PROJECT_LOGS.md`](docs/PROJECT_LOGS.md).
- **Roadmap & Sprints:** Follow [`.agents/skills/roadmap/SKILL.md`](.agents/skills/roadmap/SKILL.md) to manage tasks in [`docs/ROADMAP.md`](docs/ROADMAP.md).



