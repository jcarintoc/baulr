import { create } from "zustand";
import { DaemonStatus } from "../lib/bindings";
import { fetchDaemonStatus } from "../lib/api/daemon";

interface DaemonState {
  status: DaemonStatus | null;
  isLoading: boolean;
  loadStatus: () => Promise<void>;
}

export const useDaemonStore = create<DaemonState>((set) => ({
  status: null,
  isLoading: false,
  loadStatus: async () => {
    set({ isLoading: true });
    try {
      const status = await fetchDaemonStatus();
      set({ status, isLoading: false });
    } catch {
      set({ status: { isRunning: false, port: 0 }, isLoading: false });
    }
  },
}));
