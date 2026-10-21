import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useBandwidthStore,
  formatBandwidthLabel,
  STORAGE_KEY,
} from "@/store/useBandwidthStore";
import * as bandwidthApi from "@/lib/api/bandwidth";

vi.mock("@/lib/api/bandwidth", () => ({
  fetchBandwidthLimit: vi.fn(),
  updateBandwidthLimit: vi.fn(),
}));

describe("useBandwidthStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useBandwidthStore.setState({
      currentRate: "off",
      displayLabel: "Unlimited",
      isLoading: false,
      error: null,
    });
  });

  describe("formatBandwidthLabel helper", () => {
    it("formats off and empty as Unlimited", () => {
      expect(formatBandwidthLabel("off")).toBe("Unlimited");
      expect(formatBandwidthLabel("")).toBe("Unlimited");
    });

    it("formats upload:download MB/s correctly", () => {
      expect(formatBandwidthLabel("10M:off")).toBe("10 MB/s");
      expect(formatBandwidthLabel("25M:off")).toBe("25 MB/s");
      expect(formatBandwidthLabel("5m:off")).toBe("5 MB/s");
    });
  });

  describe("store actions", () => {
    it("initializes from daemon query when no localStorage item exists", async () => {
      vi.mocked(bandwidthApi.fetchBandwidthLimit).mockResolvedValue({
        rate: "off",
      });

      await useBandwidthStore.getState().init();

      expect(useBandwidthStore.getState().currentRate).toBe("off");
      expect(useBandwidthStore.getState().displayLabel).toBe("Unlimited");
      expect(bandwidthApi.fetchBandwidthLimit).toHaveBeenCalledOnce();
    });

    it("restores and applies saved limit from localStorage on init", async () => {
      localStorage.setItem(STORAGE_KEY, "10M:off");

      vi.mocked(bandwidthApi.updateBandwidthLimit).mockResolvedValue({
        rate: "10M:off",
      });

      await useBandwidthStore.getState().init();

      expect(useBandwidthStore.getState().currentRate).toBe("10M:off");
      expect(useBandwidthStore.getState().displayLabel).toBe("10 MB/s");
      expect(bandwidthApi.updateBandwidthLimit).toHaveBeenCalledWith("10M:off");
    });

    it("sets new limit, updates state, and saves to localStorage", async () => {
      vi.mocked(bandwidthApi.updateBandwidthLimit).mockResolvedValue({
        rate: "5M:off",
      });

      await useBandwidthStore.getState().setLimit("5M:off");

      expect(useBandwidthStore.getState().currentRate).toBe("5M:off");
      expect(useBandwidthStore.getState().displayLabel).toBe("5 MB/s");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("5M:off");
    });

    it("records error when setting limit fails", async () => {
      vi.mocked(bandwidthApi.updateBandwidthLimit).mockRejectedValue(
        new Error("Engine not ready")
      );

      await useBandwidthStore.getState().setLimit("10M:off");

      expect(useBandwidthStore.getState().error).toBe("Error: Engine not ready");
      expect(useBandwidthStore.getState().isLoading).toBe(false);
    });
  });
});
