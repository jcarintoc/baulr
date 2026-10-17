import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BandwidthMenu } from "@/components/common/BandwidthMenu";
import { useBandwidthStore } from "@/store/useBandwidthStore";
import * as bandwidthApi from "@/lib/api/bandwidth";

vi.mock("@/lib/api/bandwidth", () => ({
  fetchBandwidthLimit: vi.fn(),
  updateBandwidthLimit: vi.fn(),
}));

describe("BandwidthMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBandwidthStore.setState({
      currentRate: "off",
      displayLabel: "Unlimited",
      isLoading: false,
      error: null,
    });
  });

  it("renders trigger button with initial Unlimited label", () => {
    render(<BandwidthMenu />);
    const trigger = screen.getByRole("button", { name: /Upload speed limit/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent("Unlimited");
  });

  it("opens menu on click and lists all speed presets", async () => {
    render(<BandwidthMenu />);
    const trigger = screen.getByRole("button", { name: /Upload speed limit/i });
    fireEvent.click(trigger);

    expect(await screen.findByText("Upload Speed Limit")).toBeInTheDocument();
    expect(screen.getByText("Cap background upload speed")).toBeInTheDocument();
    expect(screen.getByText("25 MB/s")).toBeInTheDocument();
    expect(screen.getByText("10 MB/s")).toBeInTheDocument();
    expect(screen.getByText("5 MB/s")).toBeInTheDocument();
    expect(screen.getByText("2 MB/s")).toBeInTheDocument();
  });

  it("selects a preset option and updates the bandwidth limit", async () => {
    vi.mocked(bandwidthApi.updateBandwidthLimit).mockResolvedValue({
      rate: "10M:off",
    });

    render(<BandwidthMenu />);
    const trigger = screen.getByRole("button", { name: /Upload speed limit/i });
    fireEvent.click(trigger);

    const presetOption = await screen.findByText("10 MB/s");
    fireEvent.click(presetOption);

    await waitFor(() => {
      expect(bandwidthApi.updateBandwidthLimit).toHaveBeenCalledWith("10M:off");
      expect(trigger).toHaveTextContent("10 MB/s");
    });
  });

  it("allows setting a custom bandwidth limit", async () => {
    vi.mocked(bandwidthApi.updateBandwidthLimit).mockResolvedValue({
      rate: "12M:off",
    });

    render(<BandwidthMenu />);
    const trigger = screen.getByRole("button", { name: /Upload speed limit/i });
    fireEvent.click(trigger);

    const input = await screen.findByPlaceholderText("Custom");
    fireEvent.change(input, { target: { value: "12" } });

    const setButton = screen.getByRole("button", { name: "Set" });
    expect(setButton).not.toBeDisabled();
    fireEvent.click(setButton);

    await waitFor(() => {
      expect(bandwidthApi.updateBandwidthLimit).toHaveBeenCalledWith("12M:off");
      expect(trigger).toHaveTextContent("12 MB/s");
    });
  });

  it("stops keydown propagation in custom input to prevent typeahead focus theft", async () => {
    render(<BandwidthMenu />);
    const trigger = screen.getByRole("button", { name: /Upload speed limit/i });
    fireEvent.click(trigger);

    const input = await screen.findByPlaceholderText("Custom");
    input.focus();

    // Fire keydown with numbers that match presets (e.g. '1', '2')
    const event1 = new KeyboardEvent("keydown", { key: "1", bubbles: true });
    const stopPropagationSpy = vi.spyOn(event1, "stopPropagation");
    input.dispatchEvent(event1);

    expect(stopPropagationSpy).toHaveBeenCalled();
  });
});
