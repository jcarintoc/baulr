import { useEffect, useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { IconArrowUpCircle, IconFolder } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { selectOffloadFolder } from "@/lib/api/offload";

interface DropzoneCardProps {
  onSelectPaths: (paths: string[]) => void;
  disabled?: boolean;
}

export function DropzoneCard({ onSelectPaths, disabled }: DropzoneCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let mounted = true;

    try {
      getCurrentWebview()
        .onDragDropEvent((event) => {
          if (!mounted) return;
          if (event.payload.type === "enter" || event.payload.type === "over") {
            if (!disabled) setIsDragging(true);
          } else if (event.payload.type === "drop") {
            setIsDragging(false);
            if (!disabled && event.payload.paths && event.payload.paths.length > 0) {
              onSelectPaths(event.payload.paths);
            }
          } else if (event.payload.type === "leave") {
            setIsDragging(false);
          }
        })
        .then((fn) => {
          if (mounted) {
            unlisten = fn;
          } else {
            fn();
          }
        })
        .catch(() => {
          // Fallback if not inside Tauri environment
        });
    } catch {
      // Ignore if outside Tauri
    }

    return () => {
      mounted = false;
      if (unlisten) unlisten();
    };
  }, [disabled, onSelectPaths]);

  const handleSelectFolder = async () => {
    const selected = await selectOffloadFolder().catch(() => null);
    if (selected) onSelectPaths([selected.path]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const paths = Array.from(e.dataTransfer.files ?? [])
      .map((f) => (f as unknown as { path?: string }).path)
      .filter((p): p is string => Boolean(p));
    if (paths.length > 0) onSelectPaths(paths);
  };


  return (
    <Card
      role="region"
      aria-label="File offloader drop zone"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectFolder}
          disabled={disabled}
          className="mt-1"
        >
          <IconFolder />
          <span>Select Folder to Free Up Space</span>
        </Button>
      </CardContent>
    </Card>
  );
}
