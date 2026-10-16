import { create } from "zustand";
import {
  RemoteVaultItem,
  DownloadProgress,
  fetchVaultFiles,
  removeVaultItem,
  downloadVaultItemToDirectory,
  pickDownloadDestination,
} from "@/lib/api/browser";

export type { RemoteVaultItem, DownloadProgress };

export interface RemoteFilesState {
  files: RemoteVaultItem[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  activeDownloads: Record<string, DownloadProgress>;
  setSearchQuery: (searchQuery: string) => void;
  fetchFiles: () => Promise<void>;
  clearFiles: () => void;
  deleteFile: (path: string, isDir: boolean) => Promise<void>;
  downloadFile: (item: RemoteVaultItem) => Promise<void>;
  handleDownloadProgress: (progress: DownloadProgress) => void;
  dismissDownload: (path: string) => void;
}

export const useRemoteFilesStore = create<RemoteFilesState>((set) => ({
  files: [],
  isLoading: false,
  error: null,
  searchQuery: "",
  activeDownloads: {},

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  clearFiles: () => set({ files: [], error: null }),

  fetchFiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const files = await fetchVaultFiles();
      set({ files, isLoading: false });
    } catch (err) {
      set({
        files: [],
        error: err instanceof Error ? err.message : String(err),
        isLoading: false,
      });
    }
  },

  deleteFile: async (path: string, isDir: boolean) => {
    set({ error: null });
    try {
      await removeVaultItem(path, isDir);
      set((state) => ({
        files: state.files.filter((f) => f.Path !== path),
      }));
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

      await downloadVaultItemToDirectory(item.Path, item.Name, item.IsDir, destination);
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
}));
