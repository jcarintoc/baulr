import { create } from "zustand";
import { VaultQuota, DaemonStatus } from "../lib/bindings";
import { fetchVaultQuota } from "../lib/api/vault";
import { fetchDaemonStatus } from "../lib/api/daemon";
import {
  connectAccount as apiConnectAccount,
  disconnectAccount as apiDisconnectAccount,
  cancelOAuth as apiCancelOAuth,
} from "../lib/api/accounts";
import { useRemoteFilesStore } from "./useRemoteFilesStore";

interface VaultState {
  quota: VaultQuota | null;
  daemonStatus: DaemonStatus | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  authenticatingProvider: string | null;
  error: string | null;
  loadQuota: () => Promise<void>;
  loadDaemonStatus: () => Promise<void>;
  connectAccount: (provider: string) => Promise<void>;
  disconnectAccount: (provider: string) => Promise<void>;
  cancelOAuth: () => Promise<void>;
}

export const useVaultStore = create<VaultState>((set) => ({
  quota: null,
  daemonStatus: null,
  isLoading: false,
  isAuthenticating: false,
  authenticatingProvider: null,
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
  loadDaemonStatus: async () => {
    try {
      const daemonStatus = await fetchDaemonStatus();
      set({ daemonStatus });
    } catch {
      set({ daemonStatus: { isRunning: false, port: 0 } });
    }
  },
  connectAccount: async (provider: string) => {
    const wasEmpty = !useVaultStore.getState().quota?.accounts?.some((a) => a.isConnected);
    set({ isAuthenticating: true, authenticatingProvider: provider, error: null });
    try {
      const updatedQuota = await apiConnectAccount(provider);
      set({ quota: updatedQuota, isAuthenticating: false, authenticatingProvider: null });
      if (wasEmpty) {
        useRemoteFilesStore.getState().clearFiles();
      }
      useRemoteFilesStore.getState().fetchFiles().catch(() => {});
    } catch (err) {
      set({ error: String(err), isAuthenticating: false, authenticatingProvider: null });
    }
  },
  disconnectAccount: async (provider: string) => {
    set({ isLoading: true, error: null });
    try {
      const updatedQuota = await apiDisconnectAccount(provider);
      set({ quota: updatedQuota, isLoading: false });
      useRemoteFilesStore.getState().removeProviderFiles(provider);
      updatedQuota.accounts?.some((a) => a.isConnected)
        ? useRemoteFilesStore.getState().fetchFiles().catch(() => {})
        : useRemoteFilesStore.getState().clearFiles();
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
