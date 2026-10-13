import { CheckCircle2, AlertCircle, ExternalLink, Unlink } from "lucide-react";
import {
  GoogleDriveIcon,
  OneDriveIcon,
} from "@/components/common/ProviderIcons";
import { formatBytes } from "@/lib/formatters";
import type { CloudAccount } from "@/lib/bindings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AccountCardProps {
  account: CloudAccount;
  onConnect?: (provider: string) => void;
  onDisconnect?: (provider: string) => void;
}

export function AccountCard({
  account,
  onConnect,
  onDisconnect,
}: AccountCardProps) {
  const isConnected = account.isConnected;
  const isGoogle = account.provider.toLowerCase().includes("gdrive");

  return (
    <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-700/50 flex items-center justify-center">
          {isGoogle ? (
            <GoogleDriveIcon className="size-5" />
          ) : (
            <OneDriveIcon className="size-5" />
          )}
        </div>
        <div>
          <h4 className="font-medium text-sm text-neutral-100">
            {account.name}
          </h4>
          <p className="text-xs text-neutral-400 tabular-nums">
            {formatBytes(account.usedBytes ?? 0)} /{" "}
            {formatBytes(account.totalBytes ?? 0)}
          </p>
        </div>
      </div>

      {isConnected ? (
        <div className="flex items-center gap-2">
          <Badge>
            <CheckCircle2 /> Connected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDisconnect?.(account.provider)}
            className="text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs px-2 cursor-pointer"
            title="Disconnect account"
          >
            <Unlink />
            <span>Disconnect</span>
          </Button>
        </div>
      ) : account.needsAuth ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onConnect?.(account.provider)}
          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-1.5 cursor-pointer"
        >
          <AlertCircle />
          <span>Re-authenticate</span>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onConnect?.(account.provider)}
          className="gap-1.5 text-neutral-300 hover:text-white cursor-pointer"
        >
          <span>Connect</span>
          <ExternalLink className="text-neutral-400" />
        </Button>
      )}
    </div>
  );
}

