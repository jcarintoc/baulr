import { useEffect } from "react";
import { useVaultStore } from "./store/useVaultStore";
import { useViewStore } from "./store/useViewStore";
import { useRemoteFilesStore } from "./store/useRemoteFilesStore";
import { useBandwidthStore } from "./store/useBandwidthStore";
import { AccountCard } from "./components/accounts/AccountCard";
import { OAuthModal } from "./components/accounts/OAuthModal";
import { StoragePoolBar } from "./components/vault/StoragePoolBar";
import { ViewToggle } from "./components/common/ViewToggle";
import { AppHeader } from "./components/common/AppHeader";
import { OffloadWorkspace } from "./components/offloader/OffloadWorkspace";
import { VaultBrowserTable } from "./components/browser/VaultBrowserTable";
import { SettingsPage } from "./components/settings/SettingsPage";
import { Alert, AlertDescription } from "./components/ui/alert";
import { IconRefresh } from "@tabler/icons-react";
import { Button } from "./components/ui/button";

export function App() {
  const {
    quota,
    daemonStatus,
    isLoading,
    isAuthenticating,
    isFinalizing,
    authenticatingProvider,
    error,
    loadQuota,
    loadDaemonStatus,
    connectAccount,
    disconnectAccount,
    cancelOAuth,
  } = useVaultStore();
  const { activeView, previousView, setActiveView } = useViewStore();

  useEffect(() => {
    loadQuota();
    loadDaemonStatus();
    useBandwidthStore
      .getState()
      .init()
      .catch(() => {});
  }, [loadQuota, loadDaemonStatus]);

  const hasConnectedAccounts = Boolean(
    quota?.accounts && quota.accounts.some((a) => a.isConnected),
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none">
      <AppHeader daemonStatus={daemonStatus} />

      {/* Main Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {activeView === "settings" ? (
          <SettingsPage
            daemonStatus={daemonStatus}
            onBack={() => setActiveView(previousView)}
          />
        ) : (
          <>
            {/* View Switcher Bar */}
            <div className="flex items-center justify-between">
              <ViewToggle />
            </div>

            {activeView === "dashboard" ? (
              <div className="flex flex-col gap-6">
                <StoragePoolBar quota={quota} />

                {hasConnectedAccounts && (
                  <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-12">
                      <h3 className="font-semibold text-sm text-foreground">
                        Cloud Accounts (
                        {quota?.accounts.filter((a) => a.isConnected).length ??
                          0}{" "}
                        connected)
                      </h3>
                      <Button
                        size="lg"
                        variant="default"
                        onClick={() => {
                          loadQuota();
                          loadDaemonStatus();
                          useRemoteFilesStore
                            .getState()
                            .fetchFiles()
                            .catch(() => {});
                        }}
                        disabled={isLoading}
                        className="px-3"
                      >
                        <IconRefresh
                          className={isLoading ? "animate-spin" : undefined}
                        />
                        <span>
                          {isLoading ? "Syncing..." : "Sync Accounts"}
                        </span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {quota?.accounts.map((acc) => (
                        <AccountCard
                          key={acc.name}
                          account={acc}
                          onConnect={connectAccount}
                          onDisconnect={disconnectAccount}
                        />
                      ))}
                    </div>
                  </section>
                )}

                <OffloadWorkspace
                  hasConnectedAccounts={hasConnectedAccounts}
                  onConnectDrive={connectAccount}
                />
              </div>
            ) : (
              <VaultBrowserTable />
            )}
          </>
        )}
      </main>

      <OAuthModal
        isOpen={isAuthenticating}
        provider={authenticatingProvider}
        onCancel={cancelOAuth}
        isFinalizing={isFinalizing}
      />
    </div>
  );
}

export default App;
