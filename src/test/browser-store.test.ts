import { describe, it, expect, beforeEach, vi } from "vitest";
import { useRemoteFilesStore } from "@/store/useRemoteFilesStore";
import { useVaultStore } from "@/store/useVaultStore";
import * as browserApi from "@/lib/api/browser";

vi.mock("@/lib/api/browser", () => ({
  fetchVaultFiles: vi.fn(),
  fetchProviderVaultFiles: vi.fn(),
  removeVaultItem: vi.fn(),
  createVaultFolder: vi.fn(),
  downloadVaultItemToDirectory: vi.fn(),
  pickDownloadDestination: vi.fn(),
  clearShareLinkCache: vi.fn(),
}));

describe("useRemoteFilesStore actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRemoteFilesStore.setState({
      files: [],
      filesByProvider: {},
      providerErrors: {},
      providerLoading: {},
      isLoading: false,
      isInitialLoading: false,
      isRevalidating: false,
      lastFetchedAt: null,
      error: null,
      searchQuery: "",
      activeDownloads: {},
    });
    useVaultStore.setState({
      quota: null,
    });
  });

  it("fetches vault files successfully via fallback when no connected accounts are known", async () => {
    const mockFiles = [
      {
        Path: "report.pdf",
        Name: "report.pdf",
        Size: 2048,
        MimeType: "application/pdf",
        ModTime: "2026-10-15T12:00:00Z",
        IsDir: false,
      },
    ];
    vi.mocked(browserApi.fetchVaultFiles).mockResolvedValueOnce(mockFiles);

    await useRemoteFilesStore.getState().fetchFiles();

    const state = useRemoteFilesStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.files).toEqual(mockFiles);
  });

  it("sets error and clears existing stale files when fallback fetch fails", async () => {
    useRemoteFilesStore.setState({
      files: [
        {
          Path: "stale.pdf",
          Name: "stale.pdf",
          Size: 100,
          MimeType: "application/pdf",
          ModTime: null,
          IsDir: false,
        },
      ],
    });

    vi.mocked(browserApi.fetchVaultFiles).mockRejectedValueOnce(new Error("Connection error"));

    await useRemoteFilesStore.getState().fetchFiles();

    const state = useRemoteFilesStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe("Connection error");
    expect(state.files).toEqual([]);
  });

  it("progressively loads files from multiple providers and merges them", async () => {
    useVaultStore.setState({
      quota: {
        totalBytes: 1000,
        usedBytes: 500,
        freeBytes: 500,
        accounts: [
          { name: "Google Drive", provider: "gdrive", isConnected: true, needsAuth: false, usedBytes: 200, totalBytes: 500 },
          { name: "OneDrive", provider: "onedrive", isConnected: true, needsAuth: false, usedBytes: 300, totalBytes: 500 },
        ],
      },
    });

    let resolveGdrive: (items: browserApi.RemoteVaultItem[]) => void = () => {};
    const gdrivePromise = new Promise<browserApi.RemoteVaultItem[]>((resolve) => {
      resolveGdrive = resolve;
    });

    vi.mocked(browserApi.fetchProviderVaultFiles).mockImplementation((provider) => {
      if (provider === "gdrive") return gdrivePromise;
      return Promise.resolve([
        { Path: "b_one.docx", Name: "b_one.docx", Size: 50, MimeType: "", ModTime: null, IsDir: false },
      ]);
    });

    const fetchPromise = useRemoteFilesStore.getState().fetchFiles();

    // OneDrive finishes first
    await new Promise((r) => setTimeout(r, 10));
    expect(useRemoteFilesStore.getState().files.map((f) => f.Name)).toEqual(["b_one.docx"]);
    expect(useRemoteFilesStore.getState().providerLoading["onedrive"]).toBe(false);
    expect(useRemoteFilesStore.getState().providerLoading["gdrive"]).toBe(true);

    // Gdrive finishes second
    resolveGdrive([
      { Path: "a_gdoc.pdf", Name: "a_gdoc.pdf", Size: 100, MimeType: "", ModTime: null, IsDir: false },
    ]);
    await fetchPromise;

    expect(useRemoteFilesStore.getState().files.map((f) => f.Name)).toEqual(["a_gdoc.pdf", "b_one.docx"]);
    expect(useRemoteFilesStore.getState().providerLoading["gdrive"]).toBe(false);
  });

  it("isolates provider failure: displays healthy provider files and records failure error", async () => {
    useVaultStore.setState({
      quota: {
        totalBytes: 1000,
        usedBytes: 500,
        freeBytes: 500,
        accounts: [
          { name: "Google Drive", provider: "gdrive", isConnected: true, needsAuth: false, usedBytes: 200, totalBytes: 500 },
          { name: "OneDrive", provider: "onedrive", isConnected: true, needsAuth: false, usedBytes: 300, totalBytes: 500 },
        ],
      },
    });

    vi.mocked(browserApi.fetchProviderVaultFiles).mockImplementation((provider) => {
      if (provider === "onedrive") return Promise.reject(new Error("Connection timed out"));
      return Promise.resolve([
        { Path: "gdoc.pdf", Name: "gdoc.pdf", Size: 100, MimeType: "", ModTime: null, IsDir: false },
      ]);
    });

    await useRemoteFilesStore.getState().fetchFiles();

    const state = useRemoteFilesStore.getState();
    expect(state.files.map((f) => f.Name)).toEqual(["gdoc.pdf"]);
    expect(state.providerErrors["onedrive"]).toBe("Connection timed out");
    expect(state.providerErrors["gdrive"]).toBeNull();
  });

  it("allows retrying only the failing provider", async () => {
    useRemoteFilesStore.setState({
      files: [
        { Path: "gdoc.pdf", Name: "gdoc.pdf", Size: 100, MimeType: "", ModTime: null, IsDir: false },
      ],
      filesByProvider: {
        gdrive: [{ Path: "gdoc.pdf", Name: "gdoc.pdf", Size: 100, MimeType: "", ModTime: null, IsDir: false }],
        onedrive: [],
      },
      providerErrors: {
        onedrive: "Connection timed out",
      },
      providerLoading: {
        onedrive: false,
      },
    });

    vi.mocked(browserApi.fetchProviderVaultFiles).mockResolvedValueOnce([
      { Path: "one.docx", Name: "one.docx", Size: 50, MimeType: "", ModTime: null, IsDir: false },
    ]);

    await useRemoteFilesStore.getState().retryProvider("onedrive");

    const state = useRemoteFilesStore.getState();
    expect(state.providerErrors["onedrive"]).toBeNull();
    expect(state.files.map((f) => f.Name)).toEqual(["gdoc.pdf", "one.docx"]);
  });

  it("skips prefetch if files were fetched within 30s TTL", () => {
    const fetchSpy = vi.spyOn(useRemoteFilesStore.getState(), "fetchFiles");
    useRemoteFilesStore.setState({ lastFetchedAt: Date.now() - 5_000, isLoading: false });

    useRemoteFilesStore.getState().prefetchFiles();
    expect(fetchSpy).not.toHaveBeenCalled();

    useRemoteFilesStore.setState({ lastFetchedAt: Date.now() - 35_000 });
    useRemoteFilesStore.getState().prefetchFiles();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("stale-while-revalidate keeps existing files visible while revalidating", async () => {
    const cachedFiles = [
      { Path: "cached.pdf", Name: "cached.pdf", Size: 100, MimeType: "", ModTime: null, IsDir: false },
    ];
    useRemoteFilesStore.setState({
      files: cachedFiles,
      lastFetchedAt: Date.now() - 40_000,
    });

    vi.mocked(browserApi.fetchVaultFiles).mockImplementation(async () => {
      expect(useRemoteFilesStore.getState().files).toEqual(cachedFiles);
      expect(useRemoteFilesStore.getState().isInitialLoading).toBe(false);
      return cachedFiles;
    });

    await useRemoteFilesStore.getState().fetchFiles();
  });

  it("clearFiles resets files, provider state, and error", () => {
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
      filesByProvider: {
        gdrive: [{ Path: "doc.txt", Name: "doc.txt", Size: 10, MimeType: "text/plain", ModTime: null, IsDir: false }],
      },
      providerErrors: { gdrive: "Error" },
      error: "Previous error",
      lastFetchedAt: 12345,
    });

    useRemoteFilesStore.getState().clearFiles();

    const state = useRemoteFilesStore.getState();
    expect(state.files).toEqual([]);
    expect(state.filesByProvider).toEqual({});
    expect(state.providerErrors).toEqual({});
    expect(state.error).toBeNull();
    expect(state.lastFetchedAt).toBeNull();
  });

  it("deletes file from cloud vault and updates store", async () => {
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
        {
          Path: "photos",
          Name: "photos",
          Size: -1,
          MimeType: "inode/directory",
          ModTime: null,
          IsDir: true,
        },
      ],
      filesByProvider: {
        gdrive: [
          { Path: "doc.txt", Name: "doc.txt", Size: 10, MimeType: "text/plain", ModTime: null, IsDir: false },
        ],
      },
    });

    vi.mocked(browserApi.removeVaultItem).mockResolvedValueOnce();

    await useRemoteFilesStore.getState().deleteFile("doc.txt", false);

    expect(browserApi.removeVaultItem).toHaveBeenCalledWith("doc.txt", false, undefined);
    expect(browserApi.clearShareLinkCache).toHaveBeenCalledWith("doc.txt", undefined);
    const files = useRemoteFilesStore.getState().files;
    expect(files.length).toBe(1);
    expect(files[0].Path).toBe("photos");
  });

  it("downloads file when user selects destination", async () => {
    vi.mocked(browserApi.pickDownloadDestination).mockResolvedValueOnce("/Users/mockuser/Downloads");
    vi.mocked(browserApi.downloadVaultItemToDirectory).mockResolvedValueOnce(101);

    const item = {
      Path: "doc.txt",
      Name: "doc.txt",
      Size: 10,
      MimeType: "text/plain",
      ModTime: null,
      IsDir: false,
    };

    await useRemoteFilesStore.getState().downloadFile(item);

    expect(browserApi.pickDownloadDestination).toHaveBeenCalled();
    expect(browserApi.downloadVaultItemToDirectory).toHaveBeenCalledWith(
      "doc.txt",
      "doc.txt",
      false,
      "/Users/mockuser/Downloads",
      undefined
    );
  });

  it("aborts download if user cancels folder picker", async () => {
    vi.mocked(browserApi.pickDownloadDestination).mockResolvedValueOnce(null);

    const item = {
      Path: "doc.txt",
      Name: "doc.txt",
      Size: 10,
      MimeType: "text/plain",
      ModTime: null,
      IsDir: false,
    };

    await useRemoteFilesStore.getState().downloadFile(item);

    expect(browserApi.pickDownloadDestination).toHaveBeenCalled();
    expect(browserApi.downloadVaultItemToDirectory).not.toHaveBeenCalled();
  });

  it("removes provider files and re-merges when removeProviderFiles is called", () => {
    useRemoteFilesStore.setState({
      filesByProvider: {
        gdrive: [{ Path: "doc.txt", Name: "doc.txt", Size: 10, MimeType: "text/plain", ModTime: null, IsDir: false }],
        onedrive: [{ Path: "sheet.xlsx", Name: "sheet.xlsx", Size: 20, MimeType: "application/vnd.ms-excel", ModTime: null, IsDir: false }],
      },
      files: [
        { Path: "doc.txt", Name: "doc.txt", Size: 10, MimeType: "text/plain", ModTime: null, IsDir: false },
        { Path: "sheet.xlsx", Name: "sheet.xlsx", Size: 20, MimeType: "application/vnd.ms-excel", ModTime: null, IsDir: false },
      ],
      providerErrors: { onedrive: "Timeout" },
      providerLoading: { onedrive: false },
    });

    useRemoteFilesStore.getState().removeProviderFiles("onedrive");

    const state = useRemoteFilesStore.getState();
    expect(state.filesByProvider["onedrive"]).toBeUndefined();
    expect(state.providerErrors["onedrive"]).toBeUndefined();
    expect(state.providerLoading["onedrive"]).toBeUndefined();
    expect(state.files).toEqual([
      { Path: "doc.txt", Name: "doc.txt", Size: 10, MimeType: "text/plain", ModTime: null, IsDir: false, provider: "gdrive" },
    ]);
  });

  it("automatically prunes removed providers from filesByProvider on fetchFiles", async () => {
    // Initial state has gdrive and onedrive files in memory
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

    // Quota now only has gdrive connected (onedrive was disconnected)
    useVaultStore.setState({
      quota: {
        totalBytes: 500,
        usedBytes: 10,
        freeBytes: 490,
        accounts: [
          { name: "Google Drive", provider: "gdrive", isConnected: true, needsAuth: false, usedBytes: 10, totalBytes: 500 },
          { name: "OneDrive", provider: "onedrive", isConnected: false, needsAuth: false, usedBytes: 0, totalBytes: 0 },
        ],
      },
    });

    vi.mocked(browserApi.fetchProviderVaultFiles).mockResolvedValueOnce([
      { Path: "doc.txt", Name: "doc.txt", Size: 10, MimeType: "text/plain", ModTime: null, IsDir: false },
    ]);

    await useRemoteFilesStore.getState().fetchFiles();

    const state = useRemoteFilesStore.getState();
    expect(state.filesByProvider["onedrive"]).toBeUndefined();
    expect(state.files).toEqual([
      { Path: "doc.txt", Name: "doc.txt", Size: 10, MimeType: "text/plain", ModTime: null, IsDir: false, provider: "gdrive" },
    ]);
  });

  it("clears all provider maps when providers array is empty on fetchFiles", async () => {
    useRemoteFilesStore.setState({
      filesByProvider: {
        onedrive: [{ Path: "sheet.xlsx", Name: "sheet.xlsx", Size: 20, MimeType: "application/vnd.ms-excel", ModTime: null, IsDir: false }],
      },
      files: [
        { Path: "sheet.xlsx", Name: "sheet.xlsx", Size: 20, MimeType: "application/vnd.ms-excel", ModTime: null, IsDir: false },
      ],
    });

    useVaultStore.setState({
      quota: {
        totalBytes: 0,
        usedBytes: 0,
        freeBytes: 0,
        accounts: [],
      },
    });

    vi.mocked(browserApi.fetchVaultFiles).mockResolvedValueOnce([]);

    await useRemoteFilesStore.getState().fetchFiles();

    const state = useRemoteFilesStore.getState();
    expect(state.filesByProvider).toEqual({});
    expect(state.files).toEqual([]);
  });

  it("updates search query", () => {
    useRemoteFilesStore.getState().setSearchQuery("vacation");
    expect(useRemoteFilesStore.getState().searchQuery).toBe("vacation");
  });

  it("tracks and dismisses active downloads", () => {
    const progress: browserApi.DownloadProgress = {
      jobId: 10,
      path: "photo.jpg",
      name: "photo.jpg",
      transferredBytes: 50,
      totalBytes: 100,
      speedBytesPerSec: 10,
      etaSeconds: 5,
      status: "downloading",
      destinationDir: "/Downloads",
    };

    useRemoteFilesStore.getState().handleDownloadProgress(progress);
    expect(useRemoteFilesStore.getState().activeDownloads["photo.jpg"]).toEqual(progress);

    useRemoteFilesStore.getState().dismissDownload("photo.jpg");
    expect(useRemoteFilesStore.getState().activeDownloads["photo.jpg"]).toBeUndefined();
  });

  it("preserves duplicate filenames across different cloud providers with their respective providers", async () => {
    useVaultStore.setState({
      quota: {
        totalBytes: 2000,
        usedBytes: 300,
        freeBytes: 1700,
        accounts: [
          { name: "Google Drive", provider: "gdrive", isConnected: true, needsAuth: false, usedBytes: 100, totalBytes: 1000 },
          { name: "OneDrive", provider: "onedrive", isConnected: true, needsAuth: false, usedBytes: 200, totalBytes: 1000 },
        ],
      },
    });

    vi.mocked(browserApi.fetchProviderVaultFiles).mockImplementation((provider) => {
      if (provider === "gdrive") {
        return Promise.resolve([
          { Path: "report.pdf", Name: "report.pdf", Size: 100, MimeType: "application/pdf", ModTime: null, IsDir: false },
        ]);
      }
      return Promise.resolve([
        { Path: "report.pdf", Name: "report.pdf", Size: 200, MimeType: "application/pdf", ModTime: null, IsDir: false },
      ]);
    });

    await useRemoteFilesStore.getState().fetchFiles();

    const files = useRemoteFilesStore.getState().files;
    expect(files.length).toBe(2);
    expect(files[0]).toEqual(
      expect.objectContaining({ Name: "report.pdf", Size: 100, provider: "gdrive" })
    );
    expect(files[1]).toEqual(
      expect.objectContaining({ Name: "report.pdf", Size: 200, provider: "onedrive" })
    );
  });

  it("preserves duplicate filenames within the same cloud provider", async () => {
    useVaultStore.setState({
      quota: {
        totalBytes: 1000,
        usedBytes: 300,
        freeBytes: 700,
        accounts: [
          { name: "Google Drive", provider: "gdrive", isConnected: true, needsAuth: false, usedBytes: 300, totalBytes: 1000 },
        ],
      },
    });

    vi.mocked(browserApi.fetchProviderVaultFiles).mockResolvedValueOnce([
      { Path: "report.pdf", Name: "report.pdf", Size: 100, MimeType: "application/pdf", ModTime: null, IsDir: false },
      { Path: "report.pdf", Name: "report.pdf", Size: 200, MimeType: "application/pdf", ModTime: null, IsDir: false },
    ]);

    await useRemoteFilesStore.getState().fetchFiles();

    const files = useRemoteFilesStore.getState().files;
    expect(files.length).toBe(2);
    expect(files[0].Size).toBe(100);
    expect(files[1].Size).toBe(200);
    expect(files[0].provider).toBe("gdrive");
    expect(files[1].provider).toBe("gdrive");
  });

  it("deleting a file with a specific provider only deletes that provider's copy", async () => {
    useRemoteFilesStore.setState({
      filesByProvider: {
        gdrive: [{ Path: "report.pdf", Name: "report.pdf", Size: 100, MimeType: "application/pdf", ModTime: null, IsDir: false, provider: "gdrive" }],
        onedrive: [{ Path: "report.pdf", Name: "report.pdf", Size: 200, MimeType: "application/pdf", ModTime: null, IsDir: false, provider: "onedrive" }],
      },
      files: [
        { Path: "report.pdf", Name: "report.pdf", Size: 100, MimeType: "application/pdf", ModTime: null, IsDir: false, provider: "gdrive" },
        { Path: "report.pdf", Name: "report.pdf", Size: 200, MimeType: "application/pdf", ModTime: null, IsDir: false, provider: "onedrive" },
      ],
    });

    vi.mocked(browserApi.removeVaultItem).mockResolvedValueOnce();

    await useRemoteFilesStore.getState().deleteFile("report.pdf", false, "onedrive");

    expect(browserApi.removeVaultItem).toHaveBeenCalledWith("report.pdf", false, "onedrive");
    expect(browserApi.clearShareLinkCache).toHaveBeenCalledWith("report.pdf", "onedrive");

    const files = useRemoteFilesStore.getState().files;
    expect(files.length).toBe(1);
    expect(files[0].provider).toBe("gdrive");
    expect(files[0].Size).toBe(100);
  });

  describe("createFolder optimistic updates and rollback", () => {
    it("optimistically inserts folder into files and filesByProvider without re-fetching", async () => {
      vi.mocked(browserApi.createVaultFolder).mockResolvedValueOnce("gdrive");
      useRemoteFilesStore.setState({ files: [], filesByProvider: { gdrive: [] }, currentPath: "" });

      const promise = useRemoteFilesStore.getState().createFolder("NewDocs", "gdrive");

      // Instantly available in state before promise resolves
      const stateImmediate = useRemoteFilesStore.getState();
      expect(stateImmediate.files).toHaveLength(1);
      expect(stateImmediate.files[0].Name).toBe("NewDocs");
      expect(stateImmediate.files[0].IsDir).toBe(true);
      expect(stateImmediate.files[0].provider).toBe("gdrive");
      expect(stateImmediate.filesByProvider.gdrive).toHaveLength(1);

      await promise;
      expect(browserApi.createVaultFolder).toHaveBeenCalledWith("NewDocs", "gdrive");
    });

    it("rolls back optimistic folder and sets error on backend failure", async () => {
      vi.mocked(browserApi.createVaultFolder).mockRejectedValueOnce(new Error("Network timeout"));
      useRemoteFilesStore.setState({ files: [], filesByProvider: { gdrive: [] }, currentPath: "" });

      await expect(
        useRemoteFilesStore.getState().createFolder("FailedFolder", "gdrive")
      ).rejects.toThrow("Network timeout");

      const state = useRemoteFilesStore.getState();
      expect(state.files).toHaveLength(0);
      expect(state.filesByProvider.gdrive).toHaveLength(0);
      expect(state.error).toBe("Network timeout");
    });
  });
});
