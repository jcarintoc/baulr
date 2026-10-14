import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  inspectLocalPath,
  selectOffloadFolder,
  startOffloadJob,
  cancelOffloadJob,
} from "@/lib/api/offload";
import { commands } from "@/lib/bindings";

vi.mock("@/lib/bindings", () => ({
  commands: {
    inspectPath: vi.fn(),
    pickOffloadFolder: vi.fn(),
    startOffload: vi.fn(),
    cancelOffload: vi.fn(),
  },
}));

describe("Offload API module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inspects path successfully", async () => {
    vi.mocked(commands.inspectPath).mockResolvedValue({
      status: "ok",
      data: { path: "/test", name: "test", sizeBytes: 1024, isDir: true },
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

  it("starts offload job and returns job info", async () => {
    vi.mocked(commands.startOffload).mockResolvedValue({
      status: "ok",
      data: { jobId: 123, path: "/photos", name: "photos", sizeBytes: 5000 },
    });

    const result = await startOffloadJob("/photos");
    expect(result.jobId).toBe(123);
    expect(result.name).toBe("photos");
  });

  it("cancels offload job successfully", async () => {
    vi.mocked(commands.cancelOffload).mockResolvedValue({
      status: "ok",
      data: null,
    });

    await expect(cancelOffloadJob(123)).resolves.not.toThrow();
    expect(commands.cancelOffload).toHaveBeenCalledWith(123);
  });
});
