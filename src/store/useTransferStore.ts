import { create } from "zustand";
import { OffloadProgress, startOffloadJob, cancelOffloadJob } from "@/lib/api/offload";

export interface TransferQueueItem {
  id: string;
  jobId?: number;
  path?: string;
  name: string;
  sizeBytes: number;
  transferredBytes: number;
  speedBytesPerSec: number;
  etaSeconds: number;
  status: "queued" | "preparing" | "uploading" | "verifying" | "verified" | "error";
  error?: string;
  targetProvider?: string;
}

interface TransferState {
  items: TransferQueueItem[];
  isTransferring: boolean;
  isVerified: boolean;
  error: string | null;
  startOffload: (localPath: string, targetProvider?: string) => Promise<void>;
  enqueuePaths: (localPaths: string[], targetProvider?: string) => Promise<void>;
  cancelOffload: (jobId: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  processNext: () => Promise<void>;
  handleProgress: (progress: OffloadProgress) => void;
  clearCompleted: () => void;
  clearError: () => void;
}

export const useTransferStore = create<TransferState>((set, get) => ({
  items: [],
  isTransferring: false,
  isVerified: false,
  error: null,

  startOffload: async (localPath: string, targetProvider?: string) => {
    await get().enqueuePaths([localPath], targetProvider);
  },

  enqueuePaths: async (localPaths: string[], targetProvider?: string) => {
    if (localPaths.length === 0) return;
    set({ error: null });

    const newItems: TransferQueueItem[] = localPaths.map((path, idx) => ({
      id: `queue-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      path,
      name: path.split("/").filter(Boolean).pop() || path,
      sizeBytes: 0,
      transferredBytes: 0,
      speedBytesPerSec: 0,
      etaSeconds: 0,
      status: "queued",
      targetProvider: targetProvider && targetProvider !== "auto" ? targetProvider : undefined,
    }));

    set((state) => ({
      items: [...state.items, ...newItems],
      isVerified: false,
    }));

    await get().processNext();
  },

  processNext: async () => {
    const state = get();
    if (state.items.some((i) => i.status === "preparing" || i.status === "uploading")) {
      return;
    }

    const nextItem = state.items.find((i) => i.status === "queued");
    if (!nextItem || !nextItem.path) {
      set({
        isTransferring: false,
        isVerified: state.items.length > 0 && state.items.every((i) => i.status === "verified"),
      });
      return;
    }

    set((s) => ({
      items: s.items.map((i) => (i.id === nextItem.id ? { ...i, status: "preparing" as const } : i)),
      isTransferring: true,
      isVerified: false,
    }));

    try {
      const job = await startOffloadJob(nextItem.path, nextItem.targetProvider);
      set((s) => ({
        items: s.items.map((i) =>
          i.id === nextItem.id
            ? {
                ...i,
                id: `job-${job.jobId ?? Date.now()}`,
                jobId: job.jobId ?? undefined,
                path: job.path,
                name: job.name,
                sizeBytes: job.sizeBytes ?? 0,
                status: "uploading" as const,
                targetProvider: job.targetProvider ?? i.targetProvider ?? undefined,
              }
            : i
        ),
        isTransferring: true,
        isVerified: false,
      }));
    } catch (err) {

      const msg = err instanceof Error ? err.message : String(err);
      set((s) => ({
        items: s.items.map((i) =>
          i.id === nextItem.id ? { ...i, status: "error" as const, error: msg } : i
        ),
        error: msg,
      }));
      get().processNext();
    }
  },

  removeItem: async (id: string) => {
    const item = get().items.find((i) => i.id === id);
    if (item?.jobId && item.status === "uploading") {
      await cancelOffloadJob(item.jobId).catch(() => {});
    }

    set((state) => {
      const nextItems = state.items.filter((i) => i.id !== id);
      return {
        items: nextItems,
        isTransferring: nextItems.some(
          (i) => i.status === "uploading" || i.status === "preparing"
        ),
        isVerified: nextItems.length > 0 && nextItems.every((i) => i.status === "verified"),
      };
    });

    get().processNext();
  },

  cancelOffload: async (jobId: number) => {
    const item = get().items.find((i) => i.jobId === jobId);
    if (item) {
      await get().removeItem(item.id);
    }
  },


  handleProgress: (progress: OffloadProgress) => {
    const isComplete = progress.status === "completed";
    const isError = progress.status === "error";

    set((state) => {
      const updated = state.items.map((item) => {
        if (item.jobId === progress.jobId) {
          return {
            ...item,
            transferredBytes: progress.transferredBytes,
            speedBytesPerSec: progress.speedBytesPerSec,
            etaSeconds: progress.etaSeconds,
            status: isComplete
              ? ("verified" as const)
              : isError
              ? ("error" as const)
              : ("uploading" as const),
            error: progress.error ?? undefined,
            targetProvider: progress.targetProvider ?? item.targetProvider,
          };
        }
        return item;
      });

      const anyTransferring = updated.some(
        (i) => i.status === "uploading" || i.status === "preparing"
      );
      const allVerified = updated.length > 0 && updated.every((i) => i.status === "verified");

      return {
        items: updated,
        isTransferring: anyTransferring,
        isVerified: allVerified,
      };
    });

    if (isComplete || isError) {
      get().processNext();
    }
  },

  clearCompleted: () => {
    set({
      items: [],
      isTransferring: false,
      isVerified: false,
    });
  },

  clearError: () => set({ error: null }),
}));
