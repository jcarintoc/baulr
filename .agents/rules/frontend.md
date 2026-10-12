# Technology Rules: Frontend & UI Layer

**File:** `.agents/rules/frontend.md`  
**Scope:** Applied to all files under `src/` (React, TypeScript, CSS, UI components)  
**Audience:** AI agents writing or modifying frontend code  

---

## 1. Core Stack & Architectural Boundary

- **Framework:** React 19 + TypeScript (Strict Mode) + Vite
- **Styling:** Tailwind CSS (Utility-first, responsive, dark-mode aware)
- **State Management:** Zustand (Single-purpose stores under `src/store/`)
- **Icons:** `lucide-react` (Standardized, tree-shakeable)
- **Component Primitives:** Radix UI / headless primitives for accessible modals and dialogs

---

## 2. The Strict IPC Boundary (`src/lib/api/`)

### 2.1 The Cardinal Rule: No Raw `invoke()` in Components
Components must **never** call Tauri's `invoke()` directly.

```tsx
// FORBIDDEN: Calling Tauri IPC directly inside a component
function VaultBar() {
  useEffect(() => {
    invoke("get_vault_quota").then(...); // STRICTLY BANNED
  }, []);
}
```

### 2.2 API Service Pattern
Every Tauri command must be wrapped in a typed function inside `src/lib/api/`:

```typescript
// src/lib/api/vault.ts
import { invoke } from "@tauri-apps/api/core";

export interface VaultQuota {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  providerBreakdown: Record<string, { used: number; total: number }>;
}

export async function fetchVaultQuota(): Promise<VaultQuota> {
  return await invoke<VaultQuota>("get_vault_quota");
}
```

---

## 3. Component Architecture & Maintainability

1. **The 150-Line Limit:** Keep individual React component files under 150 lines. When a component grows beyond this, extract sub-views or helper components (e.g. `AccountCard.tsx`, `TransferItem.tsx`).
2. **Directory Structure:**
   ```
   src/
   ├── components/
   │   ├── common/          # Button, Modal, ProgressBar, Toast
   │   ├── vault/           # StorageMeter, CapacityBreakdown
   │   ├── accounts/        # AccountList, ConnectModal, AccountCard
   │   └── offloader/       # Dropzone, TransferQueue, VerifyModal
   ├── store/               # Zustand stores (useVaultStore, useTransferStore)
   ├── lib/
   │   ├── api/             # Typed Tauri IPC wrappers
   │   └── formatters.ts    # formatBytes, formatDuration, formatSpeed
   ├── App.tsx              # Main layout shell
   └── main.tsx             # DOM mount point
   ```
3. **No Premature Optimization:** Avoid gratuitous `useCallback` and `useMemo` on cheap calculations. Only memoize when profiling proves a re-render bottleneck.

---

## 4. State Management (Zustand Standards)

Keep stores lean and separated by domain:
- `useVaultStore`: Holds connected cloud accounts, current pool quota, and health status.
- `useTransferStore`: Tracks active transfer progress, upload speed, ETA, and verified completion states.

```typescript
// src/store/useVaultStore.ts
import { create } from "zustand";
import { fetchVaultQuota, VaultQuota } from "@/lib/api/vault";

interface VaultState {
  quota: VaultQuota | null;
  isLoading: boolean;
  error: string | null;
  loadQuota: () => Promise<void>;
}

export const useVaultStore = create<VaultState>((set) => ({
  quota: null,
  isLoading: false,
  error: null,
  loadQuota: async () => {
    set({ isLoading: true, error: null });
    try {
      const quota = await fetchVaultQuota();
      set({ quota, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },
}));
```

---

## 5. UX & Data Safety Invariants

1. **Verify-Before-Delete Modal:**
   - Deleting local files to reclaim space must **never** occur automatically or silently.
   - The UI must display an explicit confirmation modal with:
     - Number of files verified.
     - Total gigabytes to be reclaimed.
     - Clear reassurance: *"Verified against cloud checksums. Files will be moved to your Trash."*
2. **Graceful Loading & Error Feedback:**
   - Every async action must display an active loading state (spinner or skeleton).
   - Errors from failed cloud connections or full disk errors must be rendered in human-readable banner toasts, not raw technical JSON errors.
3. **Standard Byte Formatter:**
   - Always display file sizes and quotas using binary units (KiB, MiB, GiB) or decimal units consistently via a single centralized utility (`formatBytes`).

---

## 6. Verification Checklist Before Completion

Before submitting frontend code, the AI agent must run:
1. `pnpm tsc --noEmit` (0 TypeScript errors).
2. `pnpm lint` (0 ESLint warnings/errors).
3. `pnpm build` (production Vite build succeeds).
