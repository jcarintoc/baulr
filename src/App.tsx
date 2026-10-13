import { useEffect } from "react";
import { useVaultStore } from "./store/useVaultStore";
import { useDaemonStore } from "./store/useDaemonStore";
import { useViewStore } from "./store/useViewStore";
import { AccountCard } from "./components/accounts/AccountCard";
import { OAuthModal } from "./components/accounts/OAuthModal";
import { StoragePoolBar } from "./components/vault/StoragePoolBar";
import { ViewToggle } from "./components/common/ViewToggle";
import { ThemeSelector } from "./components/common/ThemeSelector";
import { OffloadWorkspace } from "./components/offloader/OffloadWorkspace";
import { VaultBrowserTable } from "./components/browser/VaultBrowserTable";
import { Vault, RefreshCw } from "lucide-react";

export function App() {
  const {
    quota,
    isLoading,
    isAuthenticating,
    authenticatingProvider,
    error,
    loadQuota,
    connectAccount,
    disconnectAccount,
    cancelOAuth,
  } = useVaultStore();
  const { status: daemonStatus, loadStatus: loadDaemonStatus } =
    useDaemonStore();
  const { activeView } = useViewStore();

  useEffect(() => {
    loadQuota();
    loadDaemonStatus();
  }, [loadQuota, loadDaemonStatus]);

  const hasConnectedAccounts = Boolean(
    quota?.accounts && quota.accounts.some((a) => a.isConnected)
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans select-none">
      {/* Titlebar / Header */}
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between bg-neutral-900/60 backdrop-blur sticky top-0 z-10">
        <div data-tauri-drag-region className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-vault-accent-muted text-vault-accent-text border border-vault-accent-border flex items-center justify-center">
            <Vault className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-semibold text-base tracking-tight leading-tight text-white">
              Baulr
            </h1>
            <p className="text-xs text-neutral-300">
              Local-First Unified Cloud Vault
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeSelector />

          <button
            onClick={() => {
              loadQuota();
              loadDaemonStatus();
            }}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 transition cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Sync</span>
          </button>

          {daemonStatus?.isRunning ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-vault-accent-muted text-vault-accent-text border border-vault-accent-border">
              <span className="w-1.5 h-1.5 rounded-full bg-vault-accent" />
              <span>Vault engine active</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Vault engine starting</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* View Switcher Bar */}
        <div className="flex items-center justify-between">
          <ViewToggle />
        </div>

        {activeView === "dashboard" ? (
          <div className="flex flex-col gap-6">
            {/* Storage Pool Telemetry */}
            <StoragePoolBar quota={quota} />

            {/* Cloud Accounts Management */}
            {hasConnectedAccounts && (
              <section className="flex flex-col gap-3">
                <h3 className="font-semibold text-sm text-neutral-200">
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

            {/* Offload Workspace */}
            <OffloadWorkspace
              hasConnectedAccounts={hasConnectedAccounts}
              onConnectDrive={connectAccount}
            />
          </div>
        ) : (
          <VaultBrowserTable />
        )}
      </main>

      {/* OAuth Authorization Modal */}
      <OAuthModal
        isOpen={isAuthenticating}
        provider={authenticatingProvider}
        onCancel={cancelOAuth}
      />
    </div>
  );
}

export default App;
