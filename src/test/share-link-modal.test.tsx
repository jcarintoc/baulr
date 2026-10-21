import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ShareLinkModal } from "@/components/browser/ShareLinkModal";
import * as browserApi from "@/lib/api/browser";
import type { RemoteVaultItem } from "@/store/useRemoteFilesStore";

vi.mock("@/lib/api/browser", async () => {
  const actual = await vi.importActual("@/lib/api/browser");
  return {
    ...actual,
    fetchFileShareLink: vi.fn(),
  };
});

const mockItem: RemoteVaultItem = {
  Path: "Photos/beach.jpg",
  Name: "beach.jpg",
  Size: 5242880,
  IsDir: false,
  MimeType: "image/jpeg",
  ModTime: "2026-10-17T12:00:00Z",
  provider: "gdrive",
};

describe("ShareLinkModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and displays public share link upon opening", async () => {
    vi.mocked(browserApi.fetchFileShareLink).mockResolvedValue(
      "https://drive.google.com/file/d/sample123/view"
    );

    render(
      <ShareLinkModal item={mockItem} open={true} onClose={vi.fn()} />
    );

    expect(screen.getByText("Share File")).toBeInTheDocument();
    expect(screen.getByText("beach.jpg")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByDisplayValue("https://drive.google.com/file/d/sample123/view")).toBeInTheDocument();
    });

    expect(browserApi.fetchFileShareLink).toHaveBeenCalledWith("Photos/beach.jpg", "gdrive");
  });

  it("copies link to clipboard with feedback", async () => {
    vi.mocked(browserApi.fetchFileShareLink).mockResolvedValue(
      "https://drive.google.com/file/d/sample123/view"
    );
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ShareLinkModal item={mockItem} open={true} onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Copy/i })).toBeInTheDocument();
    });

    const copyBtn = screen.getByRole("button", { name: /Copy/i });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith("https://drive.google.com/file/d/sample123/view");
    expect(await screen.findByText("Copied!")).toBeInTheDocument();
  });

  it("displays error and allows retry when link generation fails", async () => {
    vi.mocked(browserApi.fetchFileShareLink)
      .mockRejectedValueOnce(new Error("Provider error"))
      .mockResolvedValueOnce("https://1drv.ms/u/sample456");

    render(
      <ShareLinkModal item={mockItem} open={true} onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText("Provider error")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole("button", { name: /Retry/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByDisplayValue("https://1drv.ms/u/sample456")).toBeInTheDocument();
    });
  });

  it("calls onClose when clicking Done", async () => {
    vi.mocked(browserApi.fetchFileShareLink).mockResolvedValue(
      "https://drive.google.com/file/d/sample123/view"
    );
    const handleClose = vi.fn();

    render(
      <ShareLinkModal item={mockItem} open={true} onClose={handleClose} />
    );

    const doneBtn = screen.getByRole("button", { name: "Done" });
    fireEvent.click(doneBtn);

    expect(handleClose).toHaveBeenCalledOnce();
  });
});
