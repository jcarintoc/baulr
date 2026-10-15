import { useEffect } from "react";
import { useVaultStore } from "./store/useVaultStore";
import { useViewStore } from "./store/useViewStore";
import { AccountCard } from "./components/accounts/AccountCard";
import { OAuthModal } from "./components/accounts/OAuthModal";
import { StoragePoolBar } from "./components/vault/StoragePoolBar";
import { ViewToggle } from "./components/common/ViewToggle";
import { AppHeader } from "./components/common/AppHeader";
import { OffloadWorkspace } from "./components/offloader/OffloadWorkspace";
import { VaultBrowserTable } from "./components/browser/VaultBrowserTable";
import { Alert, AlertDescription } from "./components/ui/alert";

export function App() {
  const {
    quota,
    daemonStatus,
    isLoading,
    isAuthenticating,
    authenticatingProvider,
    error,
    loadQuota,
    loadDaemonStatus,
    connectAccount,
    disconnectAccount,
    cancelOAuth,
  } = useVaultStore();
  const { activeView } = useViewStore();

  useEffect(() => {
    loadQuota();
    loadDaemonStatus();
  }, [loadQuota, loadDaemonStatus]);

  const hasConnectedAccounts = Boolean(
    quota?.accounts && quota.accounts.some((a) => a.isConnected)
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none">
      <AppHeader
        isLoading={isLoading}
        daemonStatus={daemonStatus}
        onSync={() => {
          loadQuota();
          loadDaemonStatus();
        }}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* View Switcher Bar */}
        <div className="flex items-center justify-between">
          <ViewToggle />
        </div>

        {activeView === "dashboard" ? (
          <div className="flex flex-col gap-6">
            <StoragePoolBar quota={quota} />

            {hasConnectedAccounts && (
              <section className="flex flex-col gap-3">
                <h3 className="font-semibold text-sm text-foreground">
                  Cloud Accounts ({quota?.accounts.filter((a) => a.isConnected).length ?? 0} connected)
                </h3>
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
      </main>

      <OAuthModal
        isOpen={isAuthenticating}
        provider={authenticatingProvider}
        onCancel={cancelOAuth}
      />
    </div>
  );
}

export default App;
