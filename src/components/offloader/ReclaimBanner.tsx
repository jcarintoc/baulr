import { ShieldCheck, Trash2, CheckCircle2 } from "lucide-react";
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
  return (
    <section className="p-6 rounded-2xl bg-neutral-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-white">
              {itemCount} {itemCount === 1 ? "Item" : "Items"} Cryptographically Verified
            </h3>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Zero Data Loss Guaranteed</span>
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-lg leading-relaxed">
            Remote copies have passed 100% hash verification. You can safely reclaim{" "}
            <strong className="text-neutral-200 tabular-nums">
              {formatBytes(totalReclaimBytes)}
            </strong>{" "}
            of local drive space. Local files will be moved to your OS Trash.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
        <button
          onClick={onDismiss}
          className="text-xs text-neutral-400 hover:text-white px-3 py-2 rounded-lg border border-neutral-800 hover:border-neutral-700 transition cursor-pointer"
        >
          Keep Local Copies
        </button>
        <button
          onClick={onReclaim}
          className="text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Move to Trash & Free Space</span>
        </button>
      </div>
    </section>
  );
}
