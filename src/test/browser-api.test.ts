import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchFileShareLink } from "@/lib/api/browser";
import { commands } from "@/lib/bindings";

vi.mock("@/lib/bindings", () => ({
  commands: {
    getFileShareLink: vi.fn(),
  },
}));

describe("Browser API module - fetchFileShareLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches public share link for a file path", async () => {
    vi.mocked(commands.getFileShareLink).mockResolvedValue({
      status: "ok",
      data: "https://drive.google.com/file/d/test1234/view?usp=sharing",
    });

    const link = await fetchFileShareLink("Photos/summer.jpg");
    expect(link).toBe("https://drive.google.com/file/d/test1234/view?usp=sharing");
    expect(commands.getFileShareLink).toHaveBeenCalledWith("Photos/summer.jpg");
  });

  it("throws error when fetching public share link fails", async () => {
    vi.mocked(commands.getFileShareLink).mockResolvedValue({
      status: "error",
      error: "Provider does not support sharing",
    });

    await expect(fetchFileShareLink("Photos/summer.jpg")).rejects.toThrow(
      "Provider does not support sharing"
    );
  });
});
