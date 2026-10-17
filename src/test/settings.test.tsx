import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { AppearanceSettingsCard } from "@/components/settings/AppearanceSettingsCard";
import { NetworkSettingsCard } from "@/components/settings/NetworkSettingsCard";
import { AboutSettingsCard } from "@/components/settings/AboutSettingsCard";
import { AppHeader } from "@/components/common/AppHeader";
import { useViewStore } from "@/store/useViewStore";
import { useThemeStore } from "@/store/useThemeStore";
import { useBandwidthStore } from "@/store/useBandwidthStore";
import * as bandwidthApi from "@/lib/api/bandwidth";

vi.mock("@/lib/api/bandwidth", () => ({
  fetchBandwidthLimit: vi.fn(),
  updateBandwidthLimit: vi.fn(),
}));

describe("Settings Surface & Header Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useViewStore.setState({ activeView: "dashboard", previousView: "dashboard" });
    useThemeStore.setState({ theme: "obsidian" });
    useBandwidthStore.setState({
      currentRate: "off",
      displayLabel: "Unlimited",
      isLoading: false,
      error: null,
    });
  });

  describe("AppHeader decluttered state", () => {
    it("renders Sync, Engine status badge, and Settings button without Bandwidth or Theme selectors", () => {
      render(
        <AppHeader
          isLoading={false}
          daemonStatus={{ isRunning: true, port: 5572 }}
          onSync={vi.fn()}
        />
      );

      // Verify essential header controls exist
      expect(screen.getByRole("button", { name: /Sync/i })).toBeInTheDocument();
      expect(screen.getByText("Vault engine active")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();

      // Verify theme dropdown trigger and bandwidth trigger are NOT in the header
      expect(screen.queryByRole("button", { name: /Change color theme/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Upload speed limit/i })).not.toBeInTheDocument();
    });

    it("navigates to settings and back when clicking Settings button", () => {
      render(
        <AppHeader
          isLoading={false}
          daemonStatus={{ isRunning: true, port: 5572 }}
          onSync={vi.fn()}
        />
      );

      const settingsBtn = screen.getByRole("button", { name: "Settings" });
      fireEvent.click(settingsBtn);

      expect(useViewStore.getState().activeView).toBe("settings");
      expect(useViewStore.getState().previousView).toBe("dashboard");

      // Clicking again toggles back to previous view
      fireEvent.click(settingsBtn);
      expect(useViewStore.getState().activeView).toBe("dashboard");
    });
  });

  describe("AppearanceSettingsCard", () => {
    it("renders all themes and switches active theme on click", () => {
      render(<AppearanceSettingsCard />);

      expect(screen.getByText("Appearance & Theme")).toBeInTheDocument();
      expect(screen.getByText("Obsidian")).toBeInTheDocument();
      expect(screen.getByText("Titanium")).toBeInTheDocument();
      expect(screen.getByText("Bronze")).toBeInTheDocument();

      const titaniumBtn = screen.getByText("Titanium").closest("button");
      expect(titaniumBtn).not.toBeNull();
      fireEvent.click(titaniumBtn!);

      expect(useThemeStore.getState().theme).toBe("titanium");
      expect(document.documentElement.getAttribute("data-theme")).toBe("titanium");
    });
  });

  describe("NetworkSettingsCard", () => {
    it("displays presets and updates bandwidth limit on preset click", async () => {
      vi.mocked(bandwidthApi.updateBandwidthLimit).mockResolvedValue({
        rate: "10M:off",
      });

      render(<NetworkSettingsCard />);

      expect(screen.getByText("Network & Transfer Limits")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /10 MB\/s/i })).toBeInTheDocument();

      const presetBtn = screen.getByRole("button", { name: /10 MB\/s/i });
      fireEvent.click(presetBtn);

      await waitFor(() => {
        expect(useBandwidthStore.getState().currentRate).toBe("10M:off");
      });
      expect(screen.getAllByText("10 MB/s").length).toBe(2);
    });

    it("allows entering and applying a custom bandwidth limit", async () => {
      vi.mocked(bandwidthApi.updateBandwidthLimit).mockResolvedValue({
        rate: "15M:off",
      });

      render(<NetworkSettingsCard />);

      const input = screen.getByPlaceholderText("e.g. 15");
      const applyBtn = screen.getByRole("button", { name: "Apply" });

      fireEvent.change(input, { target: { value: "15" } });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(bandwidthApi.updateBandwidthLimit).toHaveBeenCalledWith("15M:off");
        expect(useBandwidthStore.getState().currentRate).toBe("15M:off");
      });
    });
  });

  describe("AboutSettingsCard", () => {
    it("displays daemon status, safety assurances, and desktop version", () => {
      render(
        <AboutSettingsCard
          daemonStatus={{ isRunning: true, port: 5572 }}
        />
      );

      expect(screen.getByText("Vault Engine & Safety")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Verified before removal")).toBeInTheDocument();
      expect(screen.getByText("Non-destructive cleanup")).toBeInTheDocument();
      expect(screen.getByText("Capacity verified")).toBeInTheDocument();
      expect(screen.getByText(/Baulr Desktop v0.1.0/i)).toBeInTheDocument();
    });
  });

  describe("SettingsPage orchestrator", () => {
    it("renders all sections and handles Back to Vault button", () => {
      const handleBack = vi.fn();
      render(
        <SettingsPage
          daemonStatus={{ isRunning: true, port: 5572 }}
          onBack={handleBack}
        />
      );

      expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Back to Vault/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Back to Vault/i }));
      expect(handleBack).toHaveBeenCalledOnce();
    });
  });
});
