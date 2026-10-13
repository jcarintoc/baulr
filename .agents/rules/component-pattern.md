---
trigger: glob
globs: "src/**/*.tsx, src/components/**/*.{ts,tsx}, src/hooks/**/*.{ts,tsx}"
---

# Technology Rules: Component Patterns & Architecture Rules

**File:** `.agents/rules/component-pattern.md`  
**Scope:** Applied to all files under `src/` (React, TypeScript, CSS, UI components)  
**Audience:** AI agents writing or modifying frontend components code

---

## 1. Composition Over Configuration

- **Kill boolean prop explosions:** Never let a component accumulate conflicting flags like `isCompact`, `hasFooter`, and `withIcon`. When variants diverge, compose smaller components instead of branching conditionally.
- **Invert control with slots and compound patterns:** Pass rendered elements via `children` or named slots (`header`, `footer`) rather than giant configuration objects. Use compound components (`Modal.Header`, `Modal.Body`) when subcomponents share implicit state.
- **Enforce a six-prop ceiling:** If a component accepts more than six custom props (excluding native HTML attributes), it is doing too much—split its responsibilities.

---

## 2. State & Logic Separation

- **Move brains to custom hooks:** Components should map state to UI. Extract data fetching, complex validation, and multi-step orchestration into dedicated hooks like `useCheckoutFlow`.
- **Derive state during render, never in `useEffect`:** Compute derived values inline during render (`const isValid = items.length > 0 && hasAddress`). Reserve `useEffect` strictly for synchronizing with external systems like DOM APIs or WebSockets.
- **Colocate before elevating:** Keep state as close to where it is used as possible. Reach for Context only when component composition (`children`) cannot solve prop drilling.

---

## 3. Pattern Selection Matrix

| Pattern                        | Best Used For                               | Anti-Pattern Trigger                                    |
| :----------------------------- | :------------------------------------------ | :------------------------------------------------------ |
| **Compound Components**        | Tabs, Accordions, Modals, Selects           | Passing a deeply nested `items` config array            |
| **Slots (`children` / props)** | Layouts, Page Shells, Cards                 | Prop drilling through intermediate layout layers        |
| **Custom Hooks**               | Stateful workflows & shared logic           | Copy-pasting `useState` + `useEffect` across views      |
| **Polymorphic (`as` prop)**    | Design system primitives (`Button`, `Text`) | Hardcoding wrapper `div` tags that break HTML semantics |

---

## 4. Non-Negotiable Code Review Rules

- **Never declare components inside components:** Defining a child component inside a parent function creates a new function reference every render, destroying child state and remounting the DOM subtree.
- **Keep user actions in event handlers:** Run mutations and analytics directly inside `onClick` or `onSubmit` callbacks rather than setting state flags for an effect to catch.
- **Extend native HTML attributes on primitives:** Base UI components (`Button`, `Input`) must forward refs and spread native HTML props via `ComponentProps` so consumers get focus and accessibility support automatically.
- **Never reinvent existing UI primitives:** Always follow [`.agents/rules/component-shadcn.md`](./component-shadcn.md) (check `src/components/ui/`, then shadcn MCP registry, install before authoring custom components).

---

## 5. Implementation Reference

```tsx
// ❌ Bad: Configuration overload ("apropcalypse")
<Card
  title="Profile"
  showAvatar
  avatarUrl="/me.png"
  footerButtons={['Save']}
/>

// ✅ Good: Composable slots & compound components
<Card>
  <Card.Header avatar="/me.png">Profile</Card.Header>
  <Card.Footer>
    <Button>Save</Button>
  </Card.Footer>
</Card>
```
