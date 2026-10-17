import {
  IconCheck,
  IconPhoto,
  IconVideo,
  IconFileText,
} from "@tabler/icons-react";
import { formatBytes } from "@/lib/formatters";
import { MobileFileReceivedPayload } from "@/lib/api/mobile";

interface MobileReceivedListProps {
  files: MobileFileReceivedPayload[];
}

function getMediaIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["mp4", "mov", "m4v", "webm", "mkv", "avi"].includes(ext)) {
    return <IconVideo className="size-3.5 text-zinc-400" />;
  }
  if (["pdf", "doc", "docx", "txt"].includes(ext)) {
    return <IconFileText className="size-3.5 text-zinc-400" />;
  }
  return <IconPhoto className="size-3.5 text-zinc-400" />;
}

export function MobileReceivedList({ files }: MobileReceivedListProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="text-xs font-medium text-muted-foreground flex items-center justify-between px-0.5">
        <span>Received ({files.length})</span>
        <span className="text-[11px] text-zinc-400">Saved to computer</span>
      </div>

      <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1">
        {files.map((file, idx) => (
          <div
            key={`${file.filePath}-${idx}`}
            className="flex items-center justify-between px-2.5 py-2 rounded-lg border border-border/80 bg-zinc-900/60 text-xs transition-colors hover:bg-zinc-900"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="size-6 rounded-sm bg-zinc-800 border border-zinc-700/50 flex items-center justify-center shrink-0">
                {getMediaIcon(file.fileName)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-zinc-200 truncate leading-none mb-0.5">
                  {file.fileName}
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums leading-none">
                  {formatBytes(file.sizeBytes)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-emerald-500 shrink-0">
              <IconCheck className="size-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
