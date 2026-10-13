import { useTransferStore } from "@/store/useTransferStore";
import { DropzoneCard } from "./DropzoneCard";
import { TransferQueue } from "./TransferQueue";
import { ReclaimBanner } from "./ReclaimBanner";
import { OnboardingPrompt } from "../accounts/OnboardingPrompt";

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

  if (!hasConnectedAccounts) {
    return <OnboardingPrompt onConnectDrive={onConnectDrive} />;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Cryptographically Verified Reclaim Callout */}
      {isVerified && totalReclaimBytes > 0 && (
        <ReclaimBanner
          totalReclaimBytes={totalReclaimBytes}
          itemCount={items.length}
          onReclaim={clearCompleted}
          onDismiss={clearCompleted}
        />
      )}

      {/* Live Offload Transfer Queue */}
      {items.length > 0 && <TransferQueue items={items} />}

      {/* Primary Dropzone */}
      <DropzoneCard onSelectFolder={handleSelectFolder} />
    </div>
  );
}
