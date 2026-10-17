import { useState } from "react";
import { IconAlertCircle } from "@tabler/icons-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { useMobileReceiver } from "./useMobileReceiver";
import { MobileQrViewfinder } from "./MobileQrViewfinder";
import { MobileReceivedList } from "./MobileReceivedList";
import { DisconnectMobileDialog } from "./DisconnectMobileDialog";
import { Badge } from "../ui/badge";

interface MobileUploadModalProps {
  open: boolean;
  onClose: () => void;
}

type ReceiverState =
  | "starting"
  | "waiting"
  | "connected"
  | "receiving"
  | "error";

const STATUS_CONFIG: Record<
  ReceiverState,
  { label: string; dotClass: string }
> = {
  starting: { label: "Initializing...", dotClass: "bg-zinc-500 animate-pulse" },
  waiting: { label: "Waiting for connection", dotClass: "bg-amber-500" },
  connected: { label: "Phone connected", dotClass: "bg-emerald-500" },
  receiving: {
    label: "Receiving files...",
    dotClass: "bg-emerald-500 animate-pulse",
  },
  error: { label: "Connection error", dotClass: "bg-destructive" },
};

export function MobileUploadModal({ open, onClose }: MobileUploadModalProps) {
  const { receiverInfo, receiverState, error, receivedFiles, retry, stop } =
    useMobileReceiver(open);
  const [copied, setCopied] = useState(false);
  const [isConfirmingDisconnect, setIsConfirmingDisconnect] = useState(false);

  const handleCopyUrl = async () => {
    if (!receiverInfo?.url) return;
    try {
      await navigator.clipboard.writeText(receiverInfo.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleConfirmDisconnect = async () => {
    setIsConfirmingDisconnect(false);
    await stop();
    onClose();
  };

  const status =
    STATUS_CONFIG[receiverState as ReceiverState] ?? STATUS_CONFIG.waiting;
  const isConnected =
    receiverState === "connected" || receiverState === "receiving";

  return (
    <>
      <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <AlertDialogContent className="flex flex-col p-6 gap-5">
          <AlertDialogHeader className="gap-0">
            <AlertDialogTitle>Transfer from Phone</AlertDialogTitle>
            <AlertDialogDescription>
              Direct local Wi-Fi transfer
            </AlertDialogDescription>
            {/* Status pill */}
            <Badge variant="secondary" className="mt-2">
              <span className={`size-1.5 rounded-full ${status.dotClass}`} />
              {status.label}
            </Badge>
          </AlertDialogHeader>

          {error && (
            <Alert variant="destructive" className="py-2.5 text-xs">
              <IconAlertCircle className="size-4" />
              <AlertDescription className="flex items-center justify-between gap-2">
                <span className="truncate">{error}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={retry}
                  className="h-6 text-xs px-2.5"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {receiverState === "starting" ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Spinner className="size-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Starting local Wi-Fi server...
              </span>
            </div>
          ) : (
            receiverInfo && (
              <div className="flex flex-col gap-4">
                <MobileQrViewfinder
                  qrSvg={receiverInfo.qrSvg}
                  url={receiverInfo.url}
                  copied={copied}
                  onCopyUrl={handleCopyUrl}
                  compact={isConnected || receivedFiles.length > 0}
                />

                <MobileReceivedList files={receivedFiles} />
              </div>
            )
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsConfirmingDisconnect(true)}
              className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2"
            >
              Disconnect Session
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs px-4"
            >
              Done
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <DisconnectMobileDialog
        open={isConfirmingDisconnect}
        onConfirm={handleConfirmDisconnect}
        onCancel={() => setIsConfirmingDisconnect(false)}
      />
    </>
  );
}
