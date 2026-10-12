import { useEffect } from "react";
import { useVaultStore } from "./store/useVaultStore";
import { formatBytes } from "./lib/formatters";
import {
  HardDrive,
  Cloud,
  ArrowUpCircle,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export function App() {
  const { quota, isLoading, error, loadQuota } = useVaultStore();

  useEffect(() => {
    loadQuota();
  }, [loadQuota]);

  const used = quota?.usedBytes ?? 0;
  const total = quota?.totalBytes ?? 1;
  const free = quota?.freeBytes ?? 0;
  const usedPercent = Math.min(100, Math.round((used / total) * 100));

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
            onClick={() => loadQuota()}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 transition"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Sync
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Vault Active
          </div>
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
        <section className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-medium tracking-wider text-neutral-400">
                Combined Storage Pool
              </p>
              <h2 className="text-2xl font-bold tracking-tight mt-0.5">
                {formatBytes(free)}{" "}
                <span className="text-sm font-normal text-neutral-400">
                  available
                </span>
              </h2>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-300">
                {formatBytes(used)} <span className="text-neutral-500">/</span>{" "}
                {formatBytes(total)}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {usedPercent}% utilized
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3.5 bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-neutral-700/40">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${usedPercent}%` }}
            />
          </div>

          <div className="flex items-center gap-6 pt-1 text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>Used: {formatBytes(used)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
              <span>Remaining: {formatBytes(free)}</span>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero-loss cryptographic verify enabled</span>
            </div>
          </div>
        </section>

        {/* Connected Cloud Accounts */}
        <section className="flex flex-col gap-3">
          <h3 className="text-xs uppercase font-medium tracking-wider text-neutral-400">
            Connected Accounts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quota?.accounts.map((acc) => (
              <div
                key={acc.name}
                className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                    <Cloud className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{acc.name}</h4>
                    <p className="text-xs text-neutral-400">
                      {formatBytes(acc.usedBytes)} /{" "}
                      {formatBytes(acc.totalBytes)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connected
                </div>
              </div>
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
