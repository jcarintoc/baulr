import { describe, it, expect, beforeEach, vi } from "vitest";
import { useRemoteFilesStore } from "@/store/useRemoteFilesStore";
import * as browserApi from "@/lib/api/browser";

vi.mock("@/lib/api/browser", () => ({
  fetchVaultFiles: vi.fn(),
  removeVaultItem: vi.fn(),
  downloadVaultItemToDirectory: vi.fn(),
  pickDownloadDestination: vi.fn(),
}));

describe("useRemoteFilesStore actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRemoteFilesStore.setState({
      files: [],
      isLoading: false,
      error: null,
      searchQuery: "",
    });
  });

  it("fetches vault files successfully", async () => {
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

  it("sets error and clears existing stale files when fetch fails", async () => {
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

  it("clearFiles resets files and error", () => {
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
      error: "Previous error",
    });

    useRemoteFilesStore.getState().clearFiles();

    const state = useRemoteFilesStore.getState();
    expect(state.files).toEqual([]);
    expect(state.error).toBeNull();
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
    });

    vi.mocked(browserApi.removeVaultItem).mockResolvedValueOnce();

    await useRemoteFilesStore.getState().deleteFile("doc.txt", false);

    expect(browserApi.removeVaultItem).toHaveBeenCalledWith("doc.txt", false);
    const files = useRemoteFilesStore.getState().files;
    expect(files.length).toBe(1);
    expect(files[0].Path).toBe("photos");
  });

  it("downloads file when user selects destination", async () => {
    vi.mocked(browserApi.pickDownloadDestination).mockResolvedValueOnce("/Users/locar/Downloads");
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
      "/Users/locar/Downloads"
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
});
