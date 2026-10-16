import { formatBytes, formatSpeed, formatDuration } from "@/lib/formatters";
import {
  IconCircleCheck,
  IconArrowUpRight,
  IconX,
} from "@tabler/icons-react";
import type { TransferQueueItem as TransferItemType } from "@/store/useTransferStore";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TransferQueueItemProps {
  item: TransferItemType;
  onDismiss?: (id: string) => void;
}

export function TransferQueueItem({ item, onDismiss }: TransferQueueItemProps) {
  const isPreparing = item.status === "preparing";
  const isVerified = item.status === "verified";
  const isQueued = item.status === "queued";
  const isError = item.status === "error";

  const percent =
    isPreparing || isQueued
      ? 0
      : isVerified
      ? 100
      : Math.min(99, Math.round((item.transferredBytes / (item.sizeBytes || 1)) * 100));

  return (
    <Card className="p-4 bg-muted/40 ring-primary/20 flex flex-col gap-2.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <IconArrowUpRight className="size-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{item.name}</span>
          {isQueued && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4.5 font-normal text-muted-foreground border-border">
              Queued
            </Badge>
          )}
          {isPreparing && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4.5 font-normal text-muted-foreground border-border animate-pulse">
              Preparing
            </Badge>
          )}
          {isError && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4.5 font-normal text-destructive border-destructive/30">
              Failed
            </Badge>
          )}
          {!isQueued && !isPreparing && !isError && item.targetProvider && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4.5 font-normal text-muted-foreground border-border">
              {item.targetProvider}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 text-muted-foreground tabular-nums">
          {item.speedBytesPerSec > 0 && <span>{formatSpeed(item.speedBytesPerSec)}</span>}
          {item.etaSeconds > 0 && <span>ETA: {formatDuration(item.etaSeconds)}</span>}
          {!isVerified && onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(item.id)}
              title={
                item.status === "uploading"
                  ? "Cancel transfer"
                  : isError
                  ? "Dismiss failed transfer"
                  : "Remove from queue"
              }
              className="size-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
            >
              <IconX />
            </Button>
          )}
        </div>
      </div>

      <Progress
        value={isPreparing || isQueued ? 0 : percent}
        className={isPreparing ? "w-full animate-pulse" : "w-full"}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums pt-0.5">
        {isQueued ? (
          <span>Waiting in queue...</span>
        ) : isPreparing ? (
          <span>Analyzing files and preparing upload...</span>
        ) : (
          <>
            <span>
              {formatBytes(item.transferredBytes)} / {formatBytes(item.sizeBytes)} ({percent}%)
            </span>
            {isVerified ? (
              <span className="flex items-center gap-1 text-vault-accent-text">
                <IconCircleCheck className="size-3" />
                <span>Safely backed up{item.targetProvider ? ` to ${item.targetProvider}` : ""}</span>
              </span>
            ) : isError ? (
              <span className="text-destructive font-medium">{item.error ?? "Upload failed"}</span>
            ) : (
              <span className="text-muted-foreground">
                {item.targetProvider ? `Backing up to ${item.targetProvider}...` : "Backing up..."}
              </span>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
