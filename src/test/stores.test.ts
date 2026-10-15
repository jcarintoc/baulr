import { describe, it, expect, beforeEach, vi } from "vitest";
import { useViewStore } from "@/store/useViewStore";
import { useTransferStore } from "@/store/useTransferStore";
import { useThemeStore } from "@/store/useThemeStore";
import { useVaultStore } from "@/store/useVaultStore";
import * as accountsApi from "@/lib/api/accounts";
import { startOffloadJob } from "@/lib/api/offload";

vi.mock("@/lib/api/offload", () => ({
  startOffloadJob: vi.fn(),
  cancelOffloadJob: vi.fn(),
}));

describe("useViewStore", () => {
  beforeEach(() => {
    useViewStore.setState({ activeView: "dashboard" });
  });

  it("defaults to dashboard view and updates view", () => {
    expect(useViewStore.getState().activeView).toBe("dashboard");
    useViewStore.getState().setActiveView("files");
    expect(useViewStore.getState().activeView).toBe("files");
  });
});

describe("useTransferStore", () => {
  beforeEach(() => {
    useTransferStore.getState().clearCompleted();
  });

  it("updates item on live progress event", () => {
    useTransferStore.setState({
      items: [
        {
          id: "job-42",
          jobId: 42,
          path: "/path/Photos",
          name: "Photos",
          sizeBytes: 1000,
          transferredBytes: 0,
          speedBytesPerSec: 0,
          etaSeconds: 0,
          status: "uploading",
        },
      ],
      isTransferring: true,
    });

    useTransferStore.getState().handleProgress({
      jobId: 42,
      name: "Photos",
      transferredBytes: 500,
      totalBytes: 1000,
      speedBytesPerSec: 250,
      etaSeconds: 2,
      status: "uploading",
      error: null,
    });

    const item = useTransferStore.getState().items.find((i) => i.jobId === 42);
    expect(item).toBeDefined();
    expect(item?.transferredBytes).toBe(500);
    expect(item?.status).toBe("uploading");
    expect(item?.speedBytesPerSec).toBe(250);
  });

  it("marks verified when offload progress completes", () => {
    useTransferStore.setState({
      items: [
        {
          id: "job-42",
          jobId: 42,
          path: "/path/Photos",
          name: "Photos",
          sizeBytes: 1000,
          transferredBytes: 0,
          speedBytesPerSec: 0,
          etaSeconds: 0,
          status: "uploading",
        },
      ],
      isTransferring: true,
    });

    useTransferStore.getState().handleProgress({
      jobId: 42,
      name: "Photos",
      transferredBytes: 1000,
      totalBytes: 1000,
      speedBytesPerSec: 0,
      etaSeconds: 0,
      status: "completed",
      error: null,
    });

    const state = useTransferStore.getState();
    const item = state.items.find((i) => i.jobId === 42);
    expect(item?.status).toBe("verified");
    expect(state.isVerified).toBe(true);
    expect(state.isTransferring).toBe(false);
  });

  it("optimistically enqueues preparing state when starting offload", async () => {
    let resolveJob: (value: any) => void = () => {};
    const promise = new Promise((resolve) => {
      resolveJob = resolve;
    });
    vi.mocked(startOffloadJob).mockReturnValue(promise as any);

    const startPromise = useTransferStore.getState().startOffload("/path/to/MyFolder");

    // Instantly should be in items with status 'preparing'
    const items = useTransferStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].name).toBe("MyFolder");
    expect(items[0].status).toBe("preparing");
    expect(useTransferStore.getState().isTransferring).toBe(true);

    // Resolve job
    resolveJob({
      jobId: 99,
      path: "/path/to/MyFolder",
      name: "MyFolder",
      sizeBytes: 5000,
      targetProvider: "Google Drive",
    });

    await startPromise;

    const updated = useTransferStore.getState().items;
    expect(updated[0].jobId).toBe(99);
    expect(updated[0].status).toBe("uploading");
    expect(updated[0].sizeBytes).toBe(5000);
    expect(updated[0].targetProvider).toBe("Google Drive");
  });
});

describe("useThemeStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.getState().setTheme("obsidian");
  });

  it("defaults to obsidian theme and syncs html attribute", () => {
    expect(useThemeStore.getState().theme).toBe("obsidian");
    expect(document.documentElement.getAttribute("data-theme")).toBe("obsidian");
  });

  it("switches theme to titanium and persists to localStorage", () => {
    useThemeStore.getState().setTheme("titanium");
    expect(useThemeStore.getState().theme).toBe("titanium");
    expect(localStorage.getItem("baulr-theme")).toBe("titanium");
    expect(document.documentElement.getAttribute("data-theme")).toBe("titanium");
  });

  it("switches theme to bronze and persists to localStorage", () => {
    useThemeStore.getState().setTheme("bronze");
    expect(useThemeStore.getState().theme).toBe("bronze");
    expect(localStorage.getItem("baulr-theme")).toBe("bronze");
    expect(document.documentElement.getAttribute("data-theme")).toBe("bronze");
  });
});

describe("useVaultStore", () => {
  beforeEach(() => {
    useVaultStore.setState({
      quota: null,
      isLoading: false,
      isAuthenticating: false,
      authenticatingProvider: null,
      error: null,
    });
  });

  it("handles initial state and authenticating state transitions", () => {
    const state = useVaultStore.getState();
    expect(state.isAuthenticating).toBe(false);
    expect(state.authenticatingProvider).toBeNull();
    expect(state.quota).toBeNull();
  });

  it("connectAccount updates quota and resets authenticating state on success", async () => {
    const mockQuota = {
      totalBytes: 15000000000,
      usedBytes: 5000000000,
      freeBytes: 10000000000,
      accounts: [
        {
          name: "Google Drive",
          provider: "gdrive",
          usedBytes: 5000000000,
          totalBytes: 15000000000,
          isConnected: true,
          needsAuth: false,
        },
      ],
    };
    vi.spyOn(accountsApi, "connectAccount").mockResolvedValueOnce(mockQuota);

    await useVaultStore.getState().connectAccount("gdrive");

    const state = useVaultStore.getState();
    expect(state.isAuthenticating).toBe(false);
    expect(state.authenticatingProvider).toBeNull();
    expect(state.quota).toEqual(mockQuota);
    expect(state.error).toBeNull();
  });

  it("handles cancelOAuth properly", async () => {
    vi.spyOn(accountsApi, "cancelOAuth").mockResolvedValueOnce();
    useVaultStore.setState({ isAuthenticating: true, authenticatingProvider: "gdrive" });
    await useVaultStore.getState().cancelOAuth();
    expect(useVaultStore.getState().isAuthenticating).toBe(false);
    expect(useVaultStore.getState().authenticatingProvider).toBeNull();
  });
});




