import { IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeSelector } from "./ThemeSelector";
import { BandwidthMenu } from "./BandwidthMenu";
import type { DaemonStatus } from "@/lib/bindings";

interface AppHeaderProps {
  isLoading: boolean;
  daemonStatus: DaemonStatus | null;
  onSync: () => void;
}

export function AppHeader({ isLoading, daemonStatus, onSync }: AppHeaderProps) {
  return (
    <header className="border-b border-border px-6 py-4 flex items-center justify-between bg-card/60 backdrop-blur sticky top-0 z-10">
      <div data-tauri-drag-region className="flex items-center gap-3">
        <img src="/baulr.svg" alt="Baulr" className="size-12" />
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
        <BandwidthMenu />
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
