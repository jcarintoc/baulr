import { useState } from "react";
import { IconArrowUpCircle, IconFolder } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DropzoneCardProps {
  onSelectFolder: (name: string, sizeBytes: number) => void;
}

export function DropzoneCard({ onSelectFolder }: DropzoneCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Simulate folder drop
    onSelectFolder("Family_Vacation_2025", 1024 * 1024 * 1024 * 2.4);
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
          onClick={() => onSelectFolder("Family_Photos_Archive", 1024 * 1024 * 1024 * 3.1)}
          className="mt-1"
        >
          <IconFolder />
          <span>Select Folder to Free Up Space</span>
        </Button>
      </CardContent>
    </Card>
  );
}
