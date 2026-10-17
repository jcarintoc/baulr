import { create } from "zustand";
import {
  RemoteVaultItem,
  DownloadProgress,
  fetchVaultFiles,
  fetchProviderVaultFiles,
  removeVaultItem,
  downloadVaultItemToDirectory,
  pickDownloadDestination,
  clearShareLinkCache,
} from "@/lib/api/browser";
import { useVaultStore } from "@/store/useVaultStore";

export type { RemoteVaultItem, DownloadProgress };

export function mergeProviderFiles(
  filesByProvider: Record<string, RemoteVaultItem[]>
): RemoteVaultItem[] {
  const map = new Map(
    Object.values(filesByProvider)
      .flat()
      .map((item) => [item.Path, item])
  );
  return Array.from(map.values()).sort((a, b) => a.Name.localeCompare(b.Name));
}

export interface RemoteFilesState {
  files: RemoteVaultItem[];
  filesByProvider: Record<string, RemoteVaultItem[]>;
  providerErrors: Record<string, string | null>;
  providerLoading: Record<string, boolean>;
  isLoading: boolean;
  isInitialLoading: boolean;
  isRevalidating: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  searchQuery: string;
  activeDownloads: Record<string, DownloadProgress>;
  setSearchQuery: (searchQuery: string) => void;
  fetchFiles: () => Promise<void>;
  retryProvider: (provider: string) => Promise<void>;
  prefetchFiles: () => void;
  clearFiles: () => void;
  deleteFile: (path: string, isDir: boolean) => Promise<void>;
  downloadFile: (item: RemoteVaultItem) => Promise<void>;
  handleDownloadProgress: (progress: DownloadProgress) => void;
  dismissDownload: (path: string) => void;
}

export const useRemoteFilesStore = create<RemoteFilesState>((set, get) => {
  const loadProvider = async (provider: string) => {
    try {
      const items = await fetchProviderVaultFiles(provider);
      set((state) => {
        const nextFilesByProvider = {
          ...state.filesByProvider,
          [provider]: items,
        };
        const nextMerged = mergeProviderFiles(nextFilesByProvider);
        return {
          filesByProvider: nextFilesByProvider,
          files: nextMerged,
          providerLoading: { ...state.providerLoading, [provider]: false },
          providerErrors: { ...state.providerErrors, [provider]: null },
          isInitialLoading: state.isInitialLoading && nextMerged.length === 0,
          error: null,
        };
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      set((state) => {
        const nextFilesByProvider = {
          ...state.filesByProvider,
          [provider]: [],
        };
        return {
          filesByProvider: nextFilesByProvider,
          files: mergeProviderFiles(nextFilesByProvider),
          providerLoading: { ...state.providerLoading, [provider]: false },
          providerErrors: { ...state.providerErrors, [provider]: msg },
        };
      });
    }
  };

  return {
    files: [],
    filesByProvider: {},
    providerErrors: {},
    providerLoading: {},
    isLoading: false,
    isInitialLoading: false,
    isRevalidating: false,
    error: null,
    lastFetchedAt: null,
    searchQuery: "",
    activeDownloads: {},

    setSearchQuery: (searchQuery) => set({ searchQuery }),

    clearFiles: () =>
      set({
        files: [],
        filesByProvider: {},
        providerErrors: {},
        providerLoading: {},
        error: null,
        isInitialLoading: false,
        isRevalidating: false,
        lastFetchedAt: null,
      }),

    fetchFiles: async () => {
      const accounts =
        useVaultStore.getState().quota?.accounts?.filter((a) => a.isConnected) ?? [];
      const providers = accounts.map((a) => a.provider);

      const currentFiles = get().files;
      const isFirstLoad = currentFiles.length === 0;

      set({
        isLoading: true,
        isInitialLoading: isFirstLoad,
        isRevalidating: !isFirstLoad,
        error: null,
      });

      if (providers.length === 0) {
        try {
          const files = await fetchVaultFiles();
          set({
            files,
            isLoading: false,
            isInitialLoading: false,
            isRevalidating: false,
            lastFetchedAt: Date.now(),
          });
        } catch (err) {
          set({
            files: [],
            error: err instanceof Error ? err.message : String(err),
            isLoading: false,
            isInitialLoading: false,
            isRevalidating: false,
          });
        }
        return;
      }

      const initialLoading: Record<string, boolean> = {};
      for (const p of providers) {
        initialLoading[p] = true;
      }
      set((state) => ({
        providerLoading: { ...state.providerLoading, ...initialLoading },
      }));

      await Promise.allSettled(providers.map(loadProvider));

      const finalState = get();
      const allFailed =
        providers.length > 0 &&
        providers.every((p) => Boolean(finalState.providerErrors[p]));

      set({
        isLoading: false,
        isInitialLoading: false,
        isRevalidating: false,
        lastFetchedAt: Date.now(),
        error: allFailed ? "Could not reach your cloud accounts." : null,
      });
    },

    retryProvider: async (provider: string) => {
      set((state) => ({
        providerLoading: { ...state.providerLoading, [provider]: true },
        providerErrors: { ...state.providerErrors, [provider]: null },
      }));
      await loadProvider(provider);
    },

  prefetchFiles: () => {
    const state = get();
    const now = Date.now();
    if (
      state.isLoading ||
      state.isRevalidating ||
      (state.lastFetchedAt && now - state.lastFetchedAt < 30_000)
    ) {
      return;
    }
    state.fetchFiles().catch(() => {});
  },

  deleteFile: async (path: string, isDir: boolean) => {
    set({ error: null });
    try {
      await removeVaultItem(path, isDir);
      clearShareLinkCache(path);
      set((state) => {
        const nextFilesByProvider: Record<string, RemoteVaultItem[]> = {};
        for (const [p, list] of Object.entries(state.filesByProvider)) {
          nextFilesByProvider[p] = list.filter((f) => f.Path !== path);
        }
        return {
          files: state.files.filter((f) => f.Path !== path),
          filesByProvider: nextFilesByProvider,
        };
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ error: msg });
      throw err;
    }
  },

  downloadFile: async (item: RemoteVaultItem) => {
    set({ error: null });
    try {
      const destination = await pickDownloadDestination();
      if (!destination) return;

      set((state) => ({
        activeDownloads: {
          ...state.activeDownloads,
          [item.Path]: {
            jobId: 0,
            path: item.Path,
            name: item.Name,
            transferredBytes: 0,
            totalBytes: item.Size && item.Size > 0 ? item.Size : 0,
            speedBytesPerSec: 0,
            etaSeconds: 0,
            status: "downloading",
            destinationDir: destination,
          },
        },
      }));

      await downloadVaultItemToDirectory(
        item.Path,
        item.Name,
        item.IsDir,
        destination
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      set((state) => {
        const next = { ...state.activeDownloads };
        delete next[item.Path];
        return { error: msg, activeDownloads: next };
      });
      throw err;
    }
  },

  handleDownloadProgress: (progress: DownloadProgress) => {
    set((state) => ({
      activeDownloads: {
        ...state.activeDownloads,
        [progress.path]: progress,
      },
    }));
  },

  dismissDownload: (path: string) => {
    set((state) => {
      const next = { ...state.activeDownloads };
      delete next[path];
      return { activeDownloads: next };
    });
  },
};
});
