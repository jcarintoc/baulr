import { describe, it, expect, beforeEach, vi } from "vitest";
import { useViewStore } from "@/store/useViewStore";
import { useTransferStore } from "@/store/useTransferStore";
import { useThemeStore } from "@/store/useThemeStore";
import { useVaultStore } from "@/store/useVaultStore";
import { useRemoteFilesStore } from "@/store/useRemoteFilesStore";
import * as accountsApi from "@/lib/api/accounts";
import type { VaultQuota } from "@/lib/bindings";
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
      isDir: true,
      targetProvider: "Google Drive",
    });


    await startPromise;

    const updated = useTransferStore.getState().items;
    expect(updated[0].jobId).toBe(99);
    expect(updated[0].status).toBe("uploading");
    expect(updated[0].sizeBytes).toBe(5000);
    expect(updated[0].targetProvider).toBe("Google Drive");
  });

  it("enqueues multiple paths and processes them sequentially", async () => {
    vi.mocked(startOffloadJob)
      .mockResolvedValueOnce({
        jobId: 101,
        path: "/path/to/FirstFolder",
        name: "FirstFolder",
        sizeBytes: 1000,
        isDir: true,
        targetProvider: "OneDrive",
      })
      .mockResolvedValueOnce({
        jobId: 102,
        path: "/path/to/SecondFolder",
        name: "SecondFolder",
        sizeBytes: 2000,
        isDir: true,
        targetProvider: "Google Drive",
      });

    await useTransferStore.getState().enqueuePaths([
      "/path/to/FirstFolder",
      "/path/to/SecondFolder",
    ]);

    const state1 = useTransferStore.getState();
    expect(state1.items.length).toBe(2);
    expect(state1.items[0].jobId).toBe(101);
    expect(state1.items[0].status).toBe("uploading");
    expect(state1.items[1].status).toBe("queued");
    expect(state1.isTransferring).toBe(true);

    // Complete first job via progress event
    useTransferStore.getState().handleProgress({
      jobId: 101,
      name: "FirstFolder",
      transferredBytes: 1000,
      totalBytes: 1000,
      speedBytesPerSec: 0,
      etaSeconds: 0,
      status: "completed",
      error: null,
    });

    // Wait for async processNext to start second job
    await new Promise((r) => setTimeout(r, 0));

    // Second job should now have started
    const state2 = useTransferStore.getState();
    expect(state2.items[0].status).toBe("verified");
    expect(state2.items[1].jobId).toBe(102);
    expect(state2.items[1].status).toBe("uploading");
    expect(state2.isTransferring).toBe(true);

    // Complete second job
    useTransferStore.getState().handleProgress({
      jobId: 102,
      name: "SecondFolder",
      transferredBytes: 2000,
      totalBytes: 2000,
      speedBytesPerSec: 0,
      etaSeconds: 0,
      status: "completed",
      error: null,
    });

    await new Promise((r) => setTimeout(r, 0));

    const state3 = useTransferStore.getState();

    expect(state3.items.every((i) => i.status === "verified")).toBe(true);
    expect(state3.isVerified).toBe(true);
    expect(state3.isTransferring).toBe(false);
  });

  it("advances queue when an item encounters an error and allows dismissing failed items", async () => {
    vi.mocked(startOffloadJob)
      .mockRejectedValueOnce(new Error("Drive quota exceeded"))
      .mockResolvedValueOnce({
        jobId: 202,
        path: "/path/to/HealthyFolder",
        name: "HealthyFolder",
        sizeBytes: 500,
        isDir: true,
        targetProvider: null,
      });


    await useTransferStore.getState().enqueuePaths([
      "/path/to/FailingFolder",
      "/path/to/HealthyFolder",
    ]);

    const state = useTransferStore.getState();
    expect(state.items.length).toBe(2);
    const failedItem = state.items.find((i) => i.name === "FailingFolder");
    const healthyItem = state.items.find((i) => i.name === "HealthyFolder");

    expect(failedItem?.status).toBe("error");
    expect(failedItem?.error).toContain("Drive quota exceeded");
    expect(healthyItem?.status).toBe("uploading");
    expect(healthyItem?.jobId).toBe(202);

    // Dismiss failed item
    await useTransferStore.getState().removeItem(failedItem!.id);
    const updated = useTransferStore.getState();
    expect(updated.items.length).toBe(1);
    expect(updated.items[0].name).toBe("HealthyFolder");
  });

  it("passes targetProvider when enqueuing and processing items", async () => {
    vi.mocked(startOffloadJob).mockResolvedValueOnce({
      jobId: 301,
      path: "/path/to/SelectedFile.pdf",
      name: "SelectedFile.pdf",
      sizeBytes: 1500,
      isDir: false,
      targetProvider: "onedrive",
    });

    await useTransferStore.getState().enqueuePaths(
      ["/path/to/SelectedFile.pdf"],
      "onedrive"
    );

    expect(startOffloadJob).toHaveBeenCalledWith(
      "/path/to/SelectedFile.pdf",
      "onedrive"
    );
    const state = useTransferStore.getState();
    expect(state.items[0].targetProvider).toBe("onedrive");
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

  it("disconnectAccount clears files when no accounts remain connected", async () => {
    const emptyQuota = {
      totalBytes: 0,
      usedBytes: 0,
      freeBytes: 0,
      accounts: [
        {
          name: "Google Drive",
          provider: "gdrive",
          usedBytes: 0,
          totalBytes: 0,
          isConnected: false,
          needsAuth: false,
        },
      ],
    };
    vi.spyOn(accountsApi, "disconnectAccount").mockResolvedValueOnce(emptyQuota);
    useRemoteFilesStore.setState({
      files: [
        {
          Path: "doc.txt",
          Name: "doc.txt",
          Size: 10,
          MimeType: "text/plain",
          ModTime: null,
          IsDir: false,
        },
      ],
    });

    await useVaultStore.getState().disconnectAccount("gdrive");

    expect(useVaultStore.getState().quota).toEqual(emptyQuota);
    expect(useRemoteFilesStore.getState().files).toEqual([]);
  });

  it("calls removeProviderFiles on useRemoteFilesStore when disconnecting a provider while other accounts remain", async () => {
    const remainingQuota: VaultQuota = {
      totalBytes: 500,
      usedBytes: 10,
      freeBytes: 490,
      accounts: [
        { name: "Google Drive", provider: "gdrive", isConnected: true, needsAuth: false, usedBytes: 10, totalBytes: 500 },
        { name: "OneDrive", provider: "onedrive", isConnected: false, needsAuth: false, usedBytes: 0, totalBytes: 0 },
      ],
    };
    vi.spyOn(accountsApi, "disconnectAccount").mockResolvedValueOnce(remainingQuota);

    useRemoteFilesStore.setState({
      filesByProvider: {
        gdrive: [{ Path: "doc.txt", Name: "doc.txt", Size: 10, MimeType: "text/plain", ModTime: null, IsDir: false }],
        onedrive: [{ Path: "sheet.xlsx", Name: "sheet.xlsx", Size: 20, MimeType: "application/vnd.ms-excel", ModTime: null, IsDir: false }],
      },
      files: [
        { Path: "doc.txt", Name: "doc.txt", Size: 10, MimeType: "text/plain", ModTime: null, IsDir: false },
        { Path: "sheet.xlsx", Name: "sheet.xlsx", Size: 20, MimeType: "application/vnd.ms-excel", ModTime: null, IsDir: false },
      ],
    });

    await useVaultStore.getState().disconnectAccount("onedrive");

    expect(useVaultStore.getState().quota).toEqual(remainingQuota);
    expect(useRemoteFilesStore.getState().filesByProvider["onedrive"]).toBeUndefined();
    expect(useRemoteFilesStore.getState().files).toEqual([
      { Path: "doc.txt", Name: "doc.txt", Size: 10, MimeType: "text/plain", ModTime: null, IsDir: false, provider: "gdrive" },
    ]);
  });

  it("handles cancelOAuth properly", async () => {
    vi.spyOn(accountsApi, "cancelOAuth").mockResolvedValueOnce();
    useVaultStore.setState({ isAuthenticating: true, authenticatingProvider: "gdrive" });
    await useVaultStore.getState().cancelOAuth();
    expect(useVaultStore.getState().isAuthenticating).toBe(false);
    expect(useVaultStore.getState().authenticatingProvider).toBeNull();
  });
});




