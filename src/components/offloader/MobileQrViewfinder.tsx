import { IconWifi, IconCopy, IconCheck } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface MobileQrViewfinderProps {
  qrSvg: string;
  url: string;
  copied: boolean;
  onCopyUrl: () => void;
  compact?: boolean;
}

export function MobileQrViewfinder({
  qrSvg,
  url,
  copied,
  onCopyUrl,
  compact = false,
}: MobileQrViewfinderProps) {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div
        className={`bg-white p-3 rounded-xl shadow-xs flex items-center justify-center [&_svg]:size-full transition-all duration-200 ${
          compact ? "size-32" : "size-44"
        }`}
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />

      <div className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md border border-border bg-zinc-900/80 text-xs">
        <IconWifi className="size-3.5 text-muted-foreground shrink-0" />
        <span className="text-zinc-400 font-mono truncate select-all flex-1">
          {url}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCopyUrl}
          className="h-6 px-1.5 text-muted-foreground hover:text-foreground shrink-0"
          title="Copy web uploader link"
        >
          {copied ? (
            <IconCheck className="text-emerald-500" />
          ) : (
            <IconCopy />
          )}
        </Button>
      </div>
    </div>
  );
}
