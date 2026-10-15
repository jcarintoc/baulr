import { useEffect, useState } from "react";
import { IconFileText, IconSearch, IconArchive } from "@tabler/icons-react";
import { formatBytes } from "@/lib/formatters";
import { useRemoteFilesStore, RemoteVaultItem } from "@/store/useRemoteFilesStore";
import { listenToDownloadProgress } from "@/lib/api/browser";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead } from "@/components/ui/table";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { VaultItemRow } from "@/components/browser/VaultItemRow";
import { DownloadBanner } from "@/components/browser/DownloadBanner";
import { DeleteVaultItemDialog } from "@/components/browser/DeleteVaultItemDialog";

export function VaultBrowserTable() {
  const {
    files, isLoading, searchQuery, activeDownloads,
    setSearchQuery, fetchFiles, deleteFile, downloadFile,
    handleDownloadProgress, dismissDownload,
  } = useRemoteFilesStore();
  const [pendingDelete, setPendingDelete] = useState<RemoteVaultItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
    const unlisten = listenToDownloadProgress(handleDownloadProgress);
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [fetchFiles, handleDownloadProgress]);

  const filtered = files.filter((f) => f.Name.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalBytes = files.reduce((acc, f) => acc + (f.Size && f.Size > 0 ? f.Size : 0), 0);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteFile(pendingDelete.Path, pendingDelete.IsDir);
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (item: RemoteVaultItem) => {
    setDownloadingPath(item.Path);
    try {
      await downloadFile(item);
    } finally {
      setDownloadingPath(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="bg-card/75 border-border">
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <IconArchive className="size-5 text-vault-accent-text" />
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                Vault Directory ({files.length} {files.length === 1 ? "item" : "items"})
              </h3>
              <p className="text-xs text-muted-foreground tabular-nums">
                Total pooled archive: {formatBytes(totalBytes)}
              </p>
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <IconSearch className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vault files..."
              className="pl-8 text-xs bg-muted/30 border-border"
            />
          </div>
        </CardContent>
      </Card>

      <DownloadBanner
        downloads={Object.values(activeDownloads)}
        onDismiss={dismissDownload}
      />

      <Card className="border-border bg-card/75 overflow-hidden p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconFileText className="size-4 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No files found</EmptyTitle>
              <EmptyDescription>
                {files.length === 0
                  ? "No files offloaded to the vault yet."
                  : "No files match your search query."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
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
              {filtered.map((item) => (
                <VaultItemRow
                  key={item.Path}
                  item={item}
                  isDownloading={downloadingPath === item.Path}
                  activeDownload={activeDownloads[item.Path]}
                  onDownload={handleDownload}
                  onDelete={setPendingDelete}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <DeleteVaultItemDialog
        item={pendingDelete}
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
