import {
  IconCircleCheck,
  IconAlertCircle,
  IconExternalLink,
  IconUnlink,
} from "@tabler/icons-react";
import {
  GoogleDriveIcon,
  OneDriveIcon,
} from "@/components/common/ProviderIcons";
import { formatBytes } from "@/lib/formatters";
import type { CloudAccount } from "@/lib/bindings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <Card className="bg-card/75 border-border">
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-muted text-foreground border border-border flex items-center justify-center">
            {isGoogle ? (
              <GoogleDriveIcon className="size-5" />
            ) : (
              <OneDriveIcon className="size-5" />
            )}
          </div>
          <div>
            <h4 className="font-medium text-sm text-foreground">
              {account.name}
            </h4>
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatBytes(account.usedBytes ?? 0)} /{" "}
              {formatBytes(account.totalBytes ?? 0)}
            </p>
          </div>
        </div>

        {isConnected ? (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-vault-accent-border text-vault-accent-text bg-vault-accent-muted"
            >
              <IconCircleCheck />
              <span>Connected</span>
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDisconnect?.(account.provider)}
              title="Disconnect account"
            >
              <IconUnlink />
              <span>Disconnect</span>
            </Button>
          </div>
        ) : account.needsAuth ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onConnect?.(account.provider)}
          >
            <IconAlertCircle />
            <span>Re-authenticate</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onConnect?.(account.provider)}
          >
            <span>Connect</span>
            <IconExternalLink />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
