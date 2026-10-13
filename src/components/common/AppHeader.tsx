import { IconVault, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeSelector } from "./ThemeSelector";
import type { DaemonStatus } from "@/lib/bindings";

interface AppHeaderProps {
  isLoading: boolean;
  daemonStatus: DaemonStatus | null;
  onSync: () => void;
}

export function AppHeader({
  isLoading,
  daemonStatus,
  onSync,
}: AppHeaderProps) {
  return (
    <header className="border-b border-border px-6 py-4 flex items-center justify-between bg-card/60 backdrop-blur sticky top-0 z-10">
      <div data-tauri-drag-region className="flex items-center gap-3">
        <div className="size-8 rounded-lg bg-vault-accent-muted text-vault-accent-text border border-vault-accent-border flex items-center justify-center">
          <IconVault className="size-4" />
        </div>
        <div>
          <h1 className="font-semibold text-base tracking-tight leading-tight text-foreground">
            Baulr
          </h1>
          <p className="text-xs text-muted-foreground">
            Local-First Unified Cloud Vault
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <ThemeSelector />

        <Button
          variant="outline"
          size="sm"
          onClick={onSync}
          disabled={isLoading}
        >
          <IconRefresh className={isLoading ? "animate-spin" : undefined} />
          <span>Sync</span>
        </Button>

        <Badge
          variant="outline"
          className={
            daemonStatus?.isRunning
              ? "gap-1.5 border-vault-accent-border text-vault-accent-text bg-vault-accent-muted"
              : "gap-1.5 border-amber-500/20 text-amber-400 bg-amber-500/10"
          }
        >
          <span
            className={`size-1.5 rounded-full ${
              daemonStatus?.isRunning ? "bg-vault-accent" : "bg-amber-400"
            }`}
          />
          <span>
            {daemonStatus?.isRunning
              ? "Vault engine active"
              : "Vault engine starting"}
          </span>
        </Badge>
      </div>
    </header>
  );
}
