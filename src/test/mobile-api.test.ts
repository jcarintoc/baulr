import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  startMobileReceiver,
  stopMobileReceiver,
  getMobileReceiverStatus,
} from "@/lib/api/mobile";
import { commands } from "@/lib/bindings";

vi.mock("@/lib/bindings", () => ({
  commands: {
    startMobileReceiver: vi.fn(),
    stopMobileReceiver: vi.fn(),
    getMobileReceiverStatus: vi.fn(),
  },
}));

describe("Mobile API module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts mobile receiver and returns connection info", async () => {
    vi.mocked(commands.startMobileReceiver).mockResolvedValue({
      status: "ok",
      data: {
        url: "http://192.168.1.50:49200/?token=abc123xyz",
        ip: "192.168.1.50",
        port: 49200,
        token: "abc123xyz",
        qrSvg: "<svg></svg>",
        stagingDir: "/tmp/staging",
      },
    });

    const info = await startMobileReceiver();
    expect(info.url).toContain("http://192.168.1.50:49200");
    expect(info.port).toBe(49200);
    expect(info.qrSvg).toBe("<svg></svg>");
    expect(commands.startMobileReceiver).toHaveBeenCalledOnce();
  });

  it("throws clear error when starting receiver fails", async () => {
    vi.mocked(commands.startMobileReceiver).mockResolvedValue({
      status: "error",
      error: "Port binding failed",
    });

    await expect(startMobileReceiver()).rejects.toThrow("Port binding failed");
  });

  it("stops mobile receiver successfully", async () => {
    vi.mocked(commands.stopMobileReceiver).mockResolvedValue({
      status: "ok",
      data: null,
    });

    await expect(stopMobileReceiver()).resolves.not.toThrow();
    expect(commands.stopMobileReceiver).toHaveBeenCalledOnce();
  });

  it("gets mobile receiver status", async () => {
    vi.mocked(commands.getMobileReceiverStatus).mockResolvedValue({
      status: "ok",
      data: {
        isRunning: true,
        url: "http://192.168.1.50:49200/?token=test",
        port: 49200,
      },
    });

    const status = await getMobileReceiverStatus();
    expect(status.isRunning).toBe(true);
    expect(status.port).toBe(49200);
  });
});
