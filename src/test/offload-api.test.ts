import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  inspectLocalPath,
  selectOffloadFolder,
  selectOffloadFiles,
  startOffloadJob,
  cancelOffloadJob,
  reclaimPaths,
} from "@/lib/api/offload";
import { commands } from "@/lib/bindings";

vi.mock("@/lib/bindings", () => ({
  commands: {
    inspectPath: vi.fn(),
    pickOffloadFolder: vi.fn(),
    pickOffloadFiles: vi.fn(),
    startOffload: vi.fn(),
    cancelOffload: vi.fn(),
    reclaimPaths: vi.fn(),
  },
}));

describe("Offload API module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inspects path successfully", async () => {
    vi.mocked(commands.inspectPath).mockResolvedValue({
      status: "ok",
      data: { path: "/test", name: "test", sizeBytes: 1024, isDir: true, maxFileBytes: 1024 },
    });

    const result = await inspectLocalPath("/test");
    expect(result.name).toBe("test");
    expect(result.sizeBytes).toBe(1024);
    expect(result.isDir).toBe(true);
  });

  it("throws clear error when inspect fails", async () => {
    vi.mocked(commands.inspectPath).mockResolvedValue({
      status: "error",
      error: "Path not found",
    });

    await expect(inspectLocalPath("/missing")).rejects.toThrow("Path not found");
  });

  it("picks folder and returns null if canceled", async () => {
    vi.mocked(commands.pickOffloadFolder).mockResolvedValue({
      status: "ok",
      data: null,
    });

    const result = await selectOffloadFolder();
    expect(result).toBeNull();
  });

  it("picks files and returns path array or null if canceled", async () => {
    vi.mocked(commands.pickOffloadFiles).mockResolvedValueOnce({
      status: "ok",
      data: ["/docs/file1.pdf", "/docs/file2.png"],
    });

    const result = await selectOffloadFiles();
    expect(result).toEqual(["/docs/file1.pdf", "/docs/file2.png"]);

    vi.mocked(commands.pickOffloadFiles).mockResolvedValueOnce({
      status: "ok",
      data: null,
    });
    expect(await selectOffloadFiles()).toBeNull();
  });

  it("starts offload job and returns job info", async () => {
    vi.mocked(commands.startOffload).mockResolvedValue({
      status: "ok",
      data: {
        jobId: 123,
        path: "/photos",
        name: "photos",
        sizeBytes: 5000,
        targetProvider: "Google Drive",
        isDir: true,
      },
    });

    const result = await startOffloadJob("/photos");
    expect(result.jobId).toBe(123);
    expect(result.name).toBe("photos");
    expect(result.targetProvider).toBe("Google Drive");
    expect(commands.startOffload).toHaveBeenCalledWith("/photos", null, null);
  });

  it("starts offload job with explicit target provider", async () => {
    vi.mocked(commands.startOffload).mockResolvedValue({
      status: "ok",
      data: {
        jobId: 124,
        path: "/docs",
        name: "docs",
        sizeBytes: 2000,
        targetProvider: "onedrive",
        isDir: false,
      },
    });

    const result = await startOffloadJob("/docs", "onedrive");
    expect(result.jobId).toBe(124);
    expect(commands.startOffload).toHaveBeenCalledWith("/docs", "onedrive", null);
  });

  it("starts offload job with explicit target directory", async () => {
    vi.mocked(commands.startOffload).mockResolvedValue({
      status: "ok",
      data: {
        jobId: 125,
        path: "/docs/tax.pdf",
        name: "tax.pdf",
        sizeBytes: 1000,
        targetProvider: "auto",
        isDir: false,
      },
    });

    await startOffloadJob("/docs/tax.pdf", null, "Finances/2026");
    expect(commands.startOffload).toHaveBeenCalledWith("/docs/tax.pdf", null, "Finances/2026");
  });

  it("cancels offload job successfully", async () => {
    vi.mocked(commands.cancelOffload).mockResolvedValue({
      status: "ok",
      data: null,
    });

    await expect(cancelOffloadJob(123)).resolves.not.toThrow();
    expect(commands.cancelOffload).toHaveBeenCalledWith(123);
  });

  it("reclaims paths successfully", async () => {
    vi.mocked(commands.reclaimPaths).mockResolvedValue({
      status: "ok",
      data: { reclaimedBytes: 1024, count: 1 },
    });

    const result = await reclaimPaths(["/test/path"]);
    expect(result.count).toBe(1);
    expect(result.reclaimedBytes).toBe(1024);
    expect(commands.reclaimPaths).toHaveBeenCalledWith(["/test/path"]);
  });
});
