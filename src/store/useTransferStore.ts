import { create } from "zustand";

export interface TransferQueueItem {
  id: string;
  name: string;
  sizeBytes: number;
  transferredBytes: number;
  speedBytesPerSec: number;
  etaSeconds: number;
  status: "queued" | "uploading" | "verifying" | "verified" | "error";
  error?: string;
}

interface TransferState {
  items: TransferQueueItem[];
  isTransferring: boolean;
  isVerified: boolean;
  enqueueTransfer: (name: string, sizeBytes: number) => void;
  updateItemProgress: (
    id: string,
    transferredBytes: number,
    speedBytesPerSec: number,
    etaSeconds: number
  ) => void;
  markItemVerified: (id: string) => void;
  clearCompleted: () => void;
}

export const useTransferStore = create<TransferState>((set) => ({
  items: [],
  isTransferring: false,
  isVerified: false,
  enqueueTransfer: (name: string, sizeBytes: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newItem: TransferQueueItem = {
      id,
      name,
      sizeBytes,
      transferredBytes: 0,
      speedBytesPerSec: 1024 * 1024 * 14.2, // ~14 MB/s initial telemetry
      etaSeconds: Math.ceil(sizeBytes / (1024 * 1024 * 14.2)),
      status: "uploading",
    };
    set((state) => ({
      items: [...state.items, newItem],
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
}));
