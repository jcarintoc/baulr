import { useEffect, useState } from "react";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { useRemoteFilesStore, RemoteVaultItem } from "@/store/useRemoteFilesStore";
import { listenToDownloadProgress } from "@/lib/api/browser";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { VaultBrowserHeader } from "@/components/browser/VaultBrowserHeader";
import { VaultBrowserToolbar } from "@/components/browser/VaultBrowserToolbar";
import { VaultItemRow } from "@/components/browser/VaultItemRow";
import { MediaGridView } from "@/components/browser/MediaGridView";
import { DownloadBanner } from "@/components/browser/DownloadBanner";
import { DeleteVaultItemDialog } from "@/components/browser/DeleteVaultItemDialog";
import { ShareLinkModal } from "@/components/browser/ShareLinkModal";
import { ProviderSyncAlert, PROVIDER_NAMES } from "@/components/browser/ProviderSyncAlert";
import { VaultEmptyState } from "@/components/browser/VaultEmptyState";

export function VaultBrowserTable() {
  const {
    files, isLoading, isInitialLoading, providerLoading, error,
    searchQuery, activeDownloads, currentPath, viewMode, mediaBaseUrl,
    setSearchQuery, setVaultPath, setViewMode, ensureMediaBaseUrl,
    fetchFiles, deleteFile, downloadFile, handleDownloadProgress, dismissDownload,
  } = useRemoteFilesStore();
  const [pendingDelete, setPendingDelete] = useState<RemoteVaultItem | null>(null);
  const [sharingItem, setSharingItem] = useState<RemoteVaultItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
    ensureMediaBaseUrl();
    const unlisten = listenToDownloadProgress(handleDownloadProgress);
    return () => { unlisten.then((fn) => fn()); };
  }, [fetchFiles, ensureMediaBaseUrl, handleDownloadProgress]);

  const checkingAccounts = Object.entries(providerLoading).filter(([, l]) => l).map(([p]) => PROVIDER_NAMES[p] || p);
  const isCheckingCloud = isLoading || checkingAccounts.length > 0;
  const checkingTarget = checkingAccounts.join(", ") || "cloud accounts";
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
    try { await downloadFile(item); } finally { setDownloadingPath(null); }
  };

  const handleOpenFile = async (item: RemoteVaultItem) => {
    const baseUrl = mediaBaseUrl || (await ensureMediaBaseUrl());
    if (!baseUrl) return;
    const url = `${baseUrl}/${item.Path.split("/").map(encodeURIComponent).join("/")}`;
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(url);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="flex flex-col gap-3.5">
      <VaultBrowserHeader
        filesCount={files.length} totalBytes={totalBytes}
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
        isCheckingCloud={isCheckingCloud} checkingTarget={checkingTarget}
      />
      <ProviderSyncAlert />
      {error && !isLoading && (
        <Alert variant="destructive" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IconAlertCircle />
            <div>
              <AlertTitle>Unable to load vault files</AlertTitle>
              <AlertDescription>We could not reach your cloud accounts. Check your internet connection and try again.</AlertDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchFiles} className="self-start sm:self-auto cursor-pointer">
            <IconRefresh /><span>Try again</span>
          </Button>
        </Alert>
      )}
      <DownloadBanner downloads={Object.values(activeDownloads)} onDismiss={dismissDownload} />
      <VaultBrowserToolbar
        currentPath={currentPath} onNavigatePath={setVaultPath}
        viewMode={viewMode} onViewModeChange={setViewMode}
      />
      <Card className="border-border bg-card/75 overflow-hidden p-0">
        {isInitialLoading && files.length === 0 ? (
          <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <VaultEmptyState isCheckingCloud={isCheckingCloud} hasQuery={Boolean(searchQuery)} totalFiles={files.length} checkingTarget={checkingTarget} />
        ) : viewMode === "grid" ? (
          <MediaGridView
            items={filtered} mediaBaseUrl={mediaBaseUrl} onOpenFolder={(i) => setVaultPath(i.Path)}
            onOpenFile={handleOpenFile} onDownload={handleDownload} onDelete={setPendingDelete} onShare={setSharingItem}
          />
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
                  key={item.Path} item={item} isDownloading={downloadingPath === item.Path}
                  activeDownload={activeDownloads[item.Path]} onDownload={handleDownload}
                  onDelete={setPendingDelete} onShare={setSharingItem} onOpenFolder={(f) => setVaultPath(f.Path)}
                  onOpenFile={handleOpenFile}
                />
              ))}
              {isCheckingCloud && (
                <TableRow className="border-border hover:bg-transparent bg-muted/15">
                  <TableCell colSpan={4} className="py-2.5 text-center text-xs text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Spinner className="text-vault-accent" />
                      <span>Checking {checkingTarget} for additional files...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
      <DeleteVaultItemDialog item={pendingDelete} isOpen={pendingDelete !== null} onClose={() => setPendingDelete(null)} onConfirm={confirmDelete} isDeleting={isDeleting} />
      <ShareLinkModal item={sharingItem} open={Boolean(sharingItem)} onClose={() => setSharingItem(null)} />
    </div>
  );
}
