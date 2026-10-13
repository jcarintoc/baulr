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
   - Use `[&_selector]` for nested descendants (e.g., `[&_svg]:size-4`).
3. **Always use `size-<n>` instead of paired `w-<n> h-<n>`** for square dimensions and SVG icons (e.g. `size-4` instead of `w-4 h-4`).
4. **Omit manual icon dimensions inside shadcn components:** In components with built-in SVG sizing (such as `Button`, `Tabs`, `Badge`, `Alert`), do not add manual `size-` or dimension classes; let parent selectors handle icon size. For containers without built-in SVG sizing (like `Card`), use `size-<n>`.
5. **Leverage data attributes** (`data-[state=...]`, `data-[disabled]`, etc.) for reactive/interactive states instead of cluttering JSX with inline ternary class strings.
6. **Use `group-*` and `peer-*` modifiers** on wrappers to drive child states (e.g., `group-hover:text-sky-400`).

## Code Pattern Comparison

### ❌ Avoid (Class duplication & paired w-/h-)

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

### ✅ Preferred (Parent-driven selectors & `size-` utility)

```tsx
<div className="flex flex-col gap-2 [&_a]:flex [&_a]:items-center [&_a]:gap-2 [&_a]:text-sm [&_a]:text-zinc-400 [&_a:hover]:text-zinc-100 [&_svg]:size-4">
  <a href="#dashboard">
    <IconDashboard />
    <span>Dashboard</span>
  </a>
  <a href="#settings">
    <IconSettings />
    <span>Settings</span>
  </a>
</div>
```
