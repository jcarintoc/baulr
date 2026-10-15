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
      <CardHeader className="flex flex-row items-center justify-between">
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

      <CardContent className="flex flex-col gap-3">
        {items.map((item) => {
          const isPreparing = item.status === "preparing";
          const isVerified = item.status === "verified";
          const percent = isPreparing
            ? 0
            : isVerified
            ? 100
            : Math.min(
                99,
                Math.round(
                  (item.transferredBytes / (item.sizeBytes || 1)) * 100,
                ),
              );

          return (
            <Card
              key={item.id}
              className="p-4 bg-muted/40 ring-primary/20 flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <IconArrowUpRight className="size-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {item.name}
                  </span>
                  {isPreparing ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 h-4.5 font-normal text-muted-foreground border-border animate-pulse"
                    >
                      Preparing
                    </Badge>
                  ) : item.targetProvider ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 h-4.5 font-normal text-muted-foreground border-border"
                    >
                      {item.targetProvider}
                    </Badge>
                  ) : null}
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

              <Progress
                value={isPreparing ? 0 : percent}
                className={isPreparing ? "w-full animate-pulse" : "w-full"}
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums pt-0.5">
                {isPreparing ? (
                  <span>Analyzing files and preparing upload...</span>
                ) : (
                  <>
                    <span>
                      {formatBytes(item.transferredBytes)} /{" "}
                      {formatBytes(item.sizeBytes)} ({percent}%)
                    </span>
                    {item.status === "verified" ? (
                      <span className="flex items-center gap-1 text-vault-accent-text">
                        <IconCircleCheck className="size-3" />
                        <span>
                          Safely backed up
                          {item.targetProvider
                            ? ` to ${item.targetProvider}`
                            : ""}
                        </span>
                      </span>
                    ) : item.status === "error" ? (
                      <span className="text-destructive">
                        {item.error ?? "Upload failed"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {item.targetProvider
                          ? `Backing up to ${item.targetProvider}...`
                          : "Backing up..."}
                      </span>
                    )}
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
