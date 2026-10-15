import { IconLoader2, IconCheck, IconX, IconArrowDownRight } from "@tabler/icons-react";
import { formatSpeed, formatDuration } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DownloadProgress } from "@/store/useRemoteFilesStore";

interface DownloadBannerProps {
  downloads: DownloadProgress[];
  onDismiss: (path: string) => void;
}

export function DownloadBanner({ downloads, onDismiss }: DownloadBannerProps) {
  if (downloads.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {downloads.map((item) => {
        const isCompleted = item.status === "completed";
        const isError = item.status === "error";
        const percent = isCompleted
          ? 100
          : item.totalBytes > 0
          ? Math.min(99, Math.round((item.transferredBytes / item.totalBytes) * 100))
          : 0;

        return (
          <Card key={item.path} className="p-3 bg-card/90 border-border flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <IconArrowDownRight className="size-4 text-vault-accent-text shrink-0" />
                <span className="font-medium text-foreground truncate max-w-xs">{item.name}</span>
                <Badge
                  variant="outline"
                  className={
                    isCompleted
                      ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] h-4.5 gap-1"
                      : isError
                      ? "border-destructive/40 text-destructive bg-destructive/10 text-[10px] h-4.5"
                      : "border-vault-accent-border text-vault-accent-text bg-vault-accent-muted text-[10px] h-4.5 gap-1"
                  }
                >
                  {isCompleted ? (
                    <IconCheck className="size-3" />
                  ) : !isError ? (
                    <IconLoader2 className="size-3 animate-spin" />
                  ) : null}
                  <span>{isCompleted ? "Saved to your device" : isError ? "Download failed" : "Downloading"}</span>
                </Badge>
              </div>

              <div className="flex items-center gap-2.5 text-muted-foreground tabular-nums shrink-0">
                {!isCompleted && !isError && item.speedBytesPerSec > 0 && (
                  <span>{formatSpeed(item.speedBytesPerSec)}</span>
                )}
                {!isCompleted && !isError && item.etaSeconds > 0 && (
                  <span>ETA: {formatDuration(item.etaSeconds)}</span>
                )}
                {(isCompleted || isError) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDismiss(item.path)}
                    className="size-5 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Dismiss"
                  >
                    <IconX className="size-3" />
                  </Button>
                )}
              </div>
            </div>

            {!isCompleted && !isError && (
              <Progress value={percent} className="h-1.5" />
            )}

            {item.destinationDir && (
              <p className="text-[11px] text-muted-foreground/80 truncate">
                Destination: {item.destinationDir}
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
