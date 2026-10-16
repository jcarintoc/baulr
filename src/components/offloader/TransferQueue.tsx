import { IconLoader2 } from "@tabler/icons-react";
import type { TransferQueueItem as TransferItemType } from "@/store/useTransferStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TransferQueueItem } from "./TransferQueueItem";

interface TransferQueueProps {
  items: TransferItemType[];
  onDismiss?: (id: string) => void;
}

export function TransferQueue({ items, onDismiss }: TransferQueueProps) {
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
        {items.map((item) => (
          <TransferQueueItem
            key={item.id}
            item={item}
            onDismiss={onDismiss}
          />
        ))}
      </CardContent>
    </Card>
  );
}
