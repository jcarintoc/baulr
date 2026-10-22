import {
  IconDownload,
  IconTrash,
  IconFolder,
  IconShare,
  IconFile,
} from "@tabler/icons-react";
import { formatBytes } from "@/lib/formatters";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ProviderIcon } from "@/components/common/ProviderIcons";
import { useVaultStore } from "@/store/useVaultStore";
import { PROVIDER_NAMES } from "@/components/browser/ProviderSyncAlert";
import type {
  RemoteVaultItem,
  DownloadProgress,
} from "@/store/useRemoteFilesStore";
import { Spinner } from "../ui/spinner";

interface VaultItemRowProps {
  item: RemoteVaultItem;
  isDownloading: boolean;
  activeDownload?: DownloadProgress;
  onDownload: (item: RemoteVaultItem) => void;
  onDelete: (item: RemoteVaultItem) => void;
  onShare: (item: RemoteVaultItem) => void;
  onOpenFolder?: (item: RemoteVaultItem) => void;
  onOpenFile?: (item: RemoteVaultItem) => void;
}

export function VaultItemRow({
  item,
  isDownloading,
  activeDownload,
  onDownload,
  onDelete,
  onShare,
  onOpenFolder,
  onOpenFile,
}: VaultItemRowProps) {
  const percent =
    activeDownload?.totalBytes && activeDownload.totalBytes > 0
      ? Math.min(
          99,
          Math.round(
            (activeDownload.transferredBytes / activeDownload.totalBytes) * 100,
          ),
        )
      : 0;

  const accountEmail = useVaultStore((s) =>
    s.quota?.accounts.find((a) => a.provider === item.provider)?.accountEmail
  );
  const providerName = item.provider ? (PROVIDER_NAMES[item.provider] ?? item.provider) : "";
  const providerTitle = providerName && accountEmail ? `${providerName} (${accountEmail})` : providerName;

  return (
    <TableRow className="border-border/60 hover:bg-muted/30">
      <TableCell className="text-foreground font-medium">
        <div className="flex items-center gap-2 [&_svg]:size-4">
          {item.IsDir ? (
            <button
              type="button"
              onClick={() => onOpenFolder?.(item)}
              className="flex items-center gap-2 hover:underline text-vault-accent-text cursor-pointer text-left"
            >
              <IconFolder className="fill-current shrink-0" />
              <span className="truncate max-w-xs font-medium">{item.Name}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenFile?.(item)}
              className="flex items-center gap-2 hover:underline text-foreground cursor-pointer text-left"
            >
              <IconFile className="text-vault-accent-text shrink-0" />
              <span className="truncate max-w-xs">{item.Name}</span>
            </button>
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {item.provider ? (
          <div className="flex items-center gap-1.5" title={providerTitle}>
            <ProviderIcon provider={item.provider} className="size-3.5 shrink-0" />
            <span className="truncate">{PROVIDER_NAMES[item.provider] || item.provider}</span>
          </div>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="text-foreground/90 tabular-nums">
        {item.IsDir ? "—" : formatBytes(item.Size ?? 0)}
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums text-xs">
        {item.ModTime ? item.ModTime.split("T")[0] : "—"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            title="Share link"
            onClick={() => onShare(item)}
          >
            <IconShare />
          </Button>
          {activeDownload?.status === "downloading" ? (
            <div className="flex items-center gap-1.5 text-xs text-vault-accent-text tabular-nums py-1 px-2">
              <Spinner className="size-3.5" />
              <span>{percent}%</span>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              title="Download to folder"
              onClick={() => onDownload(item)}
              disabled={isDownloading}
            >
              <IconDownload />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            title="Remove from vault"
            onClick={() => onDelete(item)}
            className="hover:text-destructive"
          >
            <IconTrash />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
