import { create } from "zustand";
import { VaultQuota } from "../lib/bindings";
import { fetchVaultQuota } from "../lib/api/vault";
import {
  connectAccount as apiConnectAccount,
  disconnectAccount as apiDisconnectAccount,
  cancelOAuth as apiCancelOAuth,
} from "../lib/api/accounts";

interface VaultState {
  quota: VaultQuota | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  authenticatingProvider: string | null;
  error: string | null;
  loadQuota: () => Promise<void>;
  connectAccount: (provider: string) => Promise<void>;
  disconnectAccount: (provider: string) => Promise<void>;
  cancelOAuth: () => Promise<void>;
  clearError: () => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  quota: null,
  isLoading: false,
  isAuthenticating: false,
  authenticatingProvider: null,
  error: null,
  clearError: () => set({ error: null }),
  loadQuota: async () => {
    set({ isLoading: true, error: null });
    try {
      const quota = await fetchVaultQuota();
      set({ quota, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },
  connectAccount: async (provider: string) => {
    set({ isAuthenticating: true, authenticatingProvider: provider, error: null });
    try {
      const updatedQuota = await apiConnectAccount(provider);
      set({ quota: updatedQuota, isAuthenticating: false, authenticatingProvider: null });
    } catch (err) {
      set({ error: String(err), isAuthenticating: false, authenticatingProvider: null });
    }
  },
  disconnectAccount: async (provider: string) => {
    set({ isLoading: true, error: null });
    try {
      const updatedQuota = await apiDisconnectAccount(provider);
      set({ quota: updatedQuota, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },
  cancelOAuth: async () => {
    try {
      await apiCancelOAuth();
    } catch (err) {
      console.warn("OAuth cancellation error:", err);
    } finally {
      set({ isAuthenticating: false, authenticatingProvider: null });
    }
  },
}));
