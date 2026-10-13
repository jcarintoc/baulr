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

---

## 4. Preserving Default shadcn Styling & Design

- **Do Not Modify Default Styles:** Always use shadcn components with their default styling, spacing, borders, typography, and color tokens. Do not inject custom `className` overrides that alter the component's core design aesthetic.
- **Rely on Official Props & Variants:** Always use built-in variants and props (e.g., `variant="outline"`, `size="sm"`) rather than stacking ad-hoc utility overrides (e.g., do not pass `className="bg-blue-600 rounded-none px-6 py-2"` to `<Button>`).

---

## 5. SVG Icon Rules (Tabler Icons & shadcn Integration)

When using SVG icons (such as `@tabler/icons-react` or `lucide-react`) alongside shadcn components:

### 5.1 Components with Built-in Icon Sizing (Omit Dimensions)
Shadcn components like `Button`, `Tabs` (`TabsTrigger`), `Badge`, `Alert`, `Toast`, and `DropdownMenuItem` already define default icon sizing, spacing, and pointer-event rules (e.g. `[&_svg:not([class*='size-'])]:size-3.5`, `[&>svg]:size-2.5!`).
- **Do NOT specify icon dimensions:** Omit `size={...}`, `width={...}`, `height={...}`, and manual `className="size-..."` or `className="w-4 h-4"`. Let the parent component manage the SVG size and alignment.
- **Example:**
  ```tsx
  // ✅ Good: Button automatically applies correct icon size
  <Button variant="outline">
    <IconDownload />
    <span>Export Vault</span>
  </Button>

  // ❌ Bad: Redundant manual icon dimensions
  <Button variant="outline">
    <IconDownload className="w-4 h-4" size={16} />
    <span>Export Vault</span>
  </Button>
  ```

### 5.2 Components Without Built-in Icon Sizing (Use `size-` Utility)
Components like `Card`, `CardHeader`, or standalone structural `<div>` elements do **not** supply automatic SVG sizing rules.
- **Always use `size-<n>`:** When manual icon sizing is required, use Tailwind's `size-<n>` utility (e.g. `size-4`, `size-5`, `size-6`).
- **Never use paired `w-<n> h-<n>`:** Avoid redundant width and height utility pairs.
- **Example:**
  ```tsx
  // ✅ Good: Use size- inside Card or standalone containers
  <CardHeader>
    <IconShieldCheck className="size-5 text-emerald-500" />
    <CardTitle>Vault Health</CardTitle>
  </CardHeader>

  // ❌ Bad: Separate w- and h- classes
  <IconShieldCheck className="w-5 h-5 text-emerald-500" />
  ```

---

## 6. Custom Component Fallback Rules (Step 4)

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

## 7. Quick Reference & Anti-Patterns

| Action | ❌ Anti-Pattern | ✅ Correct Pattern |
| :--- | :--- | :--- |
| **New Dialog/Modal** | Writing a custom `<div className="fixed inset-0 ...">` | Use `src/components/ui/alert-dialog.tsx` or `dialog.tsx` |
| **Missing Slider/Select** | Coding a custom `<select>` or drag range input | Search shadcn MCP (`select`, `slider`) and install via `pnpm dlx shadcn@latest add select` |
| **Custom Styling** | Passing `className="bg-blue-600 px-6 rounded-none"` to a `Button` | Use default style & native variants: `<Button variant="outline">` |
| **Icons in Buttons/Tabs/Badges** | `<Button><IconCheck className="w-4 h-4" /></Button>` | `<Button><IconCheck /> Save</Button>` (automatic icon sizing) |
| **Icons in Card/Wrappers** | `<IconFolder className="w-5 h-5" />` | `<IconFolder className="size-5" />` (use `size-` instead of `w-` and `h-`) |
| **Complex Dropzone** | Reinventing button styles and card containers | Build `DropzoneCard` using shadcn `Card` + `Button` + Lucide icons |
| **Action Confirmation** | Writing custom confirmation popup | Use `@/components/ui/alert-dialog` |
