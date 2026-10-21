import { create } from "zustand";
import {
  RemoteVaultItem,
  DownloadProgress,
  fetchVaultFiles,
  fetchProviderVaultFiles,
  fetchVaultMediaBaseUrl,
  removeVaultItem,
  createVaultFolder,
  downloadVaultItemToDirectory,
  pickDownloadDestination,
  clearShareLinkCache,
} from "@/lib/api/browser";
import { useVaultStore } from "@/store/useVaultStore";

export type { RemoteVaultItem, DownloadProgress };

function getInitialViewMode(): "table" | "grid" {
  try {
    const saved = localStorage.getItem("baulr:vault_view_mode");
    if (saved === "grid" || saved === "table") return saved;
  } catch {}
  return "table";
}

export function mergeProviderFiles(
  filesByProvider: Record<string, RemoteVaultItem[]>
): RemoteVaultItem[] {
  const merged: RemoteVaultItem[] = [];
  for (const [provider, items] of Object.entries(filesByProvider)) {
    for (const item of items) {
      merged.push({ ...item, provider: item.provider ?? provider });
    }
  }
  return merged.sort((a, b) => {
    const nameCmp = a.Name.localeCompare(b.Name);
    if (nameCmp !== 0) return nameCmp;
    return (a.provider ?? "").localeCompare(b.provider ?? "");
  });
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
  currentPath: string;
  viewMode: "table" | "grid";
  mediaBaseUrl: string | null;
  setSearchQuery: (searchQuery: string) => void;
  setVaultPath: (path: string) => Promise<void>;
  setViewMode: (mode: "table" | "grid") => void;
  ensureMediaBaseUrl: (forceRefresh?: boolean) => Promise<string | null>;
  fetchFiles: () => Promise<void>;
  retryProvider: (provider: string) => Promise<void>;
  removeProviderFiles: (provider: string) => void;
  prefetchFiles: () => void;
  clearFiles: () => void;
  createFolder: (name: string, provider?: string) => Promise<string>;
  deleteFile: (path: string, isDir: boolean, provider?: string) => Promise<void>;
  downloadFile: (item: RemoteVaultItem) => Promise<void>;
  handleDownloadProgress: (progress: DownloadProgress) => void;
  dismissDownload: (path: string) => void;
}

