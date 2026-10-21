import { create } from "zustand";

export type VaultTheme = "obsidian" | "titanium" | "bronze";

export interface ThemeConfig {
  id: VaultTheme;
  name: string;
  accentHex: string;
}

export const AVAILABLE_THEMES: ThemeConfig[] = [
  { id: "obsidian", name: "Obsidian", accentHex: "#10b981" },
  { id: "titanium", name: "Titanium", accentHex: "#0ea5e9" },
  { id: "bronze", name: "Bronze", accentHex: "#f59e0b" },
];

interface ThemeState {
  theme: VaultTheme;
  setTheme: (theme: VaultTheme) => void;
}

const getInitialTheme = (): VaultTheme => {
  if (typeof window === "undefined") return "obsidian";
  const saved = localStorage.getItem("baulr-theme") as VaultTheme;
  const theme = ["obsidian", "titanium", "bronze"].includes(saved) ? saved : "obsidian";
  document.documentElement.setAttribute("data-theme", theme);
  return theme;
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("baulr-theme", theme);
      document.documentElement.setAttribute("data-theme", theme);
    }
    set({ theme });
  },
}));
