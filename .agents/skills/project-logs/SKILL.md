---
name: project-logs
description: Record what was asked, what was decided, and what was shipped in docs/PROJECT_LOGS.md to give AI agents persistent memory across sessions.
---

# Skill: Project Logs & Agent Memory

**File:** `.agents/skills/project-logs/SKILL.md`  
**Purpose:** Provide AI agents with persistent memory across sessions to record what was asked, what was decided, and what was shipped.

---

## 1. When to Use This Skill
- Whenever the user requests a new feature, behavior change, or architectural decision.
- Before starting work: read `docs/PROJECT_LOGS.md` to avoid re-asking or undoing past decisions.
- After finishing work: append a concise entry to `docs/PROJECT_LOGS.md`.

---

## 2. Log Entry Format (The 3-Line Memory Pattern)

Every log entry must be brief, concrete, and follow this pattern:

```markdown
### [YYYY-MM-DD] <Feature or Task Name>
- **asked:** <What the user asked for or problem stated> (e.g. "asked: give agents memory across sessions")
- **decided:** <The chosen technical trade-off or boundary> (e.g. "decided: 2 markdown files in repo, no external database")
- **shipped:** <What was actually delivered and verified> (e.g. "shipped: project-logs and roadmap skills linked to BRAIN.md")
```

---

## 3. Rules for Maintaining Memory
1. **Never Delete Past Entries:** Logs are an append-only historical record.
2. **One Entry Per Meaningful Step:** Do not log trivial typo fixes; log user-requested decisions, architectural pivots, and completed milestones.
3. **Keep Entries Under 5 Lines:** No essays or justifications; state only what was asked, decided, and shipped.
4. **Target File:** Memory is stored in [`docs/PROJECT_LOGS.md`](../../../docs/PROJECT_LOGS.md).
