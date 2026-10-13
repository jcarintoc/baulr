import { useState, useRef, useEffect } from "react";
import { useTransferStore } from "@/store/useTransferStore";
import { DropzoneCard } from "./DropzoneCard";
import { TransferQueue } from "./TransferQueue";
import { ReclaimBanner } from "./ReclaimBanner";
import { OnboardingPrompt } from "../accounts/OnboardingPrompt";
import { IconCircleCheck, IconRotateClockwise } from "@tabler/icons-react";
import { formatBytes } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

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
    enqueueTransfer,
    clearCompleted,
    updateItemProgress,
    markItemVerified,
  } = useTransferStore();

  const [isConfirmingReclaim, setIsConfirmingReclaim] = useState(false);
  const [undoToast, setUndoToast] = useState<{
    bytes: number;
    count: number;
  } | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  const handleSelectFolder = (name: string, sizeBytes: number) => {
    enqueueTransfer(name, sizeBytes);
    const queueId = useTransferStore.getState().items.slice(-1)[0]?.id;
    if (queueId) {
      setTimeout(() => updateItemProgress(queueId, sizeBytes * 0.45, 1024 * 1024 * 16.5, 3), 700);
      setTimeout(() => updateItemProgress(queueId, sizeBytes, 1024 * 1024 * 18.2, 0), 1500);
      setTimeout(() => markItemVerified(queueId), 2300);
    }
  };

  const totalReclaimBytes = items
    .filter((i) => i.status === "verified")
    .reduce((acc, i) => acc + i.sizeBytes, 0);

  const confirmReclaim = () => {
    const bytes = totalReclaimBytes;
    const count = items.length;
    setIsConfirmingReclaim(false);
    clearCompleted();

    setUndoToast({ bytes, count });
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => setUndoToast(null), 5000);
  };

  const handleUndo = () => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoToast(null);
  };

  if (!hasConnectedAccounts) {
    return <OnboardingPrompt onConnectDrive={onConnectDrive} />;
  }

  return (
    <div className="flex flex-col gap-5">
      {undoToast && (
        <Card className="p-3 px-4 flex items-center justify-between text-xs bg-card border-border">
          <div className="flex items-center gap-2 text-foreground/90">
            <IconCircleCheck className="size-4 text-vault-accent-text shrink-0" />
            <span>Freed up <strong className="text-foreground tabular-nums">{formatBytes(undoToast.bytes)}</strong>. Files removed from this computer.</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleUndo}>
            <IconRotateClockwise />
            <span>Undo</span>
          </Button>
        </Card>
      )}

      {isVerified && totalReclaimBytes > 0 && (
        <ReclaimBanner
          totalReclaimBytes={totalReclaimBytes}
          itemCount={items.length}
          onReclaim={() => setIsConfirmingReclaim(true)}
          onDismiss={clearCompleted}
        />
      )}

      {items.length > 0 && <TransferQueue items={items} />}
      <DropzoneCard onSelectFolder={handleSelectFolder} />

      <AlertDialog open={isConfirmingReclaim}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Free up {formatBytes(totalReclaimBytes)}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {items.length} {items.length === 1 ? "file is" : "files are"}{" "}
              saved to your cloud. You can now remove them from this computer to
              reclaim drive space.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmingReclaim(false)}>
              Keep on this computer
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmReclaim}>
              Free up space
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
