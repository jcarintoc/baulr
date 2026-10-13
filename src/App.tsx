import { useEffect } from "react";
import { useVaultStore } from "./store/useVaultStore";
import { useDaemonStore } from "./store/useDaemonStore";
import { AccountCard } from "./components/accounts/AccountCard";
import { StoragePoolBar } from "./components/vault/StoragePoolBar";
import {
  HardDrive,
  ArrowUpCircle,
  RefreshCw,
} from "lucide-react";

export function App() {
  const { quota, isLoading, error, loadQuota } = useVaultStore();
  const { status: daemonStatus, loadStatus: loadDaemonStatus } = useDaemonStore();

  useEffect(() => {
    loadQuota();
    loadDaemonStatus();
  }, [loadQuota, loadDaemonStatus]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans select-none">
      {/* Top Navigation */}
      <header className="border-b border-neutral-800/80 px-6 py-4 flex items-center justify-between bg-neutral-900/40 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <HardDrive className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-lg tracking-tight leading-tight">
              Baulr
            </h1>
            <p className="text-xs text-neutral-400">
              Local-First Unified Cloud Vault
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadQuota();
              loadDaemonStatus();
            }}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 transition"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Sync
          </button>
          {daemonStatus?.isRunning ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Daemon (Port {daemonStatus.port})
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Daemon Initializing
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        {/* Unified Storage Pool Bar */}
        <StoragePoolBar quota={quota} />

        {/* Connected Cloud Accounts */}
        <section className="flex flex-col gap-3">
          <h3 className="text-xs uppercase font-medium tracking-wider text-neutral-400">
            Connected Accounts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quota?.accounts.map((acc) => (
              <AccountCard key={acc.name} account={acc} />
            ))}
          </div>
        </section>

        {/* Offload Dropzone */}
        <section className="p-10 rounded-2xl border-2 border-dashed border-neutral-800 hover:border-sky-500/50 bg-neutral-900/20 hover:bg-sky-500/5 transition flex flex-col items-center justify-center gap-3 text-center cursor-pointer group">
          <div className="w-14 h-14 rounded-2xl bg-neutral-800 group-hover:bg-sky-500/20 group-hover:text-sky-400 text-neutral-400 flex items-center justify-center transition">
            <ArrowUpCircle className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-medium text-base text-neutral-200">
              Drag and drop folders or files here to offload
            </h4>
            <p className="text-xs text-neutral-400 mt-1">
              Files are securely transferred to your pooled cloud vault and
              verified before local cleanup.
            </p>
          </div>
          <button className="mt-2 text-xs font-medium px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition shadow-lg shadow-sky-600/20">
            Select Folder to Free Up Space
          </button>
        </section>
      </main>
    </div>
  );
}

export default App;
