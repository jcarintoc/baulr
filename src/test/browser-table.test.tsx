import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { VaultBrowserTable } from "@/components/browser/VaultBrowserTable";
import { useRemoteFilesStore } from "@/store/useRemoteFilesStore";

vi.mock("@/lib/api/browser", () => ({
  fetchVaultFiles: vi.fn().mockResolvedValue([]),
  removeVaultItem: vi.fn().mockResolvedValue(undefined),
  downloadVaultItemToDirectory: vi.fn().mockResolvedValue(1),
  pickDownloadDestination: vi.fn().mockResolvedValue("/tmp"),
  listenToDownloadProgress: vi.fn().mockResolvedValue(vi.fn()),
  fetchFileShareLink: vi.fn().mockResolvedValue("https://drive.google.com/share/test"),
}));

describe("VaultBrowserTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRemoteFilesStore.setState({
      files: [],
      isLoading: false,
      error: null,
      searchQuery: "",
      fetchFiles: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("renders empty state when no items exist", () => {
    render(<VaultBrowserTable />);
    expect(screen.getByText("No files offloaded to the vault yet.")).toBeInTheDocument();
  });

  it("renders files and folders with size and actions", () => {
    useRemoteFilesStore.setState({
      files: [
        {
          Path: "report.pdf",
          Name: "report.pdf",
          Size: 1048576,
          MimeType: "application/pdf",
          ModTime: "2026-10-15T10:00:00Z",
          IsDir: false,
        },
        {
          Path: "photos",
          Name: "photos",
          Size: -1,
          MimeType: "inode/directory",
          ModTime: "2026-10-15T09:00:00Z",
          IsDir: true,
        },
      ],
    });

    render(<VaultBrowserTable />);

    expect(screen.getByText("report.pdf")).toBeInTheDocument();
    expect(screen.getByText("Cloud")).toBeInTheDocument();
    expect(screen.getByText("1 MB")).toBeInTheDocument();
    expect(screen.getByText("photos")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("renders Cloud column and distinguishes duplicate file names across providers", () => {
    useRemoteFilesStore.setState({
      files: [
        {
          Path: "report.pdf",
          Name: "report.pdf",
          Size: 1024,
          MimeType: "application/pdf",
          ModTime: null,
          IsDir: false,
          provider: "gdrive",
        },
        {
          Path: "report.pdf",
          Name: "report.pdf",
          Size: 2048,
          MimeType: "application/pdf",
          ModTime: null,
          IsDir: false,
          provider: "onedrive",
        },
        {
          Path: "archive.zip",
          Name: "archive.zip",
          Size: 4096,
          MimeType: "application/zip",
          ModTime: null,
          IsDir: false,
          provider: "dropbox",
        },
        {
          Path: "notes.txt",
          Name: "notes.txt",
          Size: 512,
          MimeType: "text/plain",
          ModTime: null,
          IsDir: false,
          provider: "box",
        },
      ],
    });

    render(<VaultBrowserTable />);

    expect(screen.getByText("Cloud")).toBeInTheDocument();
    expect(screen.getAllByText("report.pdf").length).toBe(2);
    expect(screen.getByText("Google Drive")).toBeInTheDocument();
    expect(screen.getByText("OneDrive")).toBeInTheDocument();
    expect(screen.getByText("Dropbox")).toBeInTheDocument();
    expect(screen.getByText("Box")).toBeInTheDocument();
  });

  it("filters items based on search input", () => {
    useRemoteFilesStore.setState({
      files: [
        {
          Path: "tax_doc.pdf",
          Name: "tax_doc.pdf",
          Size: 500,
          MimeType: "application/pdf",
          ModTime: null,
          IsDir: false,
        },
        {
          Path: "holiday.png",
          Name: "holiday.png",
          Size: 1500,
          MimeType: "image/png",
          ModTime: null,
          IsDir: false,
        },
      ],
    });

    render(<VaultBrowserTable />);

    const searchInput = screen.getByPlaceholderText("Search vault files...");
    fireEvent.change(searchInput, { target: { value: "holiday" } });

    expect(screen.getByText("holiday.png")).toBeInTheDocument();
    expect(screen.queryByText("tax_doc.pdf")).not.toBeInTheDocument();
  });

  it("triggers download action when download button is clicked", async () => {
    const downloadSpy = vi.fn().mockResolvedValue(undefined);
    useRemoteFilesStore.setState({
      files: [
        {
          Path: "download_me.txt",
          Name: "download_me.txt",
          Size: 200,
          MimeType: "text/plain",
          ModTime: null,
          IsDir: false,
        },
      ],
      downloadFile: downloadSpy,
    });

    render(<VaultBrowserTable />);

    const downloadBtn = screen.getByTitle("Download to folder");
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith(
        expect.objectContaining({ Path: "download_me.txt" })
      );
    });
  });

  it("opens delete dialog and confirms item deletion", async () => {
    const deleteSpy = vi.fn().mockResolvedValue(undefined);
    useRemoteFilesStore.setState({
      files: [
        {
          Path: "delete_me.txt",
          Name: "delete_me.txt",
          Size: 200,
          MimeType: "text/plain",
          ModTime: null,
          IsDir: false,
        },
      ],
      deleteFile: deleteSpy,
    });

    render(<VaultBrowserTable />);

    const deleteBtn = screen.getByTitle("Remove from vault");
    fireEvent.click(deleteBtn);

    expect(screen.getByText("Remove from vault?")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to remove "delete_me.txt"/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: "Remove item" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith("delete_me.txt", false, undefined);
    });
  });

  it("displays live download banner and row progress when item is downloading", () => {
    useRemoteFilesStore.setState({
      files: [
        {
          Path: "active_download.zip",
          Name: "active_download.zip",
          Size: 1000,
          MimeType: "application/zip",
          ModTime: null,
          IsDir: false,
        },
      ],
      activeDownloads: {
        "active_download.zip": {
          jobId: 1,
          path: "active_download.zip",
          name: "active_download.zip",
          transferredBytes: 450,
          totalBytes: 1000,
          speedBytesPerSec: 500000,
          etaSeconds: 1,
          status: "downloading",
          destinationDir: "/Users/test/Downloads",
        },
      },
    });

    render(<VaultBrowserTable />);

    expect(screen.getByText("Downloading")).toBeInTheDocument();
    expect(screen.getByText("45%")).toBeInTheDocument();
    expect(screen.getByText(/Destination: \/Users\/test\/Downloads/i)).toBeInTheDocument();
  });

  it("allows re-downloading an item after a previous download has completed", async () => {
    const downloadSpy = vi.fn().mockResolvedValue(undefined);
    useRemoteFilesStore.setState({
      files: [
        {
          Path: "photos",
          Name: "photos",
          Size: -1,
          MimeType: "inode/directory",
          ModTime: null,
          IsDir: true,
        },
      ],
      activeDownloads: {
        photos: {
          jobId: 2,
          path: "photos",
          name: "photos",
          transferredBytes: 500,
          totalBytes: 500,
          speedBytesPerSec: 0,
          etaSeconds: 0,
          status: "completed",
          destinationDir: "/Users/test/Downloads/photos",
        },
      },
      downloadFile: downloadSpy,
    });

    render(<VaultBrowserTable />);

    // Download button should still be present and clickable
    const downloadBtn = screen.getByTitle("Download to folder");
    expect(downloadBtn).toBeInTheDocument();
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith(
        expect.objectContaining({ Path: "photos" })
      );
    });
  });

  it("renders error alert with retry button when error occurs", () => {
    const fetchSpy = vi.fn().mockResolvedValue(undefined);
    useRemoteFilesStore.setState({
      files: [],
      isLoading: false,
      error: "Network connection lost",
      fetchFiles: fetchSpy,
    });

    render(<VaultBrowserTable />);

    expect(screen.getByText("Unable to load vault files")).toBeInTheDocument();
    expect(
      screen.getByText("We could not reach your cloud accounts. Check your internet connection and try again.")
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /try again/i });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);

    expect(fetchSpy).toHaveBeenCalled();
  });

  it("opens share modal when clicking share button on file row", async () => {
    useRemoteFilesStore.setState({
      files: [
        {
          Path: "vacation.jpg",
          Name: "vacation.jpg",
          Size: 2048,
          MimeType: "image/jpeg",
          ModTime: null,
          IsDir: false,
        },
      ],
    });

    render(<VaultBrowserTable />);

    const shareBtn = screen.getByTitle("Share link");
    expect(shareBtn).toBeInTheDocument();
    fireEvent.click(shareBtn);

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Share File")).toBeInTheDocument();
    expect(within(dialog).getByText("vacation.jpg")).toBeInTheDocument();
  });

  it("renders ProviderSyncAlert when provider has errors", () => {
    useRemoteFilesStore.setState({
      files: [{ Path: "gdoc.pdf", Name: "gdoc.pdf", Size: 100, MimeType: "", ModTime: null, IsDir: false }],
      providerErrors: { onedrive: "Network failure" },
    });

    render(<VaultBrowserTable />);
    expect(screen.getByText("Unable to load OneDrive files")).toBeInTheDocument();
    expect(screen.getByText("gdoc.pdf")).toBeInTheDocument();
  });

  it("renders cached files immediately without skeleton during background revalidation", () => {
    useRemoteFilesStore.setState({
      files: [{ Path: "cached.pdf", Name: "cached.pdf", Size: 100, MimeType: "", ModTime: null, IsDir: false }],
      isLoading: true,
      isInitialLoading: false,
      isRevalidating: true,
    });

    render(<VaultBrowserTable />);
    expect(screen.getByText("cached.pdf")).toBeInTheDocument();
    expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
  });

  it("displays reassuring looking for files message instead of empty state while provider is checking", () => {
    useRemoteFilesStore.setState({
      files: [],
      isLoading: false,
      providerLoading: { onedrive: true },
    });

    render(<VaultBrowserTable />);
    expect(screen.getByText("Looking for your vault files")).toBeInTheDocument();
    expect(screen.getByText(/Checking OneDrive for saved files.../i)).toBeInTheDocument();
    expect(screen.queryByText("No files found")).not.toBeInTheDocument();
    expect(screen.queryByText("No files offloaded to the vault yet.")).not.toBeInTheDocument();
  });

  it("displays table streaming row when files exist and another provider is checking", () => {
    useRemoteFilesStore.setState({
      files: [{ Path: "gdoc.pdf", Name: "gdoc.pdf", Size: 100, MimeType: "", ModTime: null, IsDir: false }],
      providerLoading: { onedrive: true },
    });

    render(<VaultBrowserTable />);
    expect(screen.getByText(/Checking OneDrive for additional files.../i)).toBeInTheDocument();
    expect(screen.getByText("gdoc.pdf")).toBeInTheDocument();
  });

  it("renders provider filter pills and filters files when clicked", () => {
    useRemoteFilesStore.setState({
      selectedProvider: "all",
      files: [
        { Path: "gdrive-file.pdf", Name: "gdrive-file.pdf", Size: 100, MimeType: "", ModTime: null, IsDir: false, provider: "gdrive" },
        { Path: "onedrive-file.docx", Name: "onedrive-file.docx", Size: 200, MimeType: "", ModTime: null, IsDir: false, provider: "onedrive" },
      ],
      filesByProvider: {
        gdrive: [{ Path: "gdrive-file.pdf", Name: "gdrive-file.pdf", Size: 100, MimeType: "", ModTime: null, IsDir: false, provider: "gdrive" }],
        onedrive: [{ Path: "onedrive-file.docx", Name: "onedrive-file.docx", Size: 200, MimeType: "", ModTime: null, IsDir: false, provider: "onedrive" }],
      },
    });

    render(<VaultBrowserTable />);
    expect(screen.getByText("gdrive-file.pdf")).toBeInTheDocument();
    expect(screen.getByText("onedrive-file.docx")).toBeInTheDocument();

    const gdrivePill = screen.getByTestId("provider-pill-gdrive");
    const onedrivePill = screen.getByTestId("provider-pill-onedrive");
    expect(gdrivePill).toBeInTheDocument();
    expect(onedrivePill).toBeInTheDocument();

    fireEvent.click(gdrivePill);
    expect(screen.getByText("gdrive-file.pdf")).toBeInTheDocument();
    expect(screen.queryByText("onedrive-file.docx")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("provider-pill-all"));
    expect(screen.getByText("gdrive-file.pdf")).toBeInTheDocument();
    expect(screen.getByText("onedrive-file.docx")).toBeInTheDocument();
  });

  it("toggles sorting when column headers are clicked", () => {
    const setSortingSpy = vi.fn();
    useRemoteFilesStore.setState({
      files: [
        { Path: "b.txt", Name: "b.txt", Size: 200, MimeType: "", ModTime: null, IsDir: false },
        { Path: "a.txt", Name: "a.txt", Size: 100, MimeType: "", ModTime: null, IsDir: false },
      ],
      setSorting: setSortingSpy,
    });

    render(<VaultBrowserTable />);
    fireEvent.click(screen.getByText("Name"));
    expect(setSortingSpy).toHaveBeenCalledWith("name");

    fireEvent.click(screen.getByText("Size"));
    expect(setSortingSpy).toHaveBeenCalledWith("size");

    fireEvent.click(screen.getByText("Modified"));
    expect(setSortingSpy).toHaveBeenCalledWith("modified");
  });
});
