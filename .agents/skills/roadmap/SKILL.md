---
name: roadmap
description: Manage project progress, prioritize next steps, and keep state synchronized across Backlog, In Progress, and Done in docs/ROADMAP.md.
---

# Skill: Roadmap Management

**File:** `.agents/skills/roadmap/SKILL.md`  
**Purpose:** Manage project progress, prioritize next steps, and keep state synchronized across Backlog, In Progress, and Done.

---

## 1. When to Use This Skill
- At the start of a task: identify the highest-priority item in `## Backlog` or verify the active item in `## In Progress`.
- During active implementation: move the target task to `## In Progress`.
- Upon verification & completion: move the item to `## Done`.

---

## 2. Roadmap Format Specification

The project roadmap is tracked in [`docs/ROADMAP.md`](../../../docs/ROADMAP.md) using wiki-style links (`[[Task Name]]`):

```markdown
# Roadmap

## Backlog
- [[LAN Wi-Fi QR Mobile Upload]]
- [[Dropbox & Box Providers]]
- [[Bandwidth Throttler]]

## In Progress
- [[Rclone Sidecar Supervisor]]
- [[Cloud OAuth & Union Vault]]

## Done
- [[PRD & Architecture Design]]
- [[Technology Rules & Engineering Standards]]
- [[Project Logs & Roadmap Skills]]
```

---

## 3. Rules for Updating the Roadmap
1. **Single Source of Truth:** `ROADMAP.md` reflects current sprint reality.
2. **Move, Don't Duplicate:** When a task begins, cut it from `## Backlog` and paste into `## In Progress`.
3. **Evidence Before Done:** An item only moves to `## Done` once verified by tests or working commands (Ponytail invariant).
4. **Wiki Links:** Keep task names enclosed in double brackets (`[[...]]`) for cross-referencing.
