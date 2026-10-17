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
      {/* Crisp QR Container */}
      <div
        className={`bg-white p-3 rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center [&_svg]:size-full ${
          compact ? "size-32" : "size-44"
        }`}
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />

      {/* Connection link pill */}
      <div className="flex items-center gap-2 w-full px-2.5 py-1 rounded-md border border-border bg-zinc-900/80 text-xs">
        <IconWifi className="size-3 text-muted-foreground shrink-0" />
        <span className="text-zinc-400 font-mono text-[11px] truncate select-all">
          {url}
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={onCopyUrl}
          className="size-5 text-muted-foreground hover:text-foreground shrink-0"
          title="Copy upload URL"
        >
          {copied ? (
            <IconCheck className="size-3 text-emerald-500" />
          ) : (
            <IconCopy className="size-3" />
          )}
        </Button>
      </div>

      {!compact && (
        <p className="text-[11px] text-muted-foreground text-center">
          Connect your phone to the same Wi-Fi and scan with your camera
        </p>
      )}
    </div>
  );
}
