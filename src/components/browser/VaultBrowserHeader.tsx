import { IconArchive, IconSearch, IconX } from "@tabler/icons-react";
import { formatBytes } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

interface VaultBrowserHeaderProps {
  filesCount: number;
  totalBytes: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isCheckingCloud?: boolean;
  checkingTarget?: string;
}

export function VaultBrowserHeader({
  filesCount,
  totalBytes,
  searchQuery,
  onSearchChange,
  isCheckingCloud = false,
  checkingTarget = "cloud accounts",
}: VaultBrowserHeaderProps) {
  const statusLabel = `Checking ${checkingTarget}...`;

  return (
    <Card className="bg-card/75 border-border">
      <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-vault-accent/10 border border-vault-accent/20 flex items-center justify-center text-vault-accent-text shrink-0">
            <IconArchive className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-sm text-foreground tracking-tight">
                Vault Directory
              </h2>
              <Badge variant="secondary" className="text-xs font-normal px-2 py-0 h-5">
                {filesCount} {filesCount === 1 ? "item" : "items"}
              </Badge>
              {isCheckingCloud && (
                <Badge
                  variant="outline"
                  className="text-xs font-normal border-sky-500/30 text-sky-400 bg-sky-500/10 gap-1.5 h-5"
                >
                  <Spinner className="size-3" />
                  <span>{statusLabel}</span>
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground tabular-nums">
              Total pooled archive: {formatBytes(totalBytes)}
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64 md:w-72">
          <IconSearch className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search vault files..."
            className="pl-8 pr-7 text-xs bg-muted/20 border-border/80 focus-visible:ring-1 focus-visible:ring-vault-accent/40 h-8 rounded-lg"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              title="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer transition-colors"
            >
              <IconX className="size-3" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
