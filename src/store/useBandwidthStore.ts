import { create } from "zustand";
import { fetchBandwidthLimit, updateBandwidthLimit } from "../lib/api/bandwidth";

export const STORAGE_KEY = "baulr:bandwidth_limit";

export function formatBandwidthLabel(rate: string): string {
  const match = rate?.match(/^(\d+)[Mm]/);
  return match ? `${match[1]} MB/s` : "Unlimited";
}

interface BandwidthState {
  currentRate: string;
  displayLabel: string;
  isLoading: boolean;
  error: string | null;
  init: () => Promise<void>;
  setLimit: (rate: string) => Promise<void>;
}

export const useBandwidthStore = create<BandwidthState>((set, get) => ({
  currentRate: "off",
  displayLabel: "Unlimited",
  isLoading: false,
  error: null,

  init: async () => {
    const savedRate = localStorage.getItem(STORAGE_KEY);
    if (savedRate && savedRate !== "off") {
      return get().setLimit(savedRate);
    }

    try {
      set({ isLoading: true, error: null });
      const res = await fetchBandwidthLimit();
      set({
        currentRate: res.rate,
        displayLabel: formatBandwidthLabel(res.rate),
        isLoading: false,
      });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  setLimit: async (rate: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await updateBandwidthLimit(rate);
      localStorage.setItem(STORAGE_KEY, res.rate);
      set({
        currentRate: res.rate,
        displayLabel: formatBandwidthLabel(res.rate),
        isLoading: false,
      });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },
}));
