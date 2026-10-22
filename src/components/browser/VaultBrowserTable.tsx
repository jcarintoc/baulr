import { useEffect, useState } from "react";
import {
  IconAlertCircle,
  IconRefresh,
  IconChevronUp,
  IconChevronDown,
} from "@tabler/icons-react";
import {
  useRemoteFilesStore,
  RemoteVaultItem,
  SortField,
} from "@/store/useRemoteFilesStore";
import { listenToDownloadProgress } from "@/lib/api/browser";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { VaultBrowserHeader } from "@/components/browser/VaultBrowserHeader";
import { VaultBrowserToolbar } from "@/components/browser/VaultBrowserToolbar";
import { VaultItemRow } from "@/components/browser/VaultItemRow";
import { MediaGridView } from "@/components/browser/MediaGridView";
import { DownloadBanner } from "@/components/browser/DownloadBanner";
import { DeleteVaultItemDialog } from "@/components/browser/DeleteVaultItemDialog";
import { ShareLinkModal } from "@/components/browser/ShareLinkModal";
import {
  ProviderSyncAlert,
  PROVIDER_NAMES,
} from "@/components/browser/ProviderSyncAlert";
import { VaultEmptyState } from "@/components/browser/VaultEmptyState";
import { ProviderFilterPills } from "@/components/browser/ProviderFilterPills";

export function VaultBrowserTable() {
  const {
    files,
    isLoading,
    isInitialLoading,
    providerLoading,
    error,
    searchQuery,
    selectedProvider,
    sortField,
    sortDirection,
    activeDownloads,
    currentPath,
    viewMode,
    mediaBaseUrl,
    setSearchQuery,
    setVaultPath,
    setViewMode,
    ensureMediaBaseUrl,
    setSorting,
    fetchFiles,
    deleteFile,
    downloadFile,
    handleDownloadProgress,
    dismissDownload,
  } = useRemoteFilesStore();
  const [pendingDelete, setPendingDelete] = useState<RemoteVaultItem | null>(
    null,
  );
  const [sharingItem, setSharingItem] = useState<RemoteVaultItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
    ensureMediaBaseUrl();
    const unlisten = listenToDownloadProgress(handleDownloadProgress);
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [fetchFiles, ensureMediaBaseUrl, handleDownloadProgress]);

  const checkingAccounts = Object.entries(providerLoading)
    .filter(([, l]) => l)
    .map(([p]) => PROVIDER_NAMES[p] || p);
  const isCheckingCloud = isLoading || checkingAccounts.length > 0;
  const checkingTarget = checkingAccounts.join(", ") || "cloud accounts";
  const filtered = files.filter(
    (f) =>
      (selectedProvider === "all" || f.provider === selectedProvider) &&
      f.Name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const totalBytes = filtered.reduce(
    (acc, f) => acc + (f.Size && f.Size > 0 ? f.Size : 0),
    0,
  );

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteFile(
        pendingDelete.Path,
        pendingDelete.IsDir,
        pendingDelete.provider,
      );
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

  const handleOpenFile = async (item: RemoteVaultItem) => {
    const baseUrl = await ensureMediaBaseUrl();
    if (!baseUrl) return;
    const url = `${baseUrl}/${item.Path.split("/").map(encodeURIComponent).join("/")}`;
    import("@tauri-apps/plugin-opener")
      .then(({ openUrl }) => openUrl(url))
      .catch(() => window.open(url, "_blank"));
  };

  const sortIcon = (f: SortField) =>
    sortField === f ? (
      sortDirection === "asc" ? (
        <IconChevronUp className="size-3" />
      ) : (
        <IconChevronDown className="size-3" />
      )
    ) : null;

  return (
    <div className="flex flex-col gap-3.5">
      <VaultBrowserHeader
        filesCount={filtered.length}
        totalBytes={totalBytes}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <ProviderSyncAlert />
      {error && !isLoading && (
        <Alert
          variant="destructive"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <IconAlertCircle />
            <div>
              <AlertTitle>Unable to load vault files</AlertTitle>
              <AlertDescription>
                We could not reach your cloud accounts. Check your internet
                connection and try again.
              </AlertDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFiles}
            className="self-start sm:self-auto cursor-pointer"
          >
            <IconRefresh />
            <span>Try again</span>
          </Button>
        </Alert>
      )}
      <DownloadBanner
        downloads={Object.values(activeDownloads)}
        onDismiss={dismissDownload}
      />
      {isCheckingCloud && (
        <div className="flex items-center gap-2 text-sm bg-vault-accent/15 p-4 rounded-lg">
          <Spinner />
          <span className="animate-pulse">
            {`Checking ${
              checkingTarget ? checkingTarget : "cloud accounts"
            }...`}
          </span>
        </div>
      )}
      <ProviderFilterPills />
      <VaultBrowserToolbar
        currentPath={currentPath}
        onNavigatePath={setVaultPath}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      <Card className="border-border bg-card/75 overflow-hidden p-0">
        {isInitialLoading && files.length === 0 ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <VaultEmptyState
            isCheckingCloud={isCheckingCloud}
            hasQuery={Boolean(searchQuery)}
            totalFiles={files.length}
            checkingTarget={checkingTarget}
          />
        ) : viewMode === "grid" ? (
          <MediaGridView
            items={filtered}
            mediaBaseUrl={mediaBaseUrl}
            onOpenFolder={(i) => setVaultPath(i.Path)}
            onOpenFile={handleOpenFile}
            onDownload={handleDownload}
            onDelete={setPendingDelete}
            onShare={setSharingItem}
          />
        ) : (
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border hover:bg-transparent select-none">
                <TableHead
                  className="text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => setSorting("name")}
                >
                  <div className="flex items-center gap-1">
                    <span>Name</span>
                    {sortIcon("name")}
                  </div>
                </TableHead>
                <TableHead className="text-muted-foreground">Cloud</TableHead>
                <TableHead
                  className="text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => setSorting("size")}
                >
                  <div className="flex items-center gap-1">
                    <span>Size</span>
                    {sortIcon("size")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => setSorting("modified")}
                >
                  <div className="flex items-center gap-1">
                    <span>Modified</span>
                    {sortIcon("modified")}
                  </div>
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {filtered.map((item, idx) => (
                <VaultItemRow
                  key={`${item.provider ?? "vault"}:${item.Path}:${idx}`}
                  item={item}
                  isDownloading={downloadingPath === item.Path}
                  activeDownload={activeDownloads[item.Path]}
                  onDownload={handleDownload}
                  onDelete={setPendingDelete}
                  onShare={setSharingItem}
                  onOpenFolder={(f) => setVaultPath(f.Path)}
                  onOpenFile={handleOpenFile}
                />
              ))}
              {isCheckingCloud && (
                <TableRow className="border-border hover:bg-transparent bg-muted/15">
                  <TableCell
                    colSpan={5}
                    className="py-2.5 text-center text-xs text-muted-foreground"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Spinner className="text-vault-accent" />
                      <span>
                        Checking {checkingTarget} for additional files...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
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
      <ShareLinkModal
        item={sharingItem}
        open={Boolean(sharingItem)}
        onClose={() => setSharingItem(null)}
      />
    </div>
  );
}
