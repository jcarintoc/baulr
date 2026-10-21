import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TransferQueue } from "@/components/offloader/TransferQueue";
import { DropzoneCard } from "@/components/offloader/DropzoneCard";
import { DestinationCloudDropdown } from "@/components/offloader/DestinationCloudDropdown";
import { useVaultStore } from "@/store/useVaultStore";

describe("Offloader Components", () => {
  it("renders active queue with real items and speed", () => {
    const items = [
      {
        id: "1",
        jobId: 101,
        path: "/test/docs",
        name: "Documents",
        sizeBytes: 1024 * 1024 * 10,
        transferredBytes: 1024 * 1024 * 5,
        speedBytesPerSec: 1024 * 1024 * 2.5,
        etaSeconds: 2,
        status: "uploading" as const,
      },
    ];

    render(<TransferQueue items={items} />);
    expect(screen.getByText("Active Offload Queue (1)")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("2.5 MB/s")).toBeInTheDocument();
  });

  it("triggers cancel callback when clicking cancel button", () => {
    const items = [

      {
        id: "1",
        jobId: 101,
        path: "/test/docs",
        name: "Documents",
        sizeBytes: 100,
        transferredBytes: 50,
        speedBytesPerSec: 10,
        etaSeconds: 5,
        status: "uploading" as const,
      },
    ];

    const onDismiss = vi.fn();
    render(<TransferQueue items={items} onDismiss={onDismiss} />);
    const cancelBtn = screen.getByTitle("Cancel transfer");
    fireEvent.click(cancelBtn);
    expect(onDismiss).toHaveBeenCalledWith("1");

  });

  it("renders dropzone card and handles drag over and multi-file drop", () => {
    const onSelectPaths = vi.fn();
    render(<DropzoneCard onSelectPaths={onSelectPaths} />);
    const zone = screen.getByRole("region", { name: "File offloader drop zone" });
    expect(zone).toBeInTheDocument();

    fireEvent.dragOver(zone);
    expect(zone).toHaveAttribute("data-dragging", "true");

    fireEvent.dragLeave(zone);
    expect(zone).not.toHaveAttribute("data-dragging");

    const file1 = new File(["dummy"], "vacation.zip");
    Object.defineProperty(file1, "path", { value: "/home/user/vacation.zip" });
    const file2 = new File(["dummy2"], "report.pdf");
    Object.defineProperty(file2, "path", { value: "/home/user/report.pdf" });

    fireEvent.drop(zone, { dataTransfer: { files: [file1, file2] } });
    expect(onSelectPaths).toHaveBeenCalledWith(
      [
        "/home/user/vacation.zip",
        "/home/user/report.pdf",
      ],
      undefined
    );
  });

  it("renders cloud destination selector when multiple accounts are connected and passes chosen provider", () => {
    useVaultStore.setState({
      quota: {
        totalBytes: 1000,
        usedBytes: 500,
        freeBytes: 500,
        accounts: [
          {
            provider: "google",
            name: "Google Drive",
            isConnected: true,
            needsAuth: false,
            usedBytes: 200,
            totalBytes: 500,
          },
          {
            provider: "onedrive",
            name: "OneDrive",
            isConnected: true,
            needsAuth: false,
            usedBytes: 100,
            totalBytes: 500,
          },
        ],
      },
    });

    const onSelectPaths = vi.fn();
    render(<DropzoneCard onSelectPaths={onSelectPaths} />);

    const dropdownBtn = screen.getByTitle("Choose cloud destination");
    expect(dropdownBtn).toBeInTheDocument();
    expect(screen.getByText("Let Baulr decide")).toBeInTheDocument();

    fireEvent.click(dropdownBtn);
    const onedriveItem = screen.getByRole("menuitem", { name: /OneDrive/i });
    fireEvent.click(onedriveItem);

    expect(screen.getByText("OneDrive")).toBeInTheDocument();

    const zone = screen.getByRole("region", { name: "File offloader drop zone" });
    const file1 = new File(["dummy"], "vacation.zip");
    Object.defineProperty(file1, "path", { value: "/home/user/vacation.zip" });
    fireEvent.drop(zone, { dataTransfer: { files: [file1] } });

    expect(onSelectPaths).toHaveBeenCalledWith(["/home/user/vacation.zip"], "onedrive");
  });

  it("displays target provider badge and destination status in TransferQueue", () => {
    const items = [
      {
        id: "1",
        jobId: 101,
        path: "/test/docs",
        name: "Documents",
        sizeBytes: 1000,
        transferredBytes: 500,
        speedBytesPerSec: 100,
        etaSeconds: 5,
        status: "uploading" as const,
        targetProvider: "Google Drive",
      },
      {
        id: "2",
        jobId: 102,
        path: "/test/photos",
        name: "Photos",
        sizeBytes: 2000,
        transferredBytes: 2000,
        speedBytesPerSec: 0,
        etaSeconds: 0,
        status: "verified" as const,
        targetProvider: "OneDrive",
      },
    ];

    render(<TransferQueue items={items} />);
    expect(screen.getByText("Google Drive")).toBeInTheDocument();
    expect(screen.getByText("OneDrive")).toBeInTheDocument();
    expect(screen.getByText("Backing up to Google Drive...")).toBeInTheDocument();
    expect(screen.getByText("Safely backed up to OneDrive")).toBeInTheDocument();
  });

  it("renders preparing state in TransferQueue with animated badge and copy", () => {
    const items = [
      {
        id: "prep-1",
        path: "/test/docs",
        name: "Documents",
        sizeBytes: 0,
        transferredBytes: 0,
        speedBytesPerSec: 0,
        etaSeconds: 0,
        status: "preparing" as const,
      },
    ];

    render(<TransferQueue items={items} />);
    expect(screen.getByText("Documents")).toBeInTheDocument();

    expect(screen.getByText("Preparing")).toBeInTheDocument();
    expect(screen.getByText("Analyzing files and preparing upload...")).toBeInTheDocument();
  });

  it("renders queued state and handles dismissal of failed and queued items", () => {
    const onDismiss = vi.fn();
    const items = [
      {
        id: "queue-1",
        path: "/test/docs",
        name: "Documents",
        sizeBytes: 0,
        transferredBytes: 0,
        speedBytesPerSec: 0,
        etaSeconds: 0,
        status: "queued" as const,
      },
      {
        id: "err-1",
        path: "/test/broken",
        name: "CorruptFolder",
        sizeBytes: 1000,
        transferredBytes: 100,
        speedBytesPerSec: 0,
        etaSeconds: 0,
        status: "error" as const,
        error: "Network timeout during upload",
      },
    ];

    render(<TransferQueue items={items} onDismiss={onDismiss} />);

    expect(screen.getByText("Queued")).toBeInTheDocument();
    expect(screen.getByText("Waiting in queue...")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("Network timeout during upload")).toBeInTheDocument();

    const removeQueueBtn = screen.getByTitle("Remove from queue");
    fireEvent.click(removeQueueBtn);
    expect(onDismiss).toHaveBeenCalledWith("queue-1");

    const dismissErrBtn = screen.getByTitle("Dismiss failed transfer");
    fireEvent.click(dismissErrBtn);
    expect(onDismiss).toHaveBeenCalledWith("err-1");
  });

  it("renders free space badges for each account in DestinationCloudDropdown", () => {
    const accounts = [
      {
        name: "Google Drive",
        provider: "gdrive",
        usedBytes: 1 * 1024 * 1024 * 1024,
        totalBytes: 5 * 1024 * 1024 * 1024,
        isConnected: true,
        needsAuth: false,
      },
      {
        name: "OneDrive",
        provider: "onedrive",
        usedBytes: 2 * 1024 * 1024 * 1024,
        totalBytes: 5 * 1024 * 1024 * 1024,
        isConnected: true,
        needsAuth: false,
      },
    ];

    render(
      <DestinationCloudDropdown
        accounts={accounts}
        selectedProvider="auto"
        onSelectProvider={vi.fn()}
        totalFreeBytes={7 * 1024 * 1024 * 1024}
      />
    );

    const trigger = screen.getByTitle("Choose cloud destination");
    fireEvent.click(trigger);

    expect(screen.getByText(/7(\.0)? GB free/i)).toBeInTheDocument();
    expect(screen.getByText(/4(\.0)? GB free/i)).toBeInTheDocument();
    expect(screen.getByText(/3(\.0)? GB free/i)).toBeInTheDocument();
  });
});

