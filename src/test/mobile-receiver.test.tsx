import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MobileReceivedList } from "@/components/offloader/MobileReceivedList";
import { MobileUploadModal } from "@/components/offloader/MobileUploadModal";
import { DropzoneCard } from "@/components/offloader/DropzoneCard";
import * as mobileApi from "@/lib/api/mobile";

vi.mock("@/lib/api/mobile", () => ({
  startMobileReceiver: vi.fn(),
  stopMobileReceiver: vi.fn().mockResolvedValue(undefined),
  listenMobileFileReceived: vi.fn().mockResolvedValue(() => {}),
  listenMobileClientConnected: vi.fn().mockResolvedValue(() => {}),
}));

describe("Mobile Receiver Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders MobileReceivedList with file details and saved badges", () => {
    const files = [
      {
        fileName: "IMG_4021.MOV",
        filePath: "/tmp/staging/IMG_4021.MOV",
        sizeBytes: 1024 * 1024 * 25,
      },
      {
        fileName: "photo.jpg",
        filePath: "/tmp/staging/photo.jpg",
        sizeBytes: 1024 * 500,
      },
    ];

    render(<MobileReceivedList files={files} />);
    expect(screen.getByText("Received Media (2)")).toBeInTheDocument();
    expect(screen.getByText("IMG_4021.MOV")).toBeInTheDocument();
    expect(screen.getByText("photo.jpg")).toBeInTheDocument();
    expect(screen.getByText("25 MB")).toBeInTheDocument();
    expect(screen.getByText("500 KB")).toBeInTheDocument();
    expect(screen.getAllByText("Saved")).toHaveLength(2);
  });

  it("renders MobileUploadModal with QR code, link, and handles copy & close", async () => {
    vi.mocked(mobileApi.startMobileReceiver).mockResolvedValue({
      url: "http://192.168.1.50:49200/?token=abc123xyz",
      ip: "192.168.1.50",
      port: 49200,
      token: "abc123xyz",
      qrSvg: `<svg data-testid="qr-svg"><rect width="100" height="100" /></svg>`,
      stagingDir: "/tmp/staging",
    });

    const onClose = vi.fn();
    render(<MobileUploadModal open={true} onClose={onClose} />);

    expect(screen.getByText("Receive Photos & Videos from Phone")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("http://192.168.1.50:49200/?token=abc123xyz")).toBeInTheDocument();
    });

    expect(screen.getByTestId("qr-svg")).toBeInTheDocument();
    expect(screen.getByText("Ready for scan")).toBeInTheDocument();

    // Copy action
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    const copyBtn = screen.getByTitle("Copy web uploader link");
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "http://192.168.1.50:49200/?token=abc123xyz"
    );

    // Cancel / Close action
    const cancelBtn = screen.getByText("Cancel");
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(mobileApi.stopMobileReceiver).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("renders 'Receive from Phone' button in DropzoneCard and calls onOpenMobile", () => {
    const onOpenMobile = vi.fn();
    const onSelectPaths = vi.fn();

    render(
      <DropzoneCard onSelectPaths={onSelectPaths} onOpenMobile={onOpenMobile} />
    );

    const mobileBtn = screen.getByRole("button", { name: /Receive from Phone/i });
    expect(mobileBtn).toBeInTheDocument();

    fireEvent.click(mobileBtn);
    expect(onOpenMobile).toHaveBeenCalledOnce();
  });
});
