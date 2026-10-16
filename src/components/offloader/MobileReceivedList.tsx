import { IconCircleCheck, IconPhoto } from "@tabler/icons-react";
import { formatBytes } from "@/lib/formatters";
import { MobileFileReceivedPayload } from "@/lib/api/mobile";
import { Badge } from "@/components/ui/badge";

interface MobileReceivedListProps {
  files: MobileFileReceivedPayload[];
}

export function MobileReceivedList({ files }: MobileReceivedListProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 w-full max-h-48 overflow-y-auto pr-1">
      <div className="text-xs font-medium text-muted-foreground flex items-center justify-between px-1">
        <span>Received Media ({files.length})</span>
        <span>Auto-Queued for Cloud</span>
      </div>
      {files.map((file, idx) => (
        <div
          key={`${file.filePath}-${idx}`}
          className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card/60 text-xs"
        >
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="size-7 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <IconPhoto className="size-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-foreground truncate">{file.fileName}</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {formatBytes(file.sizeBytes)}
              </span>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-vault-accent/30 text-vault-accent-text bg-vault-accent/10 shrink-0 gap-1 text-[11px] px-2 py-0.5"
          >
            <IconCircleCheck />
            <span>Saved</span>
          </Badge>
        </div>
      ))}
    </div>
  );
}
