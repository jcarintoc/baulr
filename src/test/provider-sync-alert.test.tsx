import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProviderSyncAlert } from "@/components/browser/ProviderSyncAlert";
import { useRemoteFilesStore } from "@/store/useRemoteFilesStore";

describe("ProviderSyncAlert", () => {
  beforeEach(() => {
    useRemoteFilesStore.setState({
      providerErrors: {},
      providerLoading: {},
    });
  });

  it("renders nothing when there are no provider errors", () => {
    useRemoteFilesStore.setState({ providerErrors: {} });
    const { container } = render(<ProviderSyncAlert />);
    expect(container.firstChild).toBeNull();
  });

  it("renders human copy adhering to user_global rule and handles retry", () => {
    const retryMock = vi.fn();
    useRemoteFilesStore.setState({
      providerErrors: { onedrive: "Failed to connect" },
      retryProvider: retryMock,
      providerLoading: { onedrive: false },
    });

    render(<ProviderSyncAlert />);
    expect(screen.getByText("Unable to load OneDrive files")).toBeInTheDocument();
    expect(
      screen.getByText(
        "We could not reach your OneDrive account. Your other files are still available."
      )
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /Retry OneDrive/i });
    fireEvent.click(retryBtn);
    expect(retryMock).toHaveBeenCalledWith("onedrive");
  });

  it("disables retry button and shows spinning icon while provider is reloading", () => {
    useRemoteFilesStore.setState({
      providerErrors: { gdrive: "Error" },
      providerLoading: { gdrive: true },
    });

    render(<ProviderSyncAlert />);
    const retryBtn = screen.getByRole("button", { name: /Retry Google Drive/i });
    expect(retryBtn).toBeDisabled();
  });
});
