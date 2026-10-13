import { ShieldCheck, Sparkles } from "lucide-react";
import { formatBytes } from "@/lib/formatters";

interface ReclaimBannerProps {
  totalReclaimBytes: number;
  itemCount: number;
  onReclaim: () => void;
  onDismiss: () => void;
}

export function ReclaimBanner({
  totalReclaimBytes,
  itemCount,
  onReclaim,
  onDismiss,
}: ReclaimBannerProps) {
  const itemLabel = itemCount === 1 ? "file" : "files";

  return (
    <section className="p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-emerald-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
      <div className="flex items-start gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-sm text-white">
              {itemCount} {itemLabel} safely backed up
            </h3>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
              Ready to clean
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl leading-relaxed">
            These files are saved to your cloud. You can now remove the copies on this computer to reclaim{" "}
            <strong className="text-neutral-200 tabular-nums">
              {formatBytes(totalReclaimBytes)}
            </strong>{" "}
            of drive space.
          </p>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 shrink-0 w-full lg:w-auto pt-3 lg:pt-0 border-t border-neutral-800/60 lg:border-t-0">
        <button
          onClick={onDismiss}
          className="text-xs text-neutral-400 hover:text-white px-3.5 py-2 rounded-lg border border-neutral-800 hover:border-neutral-700 transition cursor-pointer text-center w-full sm:w-auto"
        >
          Keep on this computer
        </button>
        <button
          onClick={onReclaim}
          className="text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Free up {formatBytes(totalReclaimBytes)}</span>
        </button>
      </div>
    </section>
  );
}
