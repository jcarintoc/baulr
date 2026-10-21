import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchFileShareLink,
  clearShareLinkCache,
  fetchProviderVaultFiles,
  fetchVaultMediaBaseUrl,
  createVaultFolder,
} from "@/lib/api/browser";
import { commands } from "@/lib/bindings";

vi.mock("@/lib/bindings", () => ({
  commands: {
    getFileShareLink: vi.fn(),
    listProviderVaultFiles: vi.fn(),
    getVaultMediaBaseUrl: vi.fn(),
    createVaultFolder: vi.fn(),
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
      expect(commands.getFileShareLink).toHaveBeenCalledWith("Photos/summer.jpg", null);
    });

    it("fetches public share link targeted to specific provider", async () => {
      vi.mocked(commands.getFileShareLink).mockResolvedValue({
        status: "ok",
        data: "https://onedrive.live.com/test1234",
      });

      const link = await fetchFileShareLink("Photos/summer.jpg", "onedrive");
      expect(link).toBe("https://onedrive.live.com/test1234");
      expect(commands.getFileShareLink).toHaveBeenCalledWith("Photos/summer.jpg", "onedrive");
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
    it("fetches provider vault files via bindings with optional path", async () => {
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
      expect(commands.listProviderVaultFiles).toHaveBeenCalledWith("gdrive", null);
      expect(files).toEqual(mockFiles);

      vi.mocked(commands.listProviderVaultFiles).mockResolvedValueOnce({
        status: "ok",
        data: mockFiles,
      });
      await fetchProviderVaultFiles("gdrive", "Vacation");
      expect(commands.listProviderVaultFiles).toHaveBeenCalledWith("gdrive", "Vacation");
    });

    it("throws error when listing provider files fails", async () => {
      vi.mocked(commands.listProviderVaultFiles).mockResolvedValueOnce({
        status: "error",
        error: "Provider not configured",
      });

      await expect(fetchProviderVaultFiles("unknown")).rejects.toThrow("Provider not configured");
    });
  });

  describe("fetchVaultMediaBaseUrl", () => {
    it("returns base URL when available", async () => {
      vi.mocked(commands.getVaultMediaBaseUrl).mockResolvedValueOnce({
        status: "ok",
        data: "http://127.0.0.1:57104",
      });

      const url = await fetchVaultMediaBaseUrl();
      expect(url).toBe("http://127.0.0.1:57104");
    });
  });

  describe("createVaultFolder", () => {
    it("creates vault folder successfully without provider", async () => {
      vi.mocked(commands.createVaultFolder).mockResolvedValueOnce({
        status: "ok",
        data: "gdrive",
      });

      const res = await createVaultFolder("Documents/Projects");
      expect(commands.createVaultFolder).toHaveBeenCalledWith("Documents/Projects", null);
      expect(res).toBe("gdrive");
    });

    it("creates vault folder targeted to specific provider", async () => {
      vi.mocked(commands.createVaultFolder).mockResolvedValueOnce({
        status: "ok",
        data: "onedrive",
      });

      const res = await createVaultFolder("Documents/Projects", "onedrive");
      expect(commands.createVaultFolder).toHaveBeenCalledWith("Documents/Projects", "onedrive");
      expect(res).toBe("onedrive");
    });

    it("throws error when creating folder fails", async () => {
      vi.mocked(commands.createVaultFolder).mockResolvedValueOnce({
        status: "error",
        error: "Folder name contains special characters",
      });

      await expect(createVaultFolder("Documents/Invalid:Name")).rejects.toThrow(
        "Folder name contains special characters"
      );
    });
  });
});
