import { useState } from "react";
import {
  IconArrowUpCircle,
  IconFolder,
  IconCloudUpload,
  IconChevronDown,
  IconCheck,
} from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { selectOffloadFolder } from "@/lib/api/offload";
import { useVaultStore } from "@/store/useVaultStore";
import { useWebviewDrop } from "./useWebviewDrop";

interface DropzoneCardProps {
  onSelectPaths: (paths: string[], targetProvider?: string) => void;
  disabled?: boolean;
}

export function DropzoneCard({ onSelectPaths, disabled }: DropzoneCardProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>("auto");

  const { quota } = useVaultStore();
  const connectedAccounts =
    quota?.accounts.filter((a) => a.isConnected && !a.needsAuth) ?? [];

  const activeProvider = connectedAccounts.find(
    (a) => a.provider === selectedProvider,
  );
  const activeLabel =
    selectedProvider === "auto" || !activeProvider
      ? "Let Baulr decide"
      : activeProvider.name;

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

          {connectedAccounts.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className="gap-1.5 text-xs text-muted-foreground"
                    title="Choose cloud destination"
                  >
                    <IconCloudUpload />
                    <span>{activeLabel}</span>
                    <IconChevronDown />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Destination Cloud</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedProvider("auto")}>
                  <span className="flex-1">Let Baulr decide (Auto)</span>
                  {selectedProvider === "auto" && <IconCheck />}
                </DropdownMenuItem>
                {connectedAccounts.map((account) => (
                  <DropdownMenuItem
                    key={account.provider}
                    onClick={() => setSelectedProvider(account.provider)}
                  >
                    <span className="flex-1">{account.name}</span>
                    {selectedProvider === account.provider && <IconCheck />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
