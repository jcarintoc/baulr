import { formatBytes, formatSpeed, formatDuration } from "@/lib/formatters";
import {
  IconLoader2,
  IconCircleCheck,
  IconArrowUpRight,
} from "@tabler/icons-react";
import type { TransferQueueItem } from "@/store/useTransferStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface TransferQueueProps {
  items: TransferQueueItem[];
}

export function TransferQueue({ items }: TransferQueueProps) {
  if (items.length === 0) return null;

  return (
    <Card className="bg-card/75 border-border">
      <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
        <CardTitle className="font-semibold text-sm text-foreground">
          Active Offload Queue ({items.length})
        </CardTitle>
        <Badge variant="outline" className="border-vault-accent-border text-vault-accent-text bg-vault-accent-muted gap-1.5">
          <IconLoader2 className="animate-spin" />
          <span>Backing up to Cloud Vault</span>
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 p-6 pt-0">
        {items.map((item) => {
          const percent = Math.min(
            100,
            Math.round((item.transferredBytes / item.sizeBytes) * 100)
          );

          return (
            <Card
              key={item.id}
              className="p-4 bg-muted/40 border-border flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <IconArrowUpRight className="size-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground tabular-nums">
                  <span>{formatSpeed(item.speedBytesPerSec)}</span>
                  <span>ETA: {formatDuration(item.etaSeconds)}</span>
                </div>
              </div>

              <Progress value={percent} className="w-full" />

              <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums pt-0.5">
                <span>
                  {formatBytes(item.transferredBytes)} / {formatBytes(item.sizeBytes)} ({percent}%)
                </span>
                <span className="flex items-center gap-1 text-vault-accent-text">
                  <IconCircleCheck className="size-3" />
                  <span>Safely backed up</span>
                </span>
              </div>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
