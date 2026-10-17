import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchFileShareLink,
  clearShareLinkCache,
  fetchProviderVaultFiles,
} from "@/lib/api/browser";
import { commands } from "@/lib/bindings";

vi.mock("@/lib/bindings", () => ({
  commands: {
    getFileShareLink: vi.fn(),
    listProviderVaultFiles: vi.fn(),
  },
}));

describe("Browser API module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearShareLinkCache();
  });

  describe("fetchFileShareLink", () => {
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

    it("caches file share link in memory to eliminate repeat latency", async () => {
      vi.mocked(commands.getFileShareLink).mockResolvedValueOnce({
        status: "ok",
        data: "https://drive.google.com/file/d/cached123/view",
      });

      const link1 = await fetchFileShareLink("doc.pdf");
      const link2 = await fetchFileShareLink("doc.pdf");

      expect(link1).toBe("https://drive.google.com/file/d/cached123/view");
      expect(link2).toBe("https://drive.google.com/file/d/cached123/view");
      expect(commands.getFileShareLink).toHaveBeenCalledTimes(1);

      clearShareLinkCache("doc.pdf");
      vi.mocked(commands.getFileShareLink).mockResolvedValueOnce({
        status: "ok",
        data: "https://drive.google.com/file/d/cached123/view",
      });

      await fetchFileShareLink("doc.pdf");
      expect(commands.getFileShareLink).toHaveBeenCalledTimes(2);
    });
  });

  describe("fetchProviderVaultFiles", () => {
    it("fetches provider vault files via bindings", async () => {
      const mockFiles = [
        {
          Path: "doc.pdf",
          Name: "doc.pdf",
          Size: 1024,
          MimeType: "application/pdf",
          ModTime: null,
          IsDir: false,
        },
      ];
      vi.mocked(commands.listProviderVaultFiles).mockResolvedValueOnce({
        status: "ok",
        data: mockFiles,
      });

      const files = await fetchProviderVaultFiles("gdrive");
      expect(commands.listProviderVaultFiles).toHaveBeenCalledWith("gdrive");
      expect(files).toEqual(mockFiles);
    });

    it("throws error when listing provider files fails", async () => {
      vi.mocked(commands.listProviderVaultFiles).mockResolvedValueOnce({
        status: "error",
        error: "Provider not configured",
      });

      await expect(fetchProviderVaultFiles("unknown")).rejects.toThrow("Provider not configured");
    });
  });
});
