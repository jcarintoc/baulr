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
  startOffload: (localPath: string) => Promise<void>;
  cancelOffload: (jobId: number) => Promise<void>;
  handleProgress: (progress: OffloadProgress) => void;
  clearCompleted: () => void;
  clearError: () => void;
  enqueueTransfer: (
    name: string,
    sizeBytes: number,
    jobId?: number,
    path?: string,
    targetProvider?: string
  ) => void;
  updateItemProgress: (
    id: string,
    transferredBytes: number,
    speedBytesPerSec: number,
    etaSeconds: number
  ) => void;
  markItemVerified: (id: string) => void;
}

export const useTransferStore = create<TransferState>((set) => ({
  items: [],
  isTransferring: false,
  isVerified: false,
  error: null,

  startOffload: async (localPath: string) => {
    set({ error: null });
    const name = localPath.split("/").filter(Boolean).pop() || localPath;
    const tempId = `prep-${Date.now()}`;
    const preparingItem: TransferQueueItem = {
      id: tempId,
      path: localPath,
      name,
      sizeBytes: 0,
      transferredBytes: 0,
      speedBytesPerSec: 0,
      etaSeconds: 0,
      status: "preparing",
    };

    set((state) => ({
      items: [...state.items, preparingItem],
      isTransferring: true,
      isVerified: false,
    }));

    try {
      const job = await startOffloadJob(localPath);
      const readyItem: TransferQueueItem = {
        id: `job-${job.jobId ?? Date.now()}`,
        jobId: job.jobId ?? undefined,
        path: job.path,
        name: job.name,
        sizeBytes: job.sizeBytes ?? 0,
        transferredBytes: 0,
        speedBytesPerSec: 0,
        etaSeconds: 0,
        status: "uploading",
        targetProvider: job.targetProvider ?? undefined,
      };

      set((state) => ({
        items: state.items.map((i) => (i.id === tempId ? readyItem : i)),
        isTransferring: true,
        isVerified: false,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      set((state) => ({
        items: state.items.map((i) =>
          i.id === tempId ? { ...i, status: "error" as const, error: msg } : i
        ),
        error: msg,
        isTransferring: state.items.some(
          (i) => i.id !== tempId && (i.status === "uploading" || i.status === "preparing")
        ),
      }));
      throw err;
    }
  },

  cancelOffload: async (jobId: number) => {
    try {
      await cancelOffloadJob(jobId);
      set((state) => {
        const nextItems = state.items.filter((i) => i.jobId !== jobId);
        return {
          items: nextItems,
          isTransferring: nextItems.some(
            (i) => i.status === "uploading" || i.status === "preparing"
          ),
        };
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  handleProgress: (progress: OffloadProgress) => {
    set((state) => {
      const isComplete = progress.status === "completed";
      const isError = progress.status === "error";

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
  },

  enqueueTransfer: (name, sizeBytes, jobId, path, targetProvider) => {
    const id = jobId ? `job-${jobId}` : Math.random().toString(36).substring(2, 9);
    set((state) => ({
      items: [
        ...state.items,
        {
          id,
          jobId,
          path: path ?? name,
          name,
          sizeBytes,
          transferredBytes: 0,
          speedBytesPerSec: 1024 * 1024 * 14.2,
          etaSeconds: Math.ceil(sizeBytes / (1024 * 1024 * 14.2)),
          status: "uploading",
          targetProvider,
        },
      ],
      isTransferring: true,
      isVerified: false,
    }));
  },

  updateItemProgress: (id, transferredBytes, speedBytesPerSec, etaSeconds) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? {
              ...item,
              transferredBytes,
              speedBytesPerSec,
              etaSeconds,
              status: transferredBytes >= item.sizeBytes ? "verifying" : "uploading",
            }
          : item
      ),
    }));
  },

  markItemVerified: (id) => {
    set((state) => {
      const nextItems = state.items.map((item) =>
        item.id === id ? { ...item, status: "verified" as const } : item
      );
      const allVerified = nextItems.length > 0 && nextItems.every((i) => i.status === "verified");
      return {
        items: nextItems,
        isTransferring: !allVerified,
        isVerified: allVerified,
      };
    });
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
