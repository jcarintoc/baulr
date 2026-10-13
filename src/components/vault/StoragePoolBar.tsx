import { formatBytes } from "@/lib/formatters";
import { ShieldCheck } from "lucide-react";
import type { VaultQuota } from "@/lib/bindings";

interface StoragePoolBarProps {
  quota: VaultQuota | null;
}

export function StoragePoolBar({ quota }: StoragePoolBarProps) {
  const used = quota?.usedBytes ?? 0;
  const total = quota?.totalBytes ?? 1;
  const free = quota?.freeBytes ?? 0;
  const usedPercent = Math.min(100, Math.round((used / total) * 100));

  return (
    <section className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-100">
            Combined Storage Pool
          </h2>
          <p className="text-2xl font-bold tracking-tight text-white mt-1 tabular-nums">
            {formatBytes(free)}{" "}
            <span className="text-sm font-normal text-neutral-400">
              available of {formatBytes(total)}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-neutral-200 tabular-nums">
            {formatBytes(used)} used
          </p>
          <p className="text-xs text-neutral-400 mt-0.5 tabular-nums">
            {usedPercent}% capacity
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-neutral-700/40">
        <div
          className="h-full bg-sky-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${usedPercent}%` }}
        />
      </div>

      <div className="flex items-center gap-6 pt-1 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <span className="tabular-nums">Used: {formatBytes(used)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
          <span className="tabular-nums">Remaining: {formatBytes(free)}</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-neutral-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Safe backup verification enabled</span>
        </div>
      </div>
    </section>
  );
}
