import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AccountCard } from "@/components/accounts/AccountCard";
import { OAuthModal } from "@/components/accounts/OAuthModal";
import type { CloudAccount } from "@/lib/bindings";

describe("AccountCard", () => {
  const connectedAccount: CloudAccount = {
    name: "Google Drive",
    provider: "gdrive",
    usedBytes: 5 * 1024 * 1024 * 1024,
    totalBytes: 15 * 1024 * 1024 * 1024,
    isConnected: true,
    needsAuth: false,
  };

  const disconnectedAccount: CloudAccount = {
    name: "OneDrive",
    provider: "onedrive",
    usedBytes: 0,
    totalBytes: 0,
    isConnected: false,
    needsAuth: false,
  };

  const needsAuthAccount: CloudAccount = {
    name: "Google Drive",
    provider: "gdrive",
    usedBytes: 0,
    totalBytes: 0,
    isConnected: false,
    needsAuth: true,
  };

  it("renders connected account with badge and disconnect button", () => {
    const handleDisconnect = vi.fn();
    render(
      <AccountCard
        account={connectedAccount}
        onDisconnect={handleDisconnect}
      />
    );

    expect(screen.getByText("Google Drive")).toBeInTheDocument();
    expect(screen.getByText(/Connected/i)).toBeInTheDocument();

    const disconnectBtn = screen.getByRole("button", { name: /Disconnect/i });
    expect(disconnectBtn).toBeInTheDocument();

    fireEvent.click(disconnectBtn);
    expect(handleDisconnect).toHaveBeenCalledWith("gdrive");
  });

  it("renders disconnected account with connect button", () => {
    const handleConnect = vi.fn();
    render(
      <AccountCard
        account={disconnectedAccount}
        onConnect={handleConnect}
      />
    );

    expect(screen.getByText("OneDrive")).toBeInTheDocument();
    const connectBtn = screen.getByRole("button", { name: /Connect/i });
    expect(connectBtn).toBeInTheDocument();

    fireEvent.click(connectBtn);
    expect(handleConnect).toHaveBeenCalledWith("onedrive");
  });

  it("renders needs-auth account with re-authenticate button", () => {
    const handleConnect = vi.fn();
    render(
      <AccountCard
        account={needsAuthAccount}
        onConnect={handleConnect}
      />
    );

    const reauthBtn = screen.getByRole("button", { name: /Re-authenticate/i });
    expect(reauthBtn).toBeInTheDocument();

    fireEvent.click(reauthBtn);
    expect(handleConnect).toHaveBeenCalledWith("gdrive");
  });

  it("renders Dropbox and Box accounts and handles connect", () => {
    const handleConnect = vi.fn();
    const dropboxAccount: CloudAccount = {
      name: "Dropbox",
      provider: "dropbox",
      usedBytes: 0,
      totalBytes: 2 * 1024 * 1024 * 1024,
      isConnected: false,
      needsAuth: false,
    };
    const boxAccount: CloudAccount = {
      name: "Box",
      provider: "box",
      usedBytes: 0,
      totalBytes: 10 * 1024 * 1024 * 1024,
      isConnected: false,
      needsAuth: false,
    };

    const { rerender } = render(
      <AccountCard account={dropboxAccount} onConnect={handleConnect} />
    );
    expect(screen.getByText("Dropbox")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Connect/i }));
    expect(handleConnect).toHaveBeenCalledWith("dropbox");

    rerender(<AccountCard account={boxAccount} onConnect={handleConnect} />);
    expect(screen.getByText("Box")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Connect/i }));
    expect(handleConnect).toHaveBeenCalledWith("box");
  });
});

describe("OAuthModal", () => {
  it("renders null when closed", () => {
    const { container } = render(
      <OAuthModal isOpen={false} provider="gdrive" onCancel={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders modal with friendly copy and triggers onCancel", () => {
    const handleCancel = vi.fn();
    render(
      <OAuthModal
        isOpen={true}
        provider="gdrive"
        onCancel={handleCancel}
      />
    );

    expect(
      screen.getByText(/Connecting to Google Drive/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/We opened your browser to sign in/i)
    ).toBeInTheDocument();

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(handleCancel).toHaveBeenCalled();
  });

  it("renders modal in finalizing state when browser auth completes", () => {
    render(
      <OAuthModal
        isOpen={true}
        provider="onedrive"
        onCancel={vi.fn()}
        isFinalizing={true}
      />
    );

    expect(screen.getByText(/Finishing setup.../i)).toBeInTheDocument();
    expect(
      screen.getByText(/Authorization received. Setting up your cloud storage now/i)
    ).toBeInTheDocument();

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    expect(cancelBtn).toBeDisabled();
  });

  it("renders with human-friendly copy and zero banned technical jargon", () => {
    render(
      <OAuthModal
        isOpen={true}
        provider="gdrive"
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByText(/token|payload|endpoint|daemon|hash/i)).not.toBeInTheDocument();
    expect(screen.getByText("Waiting for authorization in browser")).toBeInTheDocument();
  });

  it("renders OAuthModal correctly for Dropbox and Box", () => {
    const { rerender } = render(
      <OAuthModal isOpen={true} provider="dropbox" onCancel={vi.fn()} />
    );
    expect(screen.getByText(/Connecting to Dropbox/i)).toBeInTheDocument();

    rerender(<OAuthModal isOpen={true} provider="box" onCancel={vi.fn()} />);
    expect(screen.getByText(/Connecting to Box/i)).toBeInTheDocument();
  });
});
