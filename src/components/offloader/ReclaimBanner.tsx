import { IconShieldCheck, IconSparkles } from "@tabler/icons-react";
import { formatBytes } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ReclaimBannerProps {
  totalReclaimBytes: number;
  itemCount: number;
  onReclaim: () => void;
  onDismiss: () => void;
}

export function ReclaimBanner({
  totalReclaimBytes,
  itemCount,
  onReclaim,
  onDismiss,
}: ReclaimBannerProps) {
  const itemLabel = itemCount === 1 ? "file" : "files";

  return (
    <Card className="bg-card/90 border-vault-accent-border">
      <CardContent className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="size-10 rounded-xl bg-vault-accent-muted text-vault-accent-text border border-vault-accent-border flex items-center justify-center shrink-0 mt-0.5">
            <IconShieldCheck className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground">
                {itemCount} {itemLabel} safely backed up
              </h3>
              <Badge variant="outline" className="border-vault-accent-border text-vault-accent-text bg-vault-accent-muted">
                Ready to clean
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
              These files are saved to your cloud. You can now remove the copies on this computer to reclaim{" "}
              <strong className="text-foreground tabular-nums">
                {formatBytes(totalReclaimBytes)}
              </strong>{" "}
              of drive space.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 shrink-0 w-full lg:w-auto pt-3 lg:pt-0 border-t border-border lg:border-t-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onDismiss}
            className="w-full sm:w-auto"
          >
            Keep on this computer
          </Button>
          <Button
            size="sm"
            onClick={onReclaim}
            className="w-full sm:w-auto"
          >
            <IconSparkles />
            <span>Free up {formatBytes(totalReclaimBytes)}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
