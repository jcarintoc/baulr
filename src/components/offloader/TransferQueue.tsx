import { formatBytes, formatSpeed, formatDuration } from "@/lib/formatters";
import {
  IconLoader2,
  IconCircleCheck,
  IconArrowUpRight,
  IconX,
} from "@tabler/icons-react";
import type { TransferQueueItem } from "@/store/useTransferStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TransferQueueProps {
  items: TransferQueueItem[];
  onCancel?: (jobId: number) => void;
}

export function TransferQueue({ items, onCancel }: TransferQueueProps) {
  if (items.length === 0) return null;

  return (
    <Card className="bg-card/75 border-border">
      <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
        <CardTitle className="font-semibold text-sm text-foreground">
          Active Offload Queue ({items.length})
        </CardTitle>
        <Badge
          variant="outline"
          className="border-vault-accent-border text-vault-accent-text bg-vault-accent-muted gap-1.5"
        >
          <IconLoader2 className="animate-spin" />
          <span>Backing up to Cloud Vault</span>
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 p-6 pt-0">
        {items.map((item) => {
          const percent = Math.min(
            100,
            Math.round((item.transferredBytes / (item.sizeBytes || 1)) * 100)
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
                  {item.speedBytesPerSec > 0 && (
                    <span>{formatSpeed(item.speedBytesPerSec)}</span>
                  )}
                  {item.etaSeconds > 0 && (
                    <span>ETA: {formatDuration(item.etaSeconds)}</span>
                  )}
                  {item.jobId && onCancel && item.status === "uploading" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCancel(item.jobId!)}
                      title="Cancel transfer"
                      className="size-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <IconX className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <Progress value={percent} className="w-full" />

              <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums pt-0.5">
                <span>
                  {formatBytes(item.transferredBytes)} / {formatBytes(item.sizeBytes)} ({percent}%)
                </span>
                {item.status === "verified" ? (
                  <span className="flex items-center gap-1 text-vault-accent-text">
                    <IconCircleCheck className="size-3" />
                    <span>Safely backed up</span>
                  </span>
                ) : item.status === "error" ? (
                  <span className="text-destructive">{item.error ?? "Upload failed"}</span>
                ) : (
                  <span className="text-muted-foreground">Backing up...</span>
                )}
              </div>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
