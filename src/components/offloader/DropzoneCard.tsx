import { useState } from "react";
import {
  IconArrowUpCircle,
  IconFolder,
  IconDeviceMobile,
} from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { selectOffloadFolder } from "@/lib/api/offload";
import { useVaultStore } from "@/store/useVaultStore";
import { useWebviewDrop } from "./useWebviewDrop";
import { DestinationCloudDropdown } from "./DestinationCloudDropdown";

interface DropzoneCardProps {
  onSelectPaths: (paths: string[], targetProvider?: string) => void;
  onOpenMobile?: () => void;
  disabled?: boolean;
}

export function DropzoneCard({
  onSelectPaths,
  onOpenMobile,
  disabled,
}: DropzoneCardProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>("auto");

  const { quota } = useVaultStore();
  const connectedAccounts =
    quota?.accounts.filter((a) => a.isConnected && !a.needsAuth) ?? [];

  const triggerSelect = (paths: string[]) => {
    onSelectPaths(
      paths,
      selectedProvider === "auto" ? undefined : selectedProvider,
    );
  };

  const { isDragging, setIsDragging } = useWebviewDrop({
    disabled,
    onDrop: triggerSelect,
  });

  const handleSelectFolder = async () => {
    const selected = await selectOffloadFolder().catch(() => null);
    if (selected) triggerSelect([selected.path]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const paths = Array.from(e.dataTransfer.files ?? [])
      .map((f) => (f as unknown as { path?: string }).path)
      .filter((p): p is string => Boolean(p));
    if (paths.length > 0) triggerSelect(paths);
  };

  return (
    <Card
      role="region"
      aria-label="File offloader drop zone"
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      data-dragging={isDragging ? "true" : undefined}
      className="p-10 border-2 border-dashed transition rounded-2xl group border-border hover:border-vault-accent-border bg-card/50 hover:bg-card/80 data-[dragging=true]:border-vault-accent data-[dragging=true]:bg-accent"
    >
      <CardContent className="p-0 flex flex-col items-center justify-center gap-3.5 text-center">
        <div className="size-12 rounded-xl bg-muted text-muted-foreground group-hover:text-foreground border border-border flex items-center justify-center transition">
          <IconArrowUpCircle className="size-6" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-foreground">
            Drag and drop folders or files here to offload
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md leading-relaxed">
            Files are backed up to your unified cloud vault and removed from this computer once safely saved.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectFolder}
            disabled={disabled}
          >
            <IconFolder />
            <span>Select Folder to Free Up Space</span>
          </Button>

          {onOpenMobile && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenMobile}
              disabled={disabled}
            >
              <IconDeviceMobile />
              <span>Receive from Phone</span>
            </Button>
          )}

          <DestinationCloudDropdown
            accounts={connectedAccounts}
            selectedProvider={selectedProvider}
            onSelectProvider={setSelectedProvider}
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
