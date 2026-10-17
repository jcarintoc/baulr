import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchBandwidthLimit, updateBandwidthLimit } from "@/lib/api/bandwidth";
import { commands } from "@/lib/bindings";

vi.mock("@/lib/bindings", () => ({
  commands: {
    getBandwidthLimit: vi.fn(),
    setBandwidthLimit: vi.fn(),
  },
}));

describe("Bandwidth API module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches active bandwidth limit successfully", async () => {
    vi.mocked(commands.getBandwidthLimit).mockResolvedValue({
      status: "ok",
      data: {
        rate: "10M:off",
      },
    });

    const limit = await fetchBandwidthLimit();
    expect(limit.rate).toBe("10M:off");
    expect(commands.getBandwidthLimit).toHaveBeenCalledOnce();
  });

  it("throws clear error when fetching bandwidth limit fails", async () => {
    vi.mocked(commands.getBandwidthLimit).mockResolvedValue({
      status: "error",
      error: "Daemon unreachable",
    });

    await expect(fetchBandwidthLimit()).rejects.toThrow("Daemon unreachable");
  });

  it("updates bandwidth limit successfully", async () => {
    vi.mocked(commands.setBandwidthLimit).mockResolvedValue({
      status: "ok",
      data: {
        rate: "25M:off",
      },
    });

    const updated = await updateBandwidthLimit("25M:off");
    expect(updated.rate).toBe("25M:off");
    expect(commands.setBandwidthLimit).toHaveBeenCalledWith("25M:off");
  });

  it("throws clear error when setting bandwidth limit fails", async () => {
    vi.mocked(commands.setBandwidthLimit).mockResolvedValue({
      status: "error",
      error: "Invalid rate specified",
    });

    await expect(updateBandwidthLimit("bad-rate")).rejects.toThrow(
      "Invalid rate specified"
    );
  });
});
