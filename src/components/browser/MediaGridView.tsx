import {
  IconFolder,
  IconFile,
  IconPlayerPlayFilled,
  IconDownload,
  IconShare,
  IconTrash,
  IconFolderOpen,
} from "@tabler/icons-react";
import { formatBytes } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import type { RemoteVaultItem } from "@/store/useRemoteFilesStore";

function isImageItem(name: string, mime?: string | null): boolean {
  if (mime?.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp|svg|heic|heif|avif|bmp)$/i.test(name);
}

function isVideoItem(name: string, mime?: string | null): boolean {
  if (mime?.startsWith("video/")) return true;
  return /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(name);
}

interface MediaGridViewProps {
  items: RemoteVaultItem[];
  mediaBaseUrl: string | null;
  onOpenFolder: (item: RemoteVaultItem) => void;
  onOpenFile: (item: RemoteVaultItem) => void;
  onDownload: (item: RemoteVaultItem) => void;
  onDelete: (item: RemoteVaultItem) => void;
  onShare: (item: RemoteVaultItem) => void;
}

export function MediaGridView({
  items,
  mediaBaseUrl,
  onOpenFolder,
  onOpenFile,
  onDownload,
  onDelete,
  onShare,
}: MediaGridViewProps) {
  const getMediaUrl = (path: string) =>
    mediaBaseUrl
      ? `${mediaBaseUrl}/${path.split("/").map(encodeURIComponent).join("/")}`
      : "";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 p-3.5">
      {items.map((item) => {
        const isImg = !item.IsDir && isImageItem(item.Name, item.MimeType);
        const isVid = !item.IsDir && isVideoItem(item.Name, item.MimeType);
        const ext = item.Name.split(".").pop()?.toUpperCase() || "FILE";

        if (item.IsDir) {
          return (
            <div
              key={item.Path}
              onClick={() => onOpenFolder(item)}
              className="relative group cursor-pointer aspect-square -translate-y-5"
            >
              <IconFolder className="group-hover:opacity-0 absolute inset-0 w-full h-full text-vault-accent-text fill-current scale-105 stroke-1 transition-opacity duration-300" />
              <IconFolderOpen className="group-hover:opacity-100 opacity-0 absolute inset-0 w-full h-full text-vault-accent-text fill-vault-accent scale-105 stroke-1 transition-opacity duration-300" />

              <div className="absolute bottom-0 left-6">
                <p className="text-foreground truncate font-medium">
                  {item.Name}
                </p>
              </div>

              <div
                className="absolute top-6.5 right-2.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-background/85 backdrop-blur-md border border-border/60 rounded-lg p-0.5 shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon-xs"
                  title="Share"
                  onClick={() => onShare(item)}
                  className="size-6 p-0"
                >
                  <IconShare />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  title="Download"
                  onClick={() => onDownload(item)}
                  className="size-6 p-0"
                >
                  <IconDownload />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  title="Remove"
                  onClick={() => onDelete(item)}
                  className="size-6 p-0 hover:text-destructive"
                >
                  <IconTrash />
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={item.Path}
            onClick={() => onOpenFile(item)}
            className="group relative flex flex-col rounded-xl border border-border/70 bg-card/40 hover:bg-card/80 hover:border-vault-accent/40 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer aspect-square"
          >
            <div className="relative flex-1 bg-neutral-950/40 flex items-center justify-center overflow-hidden min-h-0">
              {isImg ? (
                <img
                  src={getMediaUrl(item.Path)}
                  alt={item.Name}
                  loading="lazy"
                  className="size-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                />
              ) : isVid ? (
                <div className="size-full bg-neutral-950 flex items-center justify-center">
                  <div className="size-10 rounded-full bg-card/85 backdrop-blur-md border border-border/80 flex items-center justify-center text-vault-accent-text shadow-sm group-hover:scale-110 group-hover:bg-vault-accent group-hover:text-vault-accent-foreground transition-all duration-200">
                    <IconPlayerPlayFilled className="size-4 ml-0.5" />
                  </div>
                </div>
              ) : (
                <div className="size-full bg-muted/15 flex flex-col items-center justify-center gap-1.5 p-2">
                  <div className="size-9 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center text-vault-accent-text group-hover:scale-105 transition-transform">
                    <IconFile className="size-5" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground uppercase px-1 py-0.5 rounded bg-muted/30 border border-border/40">
                    {ext}
                  </span>
                </div>
              )}

              <div
                className="absolute top-2 right-2 z-10 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-background/85 backdrop-blur-md border border-border/60 rounded-lg p-0.5 shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon-xs"
                  title="Share"
                  onClick={() => onShare(item)}
                  className="size-6 p-0"
                >
                  <IconShare />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  title="Download"
                  onClick={() => onDownload(item)}
                  className="size-6 p-0"
                >
                  <IconDownload />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  title="Remove"
                  onClick={() => onDelete(item)}
                  className="size-6 p-0 hover:text-destructive"
                >
                  <IconTrash />
                </Button>
              </div>
            </div>

            <div className="p-2.5 flex flex-col gap-0.5 border-t border-border/50 bg-card/60 shrink-0">
              <p className="text-xs font-medium text-foreground truncate group-hover:text-vault-accent-text transition-colors">
                {item.Name}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                <span>{formatBytes(item.Size ?? 0)}</span>
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70">
                  {ext}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
