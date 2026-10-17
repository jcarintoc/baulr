import { IconArchive, IconSearch } from "@tabler/icons-react";
import { formatBytes } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface VaultBrowserHeaderProps {
  filesCount: number;
  totalBytes: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function VaultBrowserHeader({
  filesCount,
  totalBytes,
  searchQuery,
  onSearchChange,
}: VaultBrowserHeaderProps) {
  return (
    <Card className="bg-card/75 border-border">
      <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <IconArchive className="size-5 text-vault-accent-text" />
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              Vault Directory ({filesCount} {filesCount === 1 ? "item" : "items"})
            </h3>
            <p className="text-xs text-muted-foreground tabular-nums">
              Total pooled archive: {formatBytes(totalBytes)}
            </p>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <IconSearch className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search vault files..."
            className="pl-8 text-xs bg-muted/30 border-border"
          />
        </div>
      </CardContent>
    </Card>
  );
}
