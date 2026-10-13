import { CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { GoogleDriveIcon, OneDriveIcon } from "@/components/common/ProviderIcons";
import { formatBytes } from "@/lib/formatters";
import type { CloudAccount } from "@/lib/bindings";

interface AccountCardProps {
  account: CloudAccount;
  onConnect?: (provider: string) => void;
}

export function AccountCard({ account, onConnect }: AccountCardProps) {
  const isConnected = account.isConnected;
  const isGoogle = account.provider.toLowerCase().includes("gdrive");

  return (
    <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-700/50 flex items-center justify-center">
          {isGoogle ? <GoogleDriveIcon className="w-5 h-5" /> : <OneDriveIcon className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="font-medium text-sm text-neutral-100">{account.name}</h4>
          <p className="text-xs text-neutral-400 tabular-nums">
            {formatBytes(account.usedBytes ?? 0)} / {formatBytes(account.totalBytes ?? 0)}
          </p>
        </div>
      </div>

      {isConnected ? (
        <div className="flex items-center gap-1.5 text-xs text-vault-accent-text bg-vault-accent-muted px-2.5 py-1 rounded-full border border-vault-accent-border">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Connected</span>
        </div>
      ) : account.needsAuth ? (
        <button
          onClick={() => onConnect?.(account.provider)}
          className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30 transition cursor-pointer"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Re-authenticate</span>
        </button>
      ) : (
        <button
          onClick={() => onConnect?.(account.provider)}
          className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-lg border border-neutral-700 transition cursor-pointer"
        >
          <span>Connect</span>
          <ExternalLink className="w-3 h-3 text-neutral-400" />
        </button>
      )}
    </div>
  );
}