export const useRemoteFilesStore = create<RemoteFilesState>((set, get) => {
  const loadProvider = async (provider: string) => {
    const currentPath = get().currentPath;
    try {
      const items = await fetchProviderVaultFiles(provider, currentPath);
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
    currentPath: "",
    viewMode: getInitialViewMode(),
    mediaBaseUrl: null,

    setSearchQuery: (searchQuery) => set({ searchQuery }),

    setVaultPath: async (path: string) => {
      set({
        currentPath: path,
        files: [],
        filesByProvider: {},
        providerErrors: {},
        providerLoading: {},
        isInitialLoading: true,
      });
      await get().fetchFiles();
    },

    setViewMode: (viewMode: "table" | "grid") => {
      try {
        localStorage.setItem("baulr:vault_view_mode", viewMode);
      } catch {}
      set({ viewMode });
    },

    ensureMediaBaseUrl: async (forceRefresh = false) => {
      const existing = get().mediaBaseUrl;
      if (!forceRefresh && existing) return existing;
      try {
        const url = await fetchVaultMediaBaseUrl();
        set({ mediaBaseUrl: url });
        return url;
      } catch {
        return null;
      }
    },

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
        currentPath: "",
        mediaBaseUrl: null,
      }),

    createFolder: async (name: string, provider?: string) => {
      set({ error: null });
      const currentPath = get().currentPath;
      const cleanName = name.trim();
      const folderPath = currentPath ? `${currentPath}/${cleanName}` : cleanName;

      // Determine resolved provider for optimistic attribution
      const accounts =
        useVaultStore.getState().quota?.accounts?.filter((a) => a.isConnected) ?? [];
      let resolvedProvider = provider;
      if (!resolvedProvider || resolvedProvider === "auto") {
        if (accounts.length > 0) {
          const sorted = [...accounts].sort((a, b) => {
            const freeA = (a.totalBytes ?? 0) - (a.usedBytes ?? 0);
            const freeB = (b.totalBytes ?? 0) - (b.usedBytes ?? 0);
            return freeB - freeA;
          });
          resolvedProvider = sorted[0]?.provider;
        }
      }

      const optimisticItem: RemoteVaultItem = {
        Path: folderPath,
        Name: cleanName,
        Size: 0,
        MimeType: "inode/directory",
        ModTime: new Date().toISOString(),
        IsDir: true,
        provider: resolvedProvider,
      };

      // 1. Optimistic insertion
      set((state) => {
        const nextFiles = [...state.files, optimisticItem].sort((a, b) =>
          a.Name.localeCompare(b.Name)
        );
        const nextFilesByProvider = { ...state.filesByProvider };
        if (resolvedProvider) {
          const existing = nextFilesByProvider[resolvedProvider] ?? [];
          nextFilesByProvider[resolvedProvider] = [...existing, optimisticItem].sort((a, b) =>
            a.Name.localeCompare(b.Name)
          );
        }
        return {
          files: nextFiles,
          filesByProvider: nextFilesByProvider,
        };
      });

      // 2. Asynchronous backend call
      try {
        const actualProvider = await createVaultFolder(
          folderPath,
          provider === "auto" ? undefined : provider
        );
        // If backend resolved to a different provider than optimistic guess, update attribution
        if (actualProvider && actualProvider !== resolvedProvider) {
          set((state) => {
            const updatedFiles = state.files.map((f) =>
              f.Path === folderPath && f.provider === resolvedProvider
                ? { ...f, provider: actualProvider }
                : f
            );
            const nextFilesByProvider = { ...state.filesByProvider };
            if (resolvedProvider && nextFilesByProvider[resolvedProvider]) {
              nextFilesByProvider[resolvedProvider] = nextFilesByProvider[
                resolvedProvider
              ].filter((f) => f.Path !== folderPath);
            }
            const existingActual = nextFilesByProvider[actualProvider] ?? [];
            nextFilesByProvider[actualProvider] = [
              ...existingActual,
              { ...optimisticItem, provider: actualProvider },
            ].sort((a, b) => a.Name.localeCompare(b.Name));
            return {
              files: updatedFiles,
              filesByProvider: nextFilesByProvider,
            };
          });
        }
        return actualProvider;
      } catch (err) {
        // 3. Rollback on failure
        const msg = err instanceof Error ? err.message : String(err);
        set((state) => {
          const rolledBackFiles = state.files.filter(
            (f) => !(f.Path === folderPath && f.provider === resolvedProvider)
          );
          const nextFilesByProvider = { ...state.filesByProvider };
          if (resolvedProvider && nextFilesByProvider[resolvedProvider]) {
            nextFilesByProvider[resolvedProvider] = nextFilesByProvider[
              resolvedProvider
            ].filter((f) => f.Path !== folderPath);
          }
          return {
            files: rolledBackFiles,
            filesByProvider: nextFilesByProvider,
            error: msg,
          };
        });
        throw err;
      }
    },

    removeProviderFiles: (provider: string) =>
      set((state) => {
        const nextFilesByProvider = { ...state.filesByProvider };
        delete nextFilesByProvider[provider];
        const nextErrors = { ...state.providerErrors };
        delete nextErrors[provider];
        const nextLoading = { ...state.providerLoading };
        delete nextLoading[provider];

        return {
          filesByProvider: nextFilesByProvider,
          providerErrors: nextErrors,
          providerLoading: nextLoading,
          files: mergeProviderFiles(nextFilesByProvider),
          mediaBaseUrl: null,
        };
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
          const files = await fetchVaultFiles(get().currentPath);
          set({
            files,
            filesByProvider: {},
            providerErrors: {},
            providerLoading: {},
            isLoading: false,
            isInitialLoading: false,
            isRevalidating: false,
            lastFetchedAt: Date.now(),
            mediaBaseUrl: null,
          });
        } catch (err) {
          set({
            files: [],
            filesByProvider: {},
            providerErrors: {},
            providerLoading: {},
            error: err instanceof Error ? err.message : String(err),
            isLoading: false,
            isInitialLoading: false,
            isRevalidating: false,
            mediaBaseUrl: null,
          });
        }
        return;
      }

      // Reconcile and prune any providers no longer connected
      const activeProviders = new Set(providers);
      set((state) => {
        const nextFilesByProvider: Record<string, RemoteVaultItem[]> = {};
        const nextErrors: Record<string, string | null> = {};
        const nextLoading: Record<string, boolean> = {};
        let changed = false;

        for (const p of Object.keys(state.filesByProvider)) {
          if (!activeProviders.has(p)) {
            changed = true;
          }
        }

        for (const [p, list] of Object.entries(state.filesByProvider)) {
          if (activeProviders.has(p)) {
            nextFilesByProvider[p] = list;
            nextErrors[p] = state.providerErrors[p] ?? null;
            nextLoading[p] = state.providerLoading[p] ?? false;
          }
        }

        return {
          filesByProvider: nextFilesByProvider,
          providerErrors: nextErrors,
          providerLoading: nextLoading,
          files: mergeProviderFiles(nextFilesByProvider),
          ...(changed ? { mediaBaseUrl: null } : {}),
        };
      });

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

      if (providers.length > 0 && !get().mediaBaseUrl) {
        get().ensureMediaBaseUrl().catch(() => {});
      }
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

  deleteFile: async (path: string, isDir: boolean, provider?: string) => {
    set({ error: null });
    try {
      await removeVaultItem(path, isDir, provider);
      clearShareLinkCache(path, provider);
      set((state) => {
        const nextFilesByProvider: Record<string, RemoteVaultItem[]> = {};
        for (const [p, list] of Object.entries(state.filesByProvider)) {
          if (!provider || p === provider) {
            nextFilesByProvider[p] = list.filter((f) => f.Path !== path);
          } else {
            nextFilesByProvider[p] = list;
          }
        }
        return {
          files: state.files.filter((f) => {
            if (f.Path !== path) return true;
            if (provider && f.provider && f.provider !== provider) return true;
            return false;
          }),
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
        destination,
        item.provider
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
