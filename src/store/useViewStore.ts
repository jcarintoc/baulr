import { create } from "zustand";

export type VaultView = "dashboard" | "files" | "settings";

interface ViewState {
  activeView: VaultView;
  previousView: "dashboard" | "files";
  setActiveView: (view: VaultView) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  activeView: "dashboard",
  previousView: "dashboard",
  setActiveView: (view) =>
    set((state) => ({
      activeView: view,
      previousView:
        state.activeView !== "settings"
          ? (state.activeView as "dashboard" | "files")
          : state.previousView,
    })),
}));
