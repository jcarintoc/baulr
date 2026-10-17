import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { VaultItemRow } from "@/components/browser/VaultItemRow";
import type { RemoteVaultItem, DownloadProgress } from "@/store/useRemoteFilesStore";

interface VaultFilesListProps {
  files: RemoteVaultItem[];
  downloadingPath: string | null;
  activeDownloads: Record<string, DownloadProgress>;
  isCheckingCloud: boolean;
  checkingAccountNames: string[];
  onDownload: (item: RemoteVaultItem) => void;
  onDelete: (item: RemoteVaultItem) => void;
  onShare: (item: RemoteVaultItem) => void;
}

export function VaultFilesList({
  files,
  downloadingPath,
  activeDownloads,
  isCheckingCloud,
  checkingAccountNames,
  onDownload,
  onDelete,
  onShare,
}: VaultFilesListProps) {
  return (
    <Table>
      <TableHeader className="bg-muted/40">
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-muted-foreground">Name</TableHead>
          <TableHead className="text-muted-foreground">Size</TableHead>
          <TableHead className="text-muted-foreground">Modified</TableHead>
          <TableHead className="text-muted-foreground text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-border/60">
        {files.map((item) => (
          <VaultItemRow
            key={item.Path}
            item={item}
            isDownloading={downloadingPath === item.Path}
            activeDownload={activeDownloads[item.Path]}
            onDownload={onDownload}
            onDelete={onDelete}
            onShare={onShare}
          />
        ))}
        {isCheckingCloud && (
          <TableRow className="border-border hover:bg-transparent bg-muted/15">
            <TableCell
              colSpan={4}
              className="py-2.5 text-center text-xs text-muted-foreground"
            >
              <div className="flex items-center justify-center gap-2">
                <Spinner className="text-vault-accent" />
                <span>
                  Checking{" "}
                  {checkingAccountNames.length > 0
                    ? checkingAccountNames.join(", ")
                    : "cloud accounts"}{" "}
                  for additional files...
                </span>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
