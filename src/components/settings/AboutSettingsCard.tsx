import { IconShieldCheck, IconCheck, IconServer } from "@tabler/icons-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DaemonStatus } from "@/lib/bindings";

interface AboutSettingsCardProps {
  daemonStatus: DaemonStatus | null;
}

const SAFETY_PROMISES = [
  {
    title: "Verified before removal",
    desc: "Local files are only removed after they are safely backed up to your cloud.",
  },
  {
    title: "Non-destructive cleanup",
    desc: "Reclaimed local copies are moved to the Trash on your computer, never permanently erased.",
  },
  {
    title: "Capacity verified",
    desc: "Remaining storage is always checked to ensure your transfer fits before starting.",
  },
];

export function AboutSettingsCard({ daemonStatus }: AboutSettingsCardProps) {
  return (
    <Card className="bg-card/60 backdrop-blur border-border">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-foreground">
            <IconShieldCheck />
            <CardTitle>Vault Engine & Safety</CardTitle>
          </div>
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
            <span>{daemonStatus?.isRunning ? "Active" : "Starting"}</span>
          </Badge>
        </div>
        <CardDescription>
          Baulr operates directly on your device with safety guarantees to protect your family photos and files.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAFETY_PROMISES.map((item) => (
            <div
              key={item.title}
              className="p-3 rounded-lg border border-border/60 bg-card/30 flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-1.5 text-foreground font-medium text-xs">
                <IconCheck className="size-3.5 text-vault-accent-text shrink-0" />
                <span>{item.title}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <IconServer className="size-3.5" />
            <span>Baulr Desktop v0.1.0</span>
          </div>
          <span>Cloud storage is your single source of truth</span>
        </div>
      </CardContent>
    </Card>
  );
}
