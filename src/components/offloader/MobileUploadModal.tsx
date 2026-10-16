import { useState } from "react";
import {
  IconDeviceMobile,
  IconCopy,
  IconCheck,
  IconAlertCircle,
  IconWifi,
} from "@tabler/icons-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { useMobileReceiver } from "./useMobileReceiver";
import { MobileReceivedList } from "./MobileReceivedList";

interface MobileUploadModalProps {
  open: boolean;
  onClose: () => void;
}

export function MobileUploadModal({ open, onClose }: MobileUploadModalProps) {
  const { receiverInfo, receiverState, error, receivedFiles, retry, stop } =
    useMobileReceiver(open);
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    if (!receiverInfo?.url) return;
    try {
      await navigator.clipboard.writeText(receiverInfo.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleClose = async () => {
    await stop();
    onClose();
  };

  const getStatusBadge = () => {
    switch (receiverState) {
      case "starting":
        return <Badge variant="outline">Starting receiver...</Badge>;
      case "waiting":
        return <Badge variant="outline">Ready for scan</Badge>;
      case "connected":
        return <Badge className="bg-vault-accent text-zinc-950 font-semibold">Phone connected</Badge>;
      case "receiving":
        return <Badge className="bg-vault-accent text-zinc-950 font-semibold">Receiving files...</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md p-6 flex flex-col gap-4">
        <AlertDialogHeader className="space-y-1.5 text-center items-center">
          <div className="flex items-center gap-2">
            <IconDeviceMobile className="size-5 text-vault-accent-text" />
            <AlertDialogTitle className="text-base font-semibold">
              Receive Photos & Videos from Phone
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-xs text-muted-foreground max-w-xs">
            Connect your phone to the same Wi-Fi network and scan the code with your camera.
          </AlertDialogDescription>
          <div className="pt-1">{getStatusBadge()}</div>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive" className="text-xs py-2">
            <IconAlertCircle />
            <AlertDescription className="flex items-center justify-between gap-2">
              <span className="truncate">{error}</span>
              <Button size="sm" variant="outline" onClick={retry} className="h-6 text-xs px-2">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {receiverState === "starting" && (
          <div className="flex flex-col items-center justify-center p-8 gap-3">
            <Spinner className="size-8 text-vault-accent-text" />
            <span className="text-xs text-muted-foreground">Preparing local network receiver...</span>
          </div>
        )}

        {receiverInfo && (
          <div className="flex flex-col items-center gap-3">
            <div
              className="size-48 p-3 rounded-2xl bg-white shadow-md flex items-center justify-center [&_svg]:size-full"
              dangerouslySetInnerHTML={{ __html: receiverInfo.qrSvg }}
            />

            <div className="flex items-center gap-2 max-w-full px-3 py-1.5 rounded-lg border border-border bg-card/80 text-xs">
              <IconWifi className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground font-mono truncate select-all">
                {receiverInfo.url}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyUrl}
                className="h-6 px-1.5 text-muted-foreground hover:text-foreground shrink-0"
                title="Copy web uploader link"
              >
                {copied ? <IconCheck className="text-vault-accent-text" /> : <IconCopy />}
              </Button>
            </div>
          </div>
        )}

        <MobileReceivedList files={receivedFiles} />

        <AlertDialogFooter className="pt-2 sm:justify-end">
          <AlertDialogCancel onClick={handleClose}>
            {receivedFiles.length > 0 ? "Done" : "Cancel"}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
