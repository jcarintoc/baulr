import { create } from "zustand";

export type VaultView = "dashboard" | "files";

interface ViewState {
  activeView: VaultView;
  setActiveView: (view: VaultView) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  activeView: "dashboard",
  setActiveView: (view) => set({ activeView: view }),
}));
