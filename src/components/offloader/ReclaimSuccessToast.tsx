import { IconCircleCheck } from "@tabler/icons-react";
import { formatBytes } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReclaimSuccessToastProps {
  bytes: number;
  count: number;
  onDismiss: () => void;
}

export function ReclaimSuccessToast({
  bytes,
  onDismiss,
}: ReclaimSuccessToastProps) {
  return (
    <Card className="p-3 px-4 flex items-center justify-between text-xs bg-card border-border">
      <div className="flex items-center gap-2 text-foreground/90">
        <IconCircleCheck className="size-4 text-vault-accent-text shrink-0" />
        <span>
          Freed up <strong className="text-foreground tabular-nums">{formatBytes(bytes)}</strong>. Files removed from this computer.
        </span>
      </div>
      <Button variant="ghost" size="sm" onClick={onDismiss} className="h-7 text-xs">
        Dismiss
      </Button>
    </Card>
  );
}
