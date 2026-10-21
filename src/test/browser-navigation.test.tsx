import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VaultBreadcrumbs } from "@/components/browser/VaultBreadcrumbs";
import { MediaGridView } from "@/components/browser/MediaGridView";
import { VaultItemRow } from "@/components/browser/VaultItemRow";
import { Table, TableBody } from "@/components/ui/table";
import { useRemoteFilesStore, RemoteVaultItem } from "@/store/useRemoteFilesStore";

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
  });
});
