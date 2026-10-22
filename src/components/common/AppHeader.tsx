import { IconSettings } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useViewStore } from "@/store/useViewStore";
import type { DaemonStatus } from "@/lib/bindings";

interface AppHeaderProps {
  daemonStatus: DaemonStatus | null;
}

export function AppHeader({ daemonStatus }: AppHeaderProps) {
  const { activeView, previousView, setActiveView } = useViewStore();

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
        <Badge variant={!daemonStatus?.isRunning ? "secondary" : "ghost"}>
          <span>
            {daemonStatus?.isRunning
              ? "Vault engine active"
              : "Vault engine starting"}
          </span>
        </Badge>

        <Button
          variant={activeView === "settings" ? "secondary" : "outline"}
          size="icon"
          onClick={() =>
            setActiveView(activeView === "settings" ? previousView : "settings")
          }
          aria-label={activeView === "settings" ? "Back to Vault" : "Settings"}
          title={activeView === "settings" ? "Back to Vault" : "Settings"}
        >
          <IconSettings />
        </Button>
      </div>
    </header>
  );
}
