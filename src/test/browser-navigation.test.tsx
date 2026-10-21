import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VaultBreadcrumbs } from "@/components/browser/VaultBreadcrumbs";
import { MediaGridView } from "@/components/browser/MediaGridView";
import { VaultItemRow } from "@/components/browser/VaultItemRow";
import { VaultBrowserToolbar } from "@/components/browser/VaultBrowserToolbar";
import { CreateFolderModal } from "@/components/browser/CreateFolderModal";
import { Table, TableBody } from "@/components/ui/table";
import { useRemoteFilesStore, RemoteVaultItem } from "@/store/useRemoteFilesStore";
import { useTransferStore } from "@/store/useTransferStore";
import { useViewStore } from "@/store/useViewStore";
import { useVaultStore } from "@/store/useVaultStore";
import * as offloadApi from "@/lib/api/offload";
import * as browserApi from "@/lib/api/browser";

vi.mock("@/lib/api/offload", () => ({
  selectOffloadFolder: vi.fn(),
  startOffloadJob: vi.fn(),
  cancelOffloadJob: vi.fn(),
  listenOffloadProgress: vi.fn(() => Promise.resolve(() => {})),
  reclaimPaths: vi.fn(),
}));

vi.mock("@/lib/api/browser", async (importOriginal) => {
  const actual = await importOriginal<typeof browserApi>();
  return {
    ...actual,
    createVaultFolder: vi.fn(),
  };
});

