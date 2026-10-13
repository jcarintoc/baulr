---
trigger: glob
globs: "*.tsx, *.jsx"
---

# Technology Rules: Tailwind CSS Component Styling Rules

---

**File:** `.agents/rules/code-styling-tailwind.md`
**Scope:** Applied to all component files under `src/` (JSX, TSX)
**Audience:** AI agents writing or modifying frontend components code

---

# Tailwind CSS Clean Code & Architecture Rules

When generating or refactoring Tailwind CSS code, avoid **class-stuffing** on individual child elements. Instead, favor parent-driven styling and component design patterns similar to **shadcn/ui** and Radix UI primitives.

## Core Rules

1. **Never repeat utility classes on children** if the parent wrapper can control them via context or direct selectors.
2. **Use arbitrary variants on the parent wrapper** for layout, typography, and icon styling:
   - Use `[&>selector]` for direct children (e.g., `[&>a]:flex [&>a]:items-center`).
   - Use `[&_selector]` for nested descendants (e.g., `[&_svg]:w-4 [&_svg]:h-4`).
3. **Leverage data attributes** (`data-[state=...]`, `data-[disabled]`, etc.) for reactive/interactive states instead of cluttering JSX with inline ternary class strings.
4. **Use `group-*` and `peer-*` modifiers** on wrappers to drive child states (e.g., `group-hover:text-sky-400`).

## Code Pattern Comparison

### ❌ Avoid (Class duplication on children)

```tsx
<div className="flex flex-col gap-2">
  <div className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
    <Icon className="w-4 h-4 text-zinc-400" />
    <span>Dashboard</span>
  </div>
  <div className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
    <Icon className="w-4 h-4 text-zinc-400" />
    <span>Settings</span>
  </div>
</div>
```
