import { create } from "zustand";

export interface RemoteVaultFile {
  id: string;
  name: string;
  sizeBytes: number;
  provider: "Google Drive" | "OneDrive";
  modifiedAt: string;
}

interface RemoteFilesState {
  files: RemoteVaultFile[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  deleteToCloudTrash: (id: string) => void;
}

export const useRemoteFilesStore = create<RemoteFilesState>((set) => ({
  files: [
    {
      id: "f-1",
      name: "Family_Vacation_Archive_2025.zip",
      sizeBytes: 1024 * 1024 * 1024 * 2.8,
      provider: "Google Drive",
      modifiedAt: "2026-10-10",
    },
    {
      id: "f-2",
      name: "Lightroom_Raw_Catalog.dmg",
      sizeBytes: 1024 * 1024 * 1024 * 1.4,
      provider: "OneDrive",
      modifiedAt: "2026-10-08",
    },
    {
      id: "f-3",
      name: "Taxes_and_Legal_Docs_2024.pdf",
      sizeBytes: 1024 * 1024 * 24.5,
      provider: "Google Drive",
      modifiedAt: "2026-09-28",
    },
  ],
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  deleteToCloudTrash: (id) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
    })),
}));