describe("Vault Navigation & Media Components", () => {
  describe("VaultBreadcrumbs", () => {
    it("renders root Vault label with no back button when currentPath is empty", () => {
      const onNavigate = vi.fn();
      render(<VaultBreadcrumbs currentPath="" onNavigate={onNavigate} />);

      expect(screen.getByText("Vault")).toBeInTheDocument();
      expect(screen.queryByTitle("Back to parent folder")).not.toBeInTheDocument();
    });

    it("renders breadcrumb segments and back button for subdirectories", () => {
      const onNavigate = vi.fn();
      render(
        <VaultBreadcrumbs
          currentPath="Photos/Vacation/2026"
          onNavigate={onNavigate}
        />
      );

      expect(screen.getByText("Vault")).toBeInTheDocument();
      expect(screen.getByText("Photos")).toBeInTheDocument();
      expect(screen.getByText("Vacation")).toBeInTheDocument();
      expect(screen.getByText("2026")).toBeInTheDocument();
      expect(screen.getByTitle("Back to parent folder")).toBeInTheDocument();
    });

    it("navigates to parent path when clicking back button", () => {
      const onNavigate = vi.fn();
      render(
        <VaultBreadcrumbs
          currentPath="Photos/Vacation"
          onNavigate={onNavigate}
        />
      );

      fireEvent.click(screen.getByTitle("Back to parent folder"));
      expect(onNavigate).toHaveBeenCalledWith("Photos");
    });

    it("navigates to clicked ancestor segment", () => {
      const onNavigate = vi.fn();
      render(
        <VaultBreadcrumbs
          currentPath="Photos/Vacation/2026"
          onNavigate={onNavigate}
        />
      );

      fireEvent.click(screen.getByText("Photos"));
      expect(onNavigate).toHaveBeenCalledWith("Photos");

      fireEvent.click(screen.getByText("Vault"));
      expect(onNavigate).toHaveBeenCalledWith("");
    });

    it("collapses intermediate segments into ... when path has more than 3 segments", () => {
      const onNavigate = vi.fn();
      render(
        <VaultBreadcrumbs
          currentPath="Photos/Vacation/2026/Summer/Beach"
          onNavigate={onNavigate}
        />
      );

      expect(screen.getByText("Vault")).toBeInTheDocument();
      expect(screen.getByText("Photos")).toBeInTheDocument();
      expect(screen.getByText("...")).toBeInTheDocument();
      expect(screen.getByText("Beach")).toBeInTheDocument();
      expect(screen.queryByText("Vacation")).not.toBeInTheDocument();
      expect(screen.queryByText("2026")).not.toBeInTheDocument();
      expect(screen.queryByText("Summer")).not.toBeInTheDocument();
    });
  });

  describe("VaultItemRow", () => {
    const mockFolder: RemoteVaultItem = {
      Path: "Documents",
      Name: "Documents",
      IsDir: true,
      Size: 0,
      MimeType: "inode/directory",
      ModTime: null,
    };

    const mockFile: RemoteVaultItem = {
      Path: "report.pdf",
      Name: "report.pdf",
      IsDir: false,
      Size: 1024,
      MimeType: "application/pdf",
      ModTime: "2026-10-15T12:00:00Z",
    };

    it("calls onOpenFolder when clicking a folder row", () => {
      const onOpenFolder = vi.fn();
      const onOpenFile = vi.fn();

      render(
        <Table>
          <TableBody>
            <VaultItemRow
              item={mockFolder}
              isDownloading={false}
              onDownload={vi.fn()}
              onDelete={vi.fn()}
              onShare={vi.fn()}
              onOpenFolder={onOpenFolder}
              onOpenFile={onOpenFile}
            />
          </TableBody>
        </Table>
      );

      fireEvent.click(screen.getByText("Documents"));
      expect(onOpenFolder).toHaveBeenCalledWith(mockFolder);
      expect(onOpenFile).not.toHaveBeenCalled();
    });

    it("calls onOpenFile when clicking a file row", () => {
      const onOpenFolder = vi.fn();
      const onOpenFile = vi.fn();

      render(
        <Table>
          <TableBody>
            <VaultItemRow
              item={mockFile}
              isDownloading={false}
              onDownload={vi.fn()}
              onDelete={vi.fn()}
              onShare={vi.fn()}
              onOpenFolder={onOpenFolder}
              onOpenFile={onOpenFile}
            />
          </TableBody>
        </Table>
      );

      fireEvent.click(screen.getByText("report.pdf"));
      expect(onOpenFile).toHaveBeenCalledWith(mockFile);
      expect(onOpenFolder).not.toHaveBeenCalled();
    });
  });

  describe("MediaGridView", () => {
    const mockItems: RemoteVaultItem[] = [
      {
        Path: "Albums",
        Name: "Albums",
        IsDir: true,
        Size: 0,
        MimeType: "inode/directory",
        ModTime: null,
      },
      {
        Path: "beach.jpg",
        Name: "beach.jpg",
        IsDir: false,
        Size: 2048576,
        MimeType: "image/jpeg",
        ModTime: "2026-10-15T12:00:00Z",
      },
      {
        Path: "drone.mp4",
        Name: "drone.mp4",
        IsDir: false,
        Size: 10485760,
        MimeType: "video/mp4",
        ModTime: "2026-10-15T12:00:00Z",
      },
      {
        Path: "notes.txt",
        Name: "notes.txt",
        IsDir: false,
        Size: 512,
        MimeType: "text/plain",
        ModTime: null,
      },
    ];

    it("renders folders and media items with metadata and badges", () => {
      render(
        <MediaGridView
          items={mockItems}
          mediaBaseUrl="http://127.0.0.1:57104"
          onOpenFolder={vi.fn()}
          onOpenFile={vi.fn()}
          onDownload={vi.fn()}
          onDelete={vi.fn()}
          onShare={vi.fn()}
        />
      );

      expect(screen.getByText("Albums")).toBeInTheDocument();
      expect(screen.getByText("beach.jpg")).toBeInTheDocument();
      expect(screen.getByText("drone.mp4")).toBeInTheDocument();
      expect(screen.getByText("notes.txt")).toBeInTheDocument();
    });

    it("calls onOpenFolder when clicking a folder card", () => {
      const onOpenFolder = vi.fn();
      render(
        <MediaGridView
          items={mockItems}
          mediaBaseUrl="http://127.0.0.1:57104"
          onOpenFolder={onOpenFolder}
          onOpenFile={vi.fn()}
          onDownload={vi.fn()}
          onDelete={vi.fn()}
          onShare={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText("Albums"));
      expect(onOpenFolder).toHaveBeenCalledWith(mockItems[0]);
    });

    it("calls onOpenFile when clicking file card", () => {
      const onOpenFile = vi.fn();
      render(
        <MediaGridView
          items={mockItems}
          mediaBaseUrl="http://127.0.0.1:57104"
          onOpenFolder={vi.fn()}
          onOpenFile={onOpenFile}
          onDownload={vi.fn()}
          onDelete={vi.fn()}
          onShare={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText("beach.jpg"));
      expect(onOpenFile).toHaveBeenCalledWith(mockItems[1]);

      fireEvent.click(screen.getByText("drone.mp4"));
      expect(onOpenFile).toHaveBeenCalledWith(mockItems[2]);

      fireEvent.click(screen.getByText("notes.txt"));
      expect(onOpenFile).toHaveBeenCalledWith(mockItems[3]);
    });
  });

  describe("useRemoteFilesStore Navigation & View Actions", () => {
    beforeEach(() => {
      useRemoteFilesStore.getState().clearFiles();
    });

    it("manages currentPath and viewMode", () => {
      const store = useRemoteFilesStore.getState();
      expect(store.currentPath).toBe("");
      expect(store.viewMode).toBe("table");

      store.setViewMode("grid");
      expect(useRemoteFilesStore.getState().viewMode).toBe("grid");

      store.clearFiles();
      expect(useRemoteFilesStore.getState().currentPath).toBe("");
    });

    it("creates folder at root and inside nested directories", async () => {
      vi.mocked(browserApi.createVaultFolder).mockResolvedValue("gdrive");

      // Root creation
      await useRemoteFilesStore.getState().createFolder("Projects");
      expect(browserApi.createVaultFolder).toHaveBeenCalledWith("Projects", undefined);

      // Subdirectory creation
      useRemoteFilesStore.setState({ currentPath: "Projects/Q4" });
      await useRemoteFilesStore.getState().createFolder("Taxes");
      expect(browserApi.createVaultFolder).toHaveBeenCalledWith("Projects/Q4/Taxes", undefined);
    });
  });

  describe("CreateFolderModal", () => {
    it("renders modal with parent path context and validates input", async () => {
      const onClose = vi.fn();
      const onCreateFolder = vi.fn().mockResolvedValue(undefined);

      const { rerender } = render(
        <CreateFolderModal
          open={true}
          onClose={onClose}
          currentPath=""
          onCreateFolder={onCreateFolder}
        />
      );

      expect(screen.getByText("New folder")).toBeInTheDocument();
      expect(screen.getByText("Inside: Vault")).toBeInTheDocument();

      const input = screen.getByPlaceholderText(/e\.g\. Invoices/i);
      const submitBtn = screen.getByRole("button", { name: /Create folder/i });

      // Special characters validation
      fireEvent.change(input, { target: { value: "Invalid/Name" } });
      fireEvent.click(submitBtn);

      expect(
        screen.getByText(/Folder names cannot contain special characters/i)
      ).toBeInTheDocument();
      expect(onCreateFolder).not.toHaveBeenCalled();

      // Valid submission
      fireEvent.change(input, { target: { value: "Valid Folder" } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(onCreateFolder).toHaveBeenCalledWith("Valid Folder", undefined);
        expect(onClose).toHaveBeenCalled();
      });

      // Context in subdirectory
      rerender(
        <CreateFolderModal
          open={true}
          onClose={onClose}
          currentPath="Documents/Work"
          onCreateFolder={onCreateFolder}
        />
      );
      expect(screen.getByText("Inside: Vault / Documents/Work")).toBeInTheDocument();
    });

    it("renders destination cloud selection when multiple accounts are connected and closes immediately on submit", async () => {
      useVaultStore.setState({
        quota: {
          totalBytes: 30000000000,
          usedBytes: 10000000000,
          freeBytes: 20000000000,
          accounts: [
            { name: "Google Drive", provider: "gdrive", usedBytes: 2000, totalBytes: 10000, isConnected: true, needsAuth: false },
            { name: "OneDrive", provider: "onedrive", usedBytes: 3000, totalBytes: 10000, isConnected: true, needsAuth: false },
          ],
        },
      });

      const onClose = vi.fn();
      const onCreateFolder = vi.fn().mockReturnValue(new Promise(() => {})); // Never resolves

      render(
        <CreateFolderModal
          open={true}
          onClose={onClose}
          currentPath=""
          onCreateFolder={onCreateFolder}
        />
      );

      expect(screen.getByText("Destination")).toBeInTheDocument();
      const input = screen.getByPlaceholderText(/e\.g\. Invoices/i);
      fireEvent.change(input, { target: { value: "Finances" } });

      const submitBtn = screen.getByRole("button", { name: /Create folder/i });
      fireEvent.click(submitBtn);

      // Modal must close immediately (0ms perceived latency)
      expect(onClose).toHaveBeenCalled();
      expect(onCreateFolder).toHaveBeenCalledWith("Finances", undefined);
    });

    it("displays error and prevents submission when folder name already exists in current directory", async () => {
      useRemoteFilesStore.setState({
        files: [
          {
            Path: "Projects",
            Name: "Projects",
            Size: 0,
            MimeType: "inode/directory",
            ModTime: null,
            IsDir: true,
            provider: "gdrive",
          },
        ],
      });

      const onClose = vi.fn();
      const onCreateFolder = vi.fn().mockResolvedValue("gdrive");

      render(
        <CreateFolderModal
          open={true}
          onClose={onClose}
          currentPath=""
          onCreateFolder={onCreateFolder}
        />
      );

      const input = screen.getByPlaceholderText(/e\.g\. Invoices/i);
      const submitBtn = screen.getByRole("button", { name: /Create folder/i });

      // Enter duplicate name (case-insensitive)
      fireEvent.change(input, { target: { value: "projects" } });
      fireEvent.click(submitBtn);

      expect(
        screen.getByText("A folder with this name already exists here.")
      ).toBeInTheDocument();
      expect(onCreateFolder).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("VaultBrowserToolbar", () => {
    it("renders New Folder and Upload here buttons", () => {
      render(
        <VaultBrowserToolbar
          currentPath="Documents"
          onNavigatePath={vi.fn()}
          viewMode="table"
          onViewModeChange={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: /New folder/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Upload here/i })).toBeInTheDocument();
    });

    it("opens New Folder modal when clicking New folder button", () => {
      render(
        <VaultBrowserToolbar
          currentPath="Documents"
          onNavigatePath={vi.fn()}
          viewMode="table"
          onViewModeChange={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /New folder/i }));
      expect(screen.getByText("Inside: Vault / Documents")).toBeInTheDocument();
    });

    it("triggers file picker and enqueues upload to currentPath when clicking Upload here", async () => {
      vi.mocked(offloadApi.selectOffloadFolder).mockResolvedValueOnce({
        path: "/local/my_file.pdf",
        name: "my_file.pdf",
        sizeBytes: 1024,
        isDir: false,
        maxFileBytes: 1024,
      });

      const enqueueSpy = vi.spyOn(useTransferStore.getState(), "enqueuePaths").mockResolvedValue();
      const setViewSpy = vi.spyOn(useViewStore.getState(), "setActiveView");

      render(
        <VaultBrowserToolbar
          currentPath="Documents/Projects"
          onNavigatePath={vi.fn()}
          viewMode="table"
          onViewModeChange={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /Upload here/i }));

      await waitFor(() => {
        expect(offloadApi.selectOffloadFolder).toHaveBeenCalled();
        expect(enqueueSpy).toHaveBeenCalledWith(
          ["/local/my_file.pdf"],
          undefined,
          "Documents/Projects"
        );
        expect(setViewSpy).toHaveBeenCalledWith("dashboard");
      });

      enqueueSpy.mockRestore();
      setViewSpy.mockRestore();
    });
  });
});
