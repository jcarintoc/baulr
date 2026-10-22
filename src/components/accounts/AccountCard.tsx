import {
  IconCircleCheck,
  IconAlertCircle,
  IconExternalLink,
  IconUnlink,
} from "@tabler/icons-react";
import { ProviderIcon } from "@/components/common/ProviderIcons";
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

  return (
    <Card className="bg-card/75 border-border">
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-muted text-foreground border border-border flex items-center justify-center">
            <ProviderIcon provider={account.provider} className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-sm text-foreground">
                {account.name}
              </h4>
              {account.accountEmail && (
                <span
                  className="text-[11px] text-muted-foreground font-mono truncate max-w-[180px] sm:max-w-[240px]"
                  title={account.accountEmail}
                >
                  {account.accountEmail}
                </span>
              )}
            </div>
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
