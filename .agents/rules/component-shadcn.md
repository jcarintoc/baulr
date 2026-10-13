---
trigger: glob
globs: "src/**/*.tsx, src/components/**/*.{ts,tsx}, src/hooks/**/*.{ts,tsx}"
---

# Technology Rules: shadcn/ui Component Adoption & Registry Protocol

**File:** `.agents/rules/component-shadcn.md`  
**Scope:** Applied to all UI component authoring, refactoring, and imports under `src/`  
**Audience:** AI agents writing, modifying, or reviewing frontend UI components  

---

## 1. Prime Directive: shadcn-First Component Hierarchy

AI agents must **never** create custom UI primitives or standalone components from scratch if an equivalent or foundational component exists in **shadcn/ui**.

- **Prohibited:** Re-inventing standard UI elements (e.g. custom buttons, custom dialogs, custom dropdowns, custom select boxes, tabs, badges, tooltips, checkboxes, inputs).
- **Mandatory:** Always check existing local UI components first, query the shadcn registry via the MCP server if missing, and install official components before writing new code.

---

## 2. The 4-Step Resolution Decision Gate

Whenever a task requires a UI component, follow this sequential decision path:

```
Need a UI component?
         │
         ▼
[Step 1: Check Local Folder]
Does `src/components/ui/<component>.tsx` exist?
   ├─ YES ──► Import directly from `@/components/ui/<component>`
   └─ NO  ──► Proceed to Step 2
         │
         ▼
[Step 2: Query shadcn Registry via MCP Server]
Use `shadcn` MCP tools (e.g. `search_items_in_registries` with query & `@shadcn`):
   ├─ FOUND ──────► Proceed to Step 3
   └─ NOT FOUND ──► Proceed to Step 4 (Strict Fallback)
         │
         ▼
[Step 3: Install via shadcn CLI]
Obtain add command (or call `get_add_command_for_items`):
`pnpm dlx shadcn@latest add <component-name>`
Verify file is placed in `src/components/ui/`, then import and use.
         │
         ▼
[Step 4: Custom Component Fallback (Only When Unavailable)]
ONLY when the required component cannot be satisfied by any shadcn component or block.
```

---

## 3. Tooling & MCP Integration Guide

### Checking Local Components (Step 1)
Inspect `src/components/ui/` to see if the primitive is already installed (e.g., `button.tsx`, `dialog.tsx`, `card.tsx`, `badge.tsx`, `dropdown-menu.tsx`, `progress.tsx`, `toast.tsx`, `separator.tsx`, etc.).

### Using shadcn MCP Server (Step 2)
When the component is not in `src/components/ui/`, call the `shadcn` MCP server to inspect the registry:
- **Search Registry:** Call `call_mcp_tool` with server `shadcn`, tool `search_items_in_registries`, passing `{ "query": "<component_name>", "registries": ["@shadcn"] }`.
- **Retrieve Add Command:** Call `get_add_command_for_items` with `{ "items": ["@shadcn/<component_name>"] }`.

### Installing Components (Step 3)
Run the installation command in the project terminal using `pnpm`:
```bash
pnpm dlx shadcn@latest add <component-name>
```

---

## 4. Custom Component Fallback Rules (Step 4)

A new custom component may **only** be created if it represents complex, specialized composite UI that does not exist in shadcn.

### Approved Custom Component Scenarios
- File upload / Dropzone (e.g. `DropzoneCard.tsx`)
- Kanban board / Task column systems
- Notification center / Activity feed drawers
- Dynamic form builders / Schema-driven editors
- Domain-specific storage visualization bars and cloud vault meters

### Rules for Authoring Custom Components
1. **Compose from Existing Primitives:** Build custom components by assembling existing shadcn primitives (`Card`, `Button`, `Dialog`, `Progress`, `Badge`, `Separator`, etc.) rather than writing bare `<div>` elements with raw styles.
2. **Follow Component Patterns:** Adhere strictly to [`.agents/rules/component-pattern.md`](./component-pattern.md):
   - Keep files under 150 lines.
   - Favor composition over configuration (slots, compound components).
   - Extract state and async logic into custom hooks (`src/hooks/` or `src/store/`).
3. **Follow Tailwind Guidelines:** Adhere to [`.agents/rules/code-styling-tailwind.md`](./code-styling-tailwind.md) (parent-driven selectors, data attributes, no duplicate class-stuffing).

---

## 5. Quick Reference & Anti-Patterns

| Action | ❌ Anti-Pattern | ✅ Correct Pattern |
| :--- | :--- | :--- |
| **New Dialog/Modal** | Writing a custom `<div className="fixed inset-0 ...">` | Use `src/components/ui/alert-dialog.tsx` or `dialog.tsx` |
| **Missing Slider/Select** | Coding a custom `<select>` or drag range input | Search shadcn MCP (`select`, `slider`) and install via `pnpm dlx shadcn@latest add select` |
| **Complex Dropzone** | Reinventing button styles and card containers | Build `DropzoneCard` using shadcn `Card` + `Button` + Lucide icons |
| **Action Confirmation** | Writing custom confirmation popup | Use `@/components/ui/alert-dialog` |
