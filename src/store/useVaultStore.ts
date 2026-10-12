import { create } from "zustand";
import { VaultQuota } from "../lib/types";
import { fetchVaultQuota } from "../lib/api/vault";

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
