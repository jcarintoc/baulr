import { IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { AppearanceSettingsCard } from "./AppearanceSettingsCard";
import { NetworkSettingsCard } from "./NetworkSettingsCard";
import { AboutSettingsCard } from "./AboutSettingsCard";
import type { DaemonStatus } from "@/lib/bindings";

interface SettingsPageProps {
  daemonStatus: DaemonStatus | null;
  onBack: () => void;
}

export function SettingsPage({ daemonStatus, onBack }: SettingsPageProps) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-150">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <IconArrowLeft />
            <span>Back to Vault</span>
          </Button>
          <div className="h-4 w-px bg-border/60" />
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            Settings
          </h2>
        </div>
      </div>

      <AppearanceSettingsCard />
      <NetworkSettingsCard />
      <AboutSettingsCard daemonStatus={daemonStatus} />
    </div>
  );
}
