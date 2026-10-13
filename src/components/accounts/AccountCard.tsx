import { Cloud, CheckCircle2 } from "lucide-react";
import { formatBytes } from "@/lib/formatters";
import type { CloudAccount } from "@/lib/bindings";

interface AccountCardProps {
  account: CloudAccount;
}

export function AccountCard({ account }: AccountCardProps) {
  return (
    <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
          <Cloud className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <h4 className="font-medium text-sm">{account.name}</h4>
          <p className="text-xs text-neutral-400">
            {formatBytes(account.usedBytes ?? 0)} /{" "}
            {formatBytes(account.totalBytes ?? 0)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Connected
      </div>
    </div>
  );
}
