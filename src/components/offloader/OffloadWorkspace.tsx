import { useState, useRef, useEffect } from "react";
import { useTransferStore } from "@/store/useTransferStore";
import { DropzoneCard } from "./DropzoneCard";
import { TransferQueue } from "./TransferQueue";
import { ReclaimBanner } from "./ReclaimBanner";
import { OnboardingPrompt } from "../accounts/OnboardingPrompt";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { formatBytes } from "@/lib/formatters";

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

  const [undoToast, setUndoToast] = useState<{
    bytes: number;
    count: number;
  } | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  const handleSelectFolder = (name: string, sizeBytes: number) => {
    enqueueTransfer(name, sizeBytes);

    // Progressive simulated transfer sequence for immediate UX feedback
    const queueId = useTransferStore.getState().items.slice(-1)[0]?.id;
    if (queueId) {
      setTimeout(() => {
        updateItemProgress(queueId, sizeBytes * 0.45, 1024 * 1024 * 16.5, 3);
      }, 700);

      setTimeout(() => {
        updateItemProgress(queueId, sizeBytes, 1024 * 1024 * 18.2, 0);
      }, 1500);

      setTimeout(() => {
        markItemVerified(queueId);
      }, 2300);
    }
  };

  const totalReclaimBytes = items
    .filter((i) => i.status === "verified")
    .reduce((acc, i) => acc + i.sizeBytes, 0);

  const handleReclaim = () => {
    const bytes = totalReclaimBytes;
    const count = items.length;
    clearCompleted();

    setUndoToast({ bytes, count });
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    undoTimeoutRef.current = setTimeout(() => {
      setUndoToast(null);
    }, 5000);
  };

  const handleUndo = () => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    setUndoToast(null);
  };

  const handleDismiss = () => {
    clearCompleted();
  };

  if (!hasConnectedAccounts) {
    return <OnboardingPrompt onConnectDrive={onConnectDrive} />;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 5-second Undo Feedback Toast */}
      {undoToast && (
        <aside
          aria-live="polite"
          className="p-3.5 px-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs"
        >
          <div className="flex items-center gap-2 text-neutral-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Freed up <strong className="text-white tabular-nums">{formatBytes(undoToast.bytes)}</strong>. Local files moved to your computer's Trash.
            </span>
          </div>
          <button
            onClick={handleUndo}
            className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-medium px-2.5 py-1 rounded-md hover:bg-neutral-800 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
        </aside>
      )}

      {/* Verified Space Reclaim Banner */}
      {isVerified && totalReclaimBytes > 0 && (
        <ReclaimBanner
          totalReclaimBytes={totalReclaimBytes}
          itemCount={items.length}
          onReclaim={handleReclaim}
          onDismiss={handleDismiss}
        />
      )}

      {/* Live Offload Transfer Queue */}
      {items.length > 0 && <TransferQueue items={items} />}

      {/* Primary Dropzone */}
      <DropzoneCard onSelectFolder={handleSelectFolder} />
    </div>
  );
}
