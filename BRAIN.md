# Project Brain & Knowledge Graph

**File:** `BRAIN.md`  
**Scope:** Central nervous system and knowledge index for all AI agents  

---

## 1. Agent Knowledge Path

When an AI agent enters this project, follow this knowledge navigation path:

```
                  [ AGENTS.md ] (Global Rules & Standards)
                         |
                         v
                  [ BRAIN.md ] (Knowledge Hub)
                  /          \
                 /            \
   +------------v----+    +----v-------------+
   |  Memory & State |    |  Specifications  |
   +-----------------+    +------------------+
   | - PROJECT_LOGS  |    | - PRD.md         |
   | - ROADMAP       |    | - ARCHITECTURE   |
   | - SKILLS        |    | - TECHSTACK      |
   |                 |    | - MVP.md         |
   +-----------------+    +------------------+
```

---

## 2. Active Agent Skills

Agents must follow these skill protocols during work:

- **[Project Logs & Memory Skill](.agents/skills/project-logs.md):**  
  Memory protocol for recording what was *asked*, *decided*, and *shipped* in [`docs/PROJECT_LOGS.md`](docs/PROJECT_LOGS.md).
- **[Roadmap Management Skill](.agents/skills/roadmap.md):**  
  Progress tracking protocol using `[[Wiki Links]]` across Backlog, In Progress, and Done in [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## 3. Living State Files (in `docs/`)

- **[ROADMAP.md](docs/ROADMAP.md):** Current sprint status and next backlog tasks.
- **[PROJECT_LOGS.md](docs/PROJECT_LOGS.md):** Append-only log of user requests, decisions, and shipped deliverables.

---

## 4. Architectural & Product Specs (in `docs/`)

- **[PRD.md](docs/PRD.md):** Product Requirements Document (Personas, P0/P1/P2 priorities, Non-goals).
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md):** System architecture (Rclone sidecar, Union `mfs` policy, IPC).
- **[TECHSTACK.md](docs/TECHSTACK.md):** Tech stack choices and justifications (Tauri v2 + Rust + React 19).
- **[MVP.md](docs/MVP.md):** Implementation plan, sprint breakdown, and acceptance tests.

---

## 5. Technology Rules Directory

- **[Rust & Tauri Rules](.agents/rules/tauri-rust.md):** Thin Rust BFF, zero `.unwrap()`, typed IPC.
- **[Rclone Engine Rules](.agents/rules/rclone.md):** Daemon `rcd` on `127.0.0.1:0`, zero CLI execs, no chunker.
- **[Frontend Rules](.agents/rules/frontend.md):** Strict IPC boundary (`src/lib/api/`), Zustand, <150 line components.
