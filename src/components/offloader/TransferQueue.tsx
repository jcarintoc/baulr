import { formatBytes, formatSpeed, formatDuration } from "@/lib/formatters";
import { Loader2, CheckCircle2, ArrowUpRight } from "lucide-react";
import type { TransferQueueItem } from "@/store/useTransferStore";

interface TransferQueueProps {
  items: TransferQueueItem[];
}

export function TransferQueue({ items }: TransferQueueProps) {
  if (items.length === 0) return null;

  return (
    <section className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-neutral-200">
          Active Offload Queue ({items.length})
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-vault-accent-text">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Backing up to Cloud Vault</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const percent = Math.min(
            100,
            Math.round((item.transferredBytes / item.sizeBytes) * 100)
          );

          return (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-neutral-900 border border-neutral-800/80 flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-neutral-400" />
                  <span className="font-medium text-neutral-200">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 text-neutral-400 tabular-nums">
                  <span>{formatSpeed(item.speedBytesPerSec)}</span>
                  <span>ETA: {formatDuration(item.etaSeconds)}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-vault-accent rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-400 tabular-nums pt-0.5">
                <span>
                  {formatBytes(item.transferredBytes)} / {formatBytes(item.sizeBytes)} ({percent}%)
                </span>
                <span className="flex items-center gap-1 text-vault-accent-text">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Integrity verified</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
