import { formatBytes } from "@/lib/formatters";
import { IconCloudCheck } from "@tabler/icons-react";
import type { VaultQuota } from "@/lib/bindings";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StoragePoolBarProps {
  quota: VaultQuota | null;
}

export function StoragePoolBar({ quota }: StoragePoolBarProps) {
  const used = quota?.usedBytes ?? 0;
  const total = quota?.totalBytes ?? 1;
  const free = quota?.freeBytes ?? 0;
  const usedPercent = Math.min(100, Math.round((used / total) * 100));

  return (
    <Card className="bg-card/75 border-border">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Combined Storage Pool
            </h2>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-1 tabular-nums">
              {formatBytes(free)}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                available of {formatBytes(total)}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground/90 tabular-nums">
              {formatBytes(used)} used
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
              {usedPercent}% capacity
            </p>
          </div>
        </div>

        <Progress value={usedPercent} className="w-full" />

        <div className="flex items-center gap-6 pt-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-vault-accent" />
            <span className="tabular-nums">Used: {formatBytes(used)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-muted-foreground/30" />
            <span className="tabular-nums">Remaining: {formatBytes(free)}</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-muted-foreground">
            <IconCloudCheck className="size-4 text-vault-accent-text" />
            <span>Safe backup verification enabled</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
