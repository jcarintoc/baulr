import { IconArrowRight, IconShieldCheck } from "@tabler/icons-react";
import {
  GoogleDriveIcon,
  OneDriveIcon,
} from "@/components/common/ProviderIcons";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface OnboardingPromptProps {
  onConnectDrive: (provider: string) => void;
}

export function OnboardingPrompt({ onConnectDrive }: OnboardingPromptProps) {
  return (
    <Card className="border-border bg-card/75">
      <CardHeader>
        <CardTitle>Initialize Your Cloud Vault</CardTitle>
        <CardDescription>
          Baulr connects your existing free cloud storage tiers into one unified
          virtual drive with zero monthly fees. Connect at least one account to
          start offloading.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {[
            {
              id: "gdrive",
              name: "Google Drive",
              size: "15 GB free storage",
              Icon: GoogleDriveIcon,
            },
            {
              id: "onedrive",
              name: "OneDrive",
              size: "5 GB free storage",
              Icon: OneDriveIcon,
            },
          ].map(({ id, name, size, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onConnectDrive(id)}
              className="p-4 rounded-xl border border-border hover:border-vault-accent-border bg-muted/40 hover:bg-muted/70 flex flex-col items-start text-left gap-3 transition cursor-pointer group"
            >
              <div className="size-9 rounded-lg bg-card text-foreground border border-border flex items-center justify-center">
                <Icon className="size-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground group-hover:text-vault-accent-text flex items-center gap-1.5 transition-colors">
                  <span>{name}</span>
                  <IconArrowRight className="size-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{size}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
          <IconShieldCheck className="size-4 text-vault-accent-text" />
          <span>
            Direct and private connection. Account keys never leave your
            computer.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
