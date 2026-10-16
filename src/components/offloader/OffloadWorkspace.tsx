import { useState, useRef, useEffect } from "react";
import { useTransferStore } from "@/store/useTransferStore";
import { DropzoneCard } from "./DropzoneCard";
import { TransferQueue } from "./TransferQueue";
import { ReclaimBanner } from "./ReclaimBanner";
import { ReclaimConfirmDialog } from "./ReclaimConfirmDialog";
import { OnboardingPrompt } from "../accounts/OnboardingPrompt";
import { IconCircleCheck } from "@tabler/icons-react";
import { formatBytes } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { listenOffloadProgress, reclaimPaths } from "@/lib/api/offload";

interface OffloadWorkspaceProps {
  hasConnectedAccounts: boolean;
  onConnectDrive: (provider: string) => void;
}

export function OffloadWorkspace({
  hasConnectedAccounts,
  onConnectDrive,
}: OffloadWorkspaceProps) {
  const {
    items,
    isVerified,
    error,
    enqueuePaths,
    removeItem,
    handleProgress,
    clearCompleted,
    clearError,
  } = useTransferStore();

  const [isConfirmingReclaim, setIsConfirmingReclaim] = useState(false);
  const [successToast, setSuccessToast] = useState<{
    bytes: number;
    count: number;
  } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listenOffloadProgress((progress) => {
      handleProgress(progress);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [handleProgress]);

  const handleSelectPaths = async (paths: string[], targetProvider?: string) => {
    try {
      await enqueuePaths(paths, targetProvider);
    } catch {
      // Error is set in store
    }
  };

  const verifiedItems = items.filter((i) => i.status === "verified");
  const totalReclaimBytes = verifiedItems.reduce((acc, i) => acc + i.sizeBytes, 0);
  const verifiedPaths = verifiedItems.flatMap((i) => (i.path ? [i.path] : []));

  const confirmReclaim = async () => {
    setIsConfirmingReclaim(false);
    if (verifiedPaths.length === 0) return;

    try {
      const result = await reclaimPaths(verifiedPaths);
      clearCompleted();
      const bytes = result.reclaimedBytes ?? totalReclaimBytes;
      const count = result.count || verifiedPaths.length;

      setSuccessToast({ bytes, count });
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setSuccessToast(null), 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      useTransferStore.setState({ error: msg });
    }
  };

  const handleDismissToast = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setSuccessToast(null);
  };

  if (!hasConnectedAccounts) {
    return <OnboardingPrompt onConnectDrive={onConnectDrive} />;
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <Alert variant="destructive" onClick={clearError} className="cursor-pointer">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successToast && (
        <Card className="p-3 px-4 flex items-center justify-between text-xs bg-card border-border">
          <div className="flex items-center gap-2 text-foreground/90">
            <IconCircleCheck className="size-4 text-vault-accent-text shrink-0" />
            <span>
              Freed up <strong className="text-foreground tabular-nums">{formatBytes(successToast.bytes)}</strong>. Files removed from this computer.
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDismissToast} className="h-7 text-xs">
            Dismiss
          </Button>
        </Card>
      )}

      {isVerified && totalReclaimBytes > 0 && (
        <ReclaimBanner
          totalReclaimBytes={totalReclaimBytes}
          itemCount={verifiedItems.length}
          onReclaim={() => setIsConfirmingReclaim(true)}
          onDismiss={clearCompleted}
        />
      )}

      {items.length > 0 && (
        <TransferQueue
          items={items}
          onDismiss={removeItem}
        />
      )}

      <DropzoneCard onSelectPaths={handleSelectPaths} />

      <ReclaimConfirmDialog
        open={isConfirmingReclaim}
        totalReclaimBytes={totalReclaimBytes}
        itemCount={verifiedItems.length}
        onConfirm={confirmReclaim}
        onCancel={() => setIsConfirmingReclaim(false)}
      />
    </div>
  );
}
