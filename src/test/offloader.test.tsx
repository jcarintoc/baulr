import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TransferQueue } from "@/components/offloader/TransferQueue";
import { DropzoneCard } from "@/components/offloader/DropzoneCard";

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

    render(<TransferQueue items={items} onCancel={vi.fn()} />);
    expect(screen.getByText("Active Offload Queue (1)")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("2.5 MB/s")).toBeInTheDocument();
  });

  it("triggers cancel callback when clicking cancel button", () => {
    const onCancel = vi.fn();
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

    render(<TransferQueue items={items} onCancel={onCancel} />);
    const cancelBtn = screen.getByTitle("Cancel transfer");
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledWith(101);
  });

  it("renders dropzone card and handles drag over", () => {
    const onSelectPath = vi.fn();
    render(<DropzoneCard onSelectPath={onSelectPath} />);
    const zone = screen.getByRole("region", { name: "File offloader drop zone" });
    expect(zone).toBeInTheDocument();

    fireEvent.dragOver(zone);
    expect(zone).toHaveAttribute("data-dragging", "true");

    fireEvent.dragLeave(zone);
    expect(zone).not.toHaveAttribute("data-dragging");

    const file = new File(["dummy"], "vacation.zip");
    Object.defineProperty(file, "path", { value: "/home/user/vacation.zip" });
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(onSelectPath).toHaveBeenCalledWith("/home/user/vacation.zip");
  });
});
