import { useEffect, useState } from "react";
import {
  IconShare,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconAlertCircle,
} from "@tabler/icons-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchFileShareLink } from "@/lib/api/browser";
import type { RemoteVaultItem } from "@/store/useRemoteFilesStore";

interface ShareLinkModalProps {
  item: RemoteVaultItem | null;
  open: boolean;
  onClose: () => void;
}

export function ShareLinkModal({ item, open, onClose }: ShareLinkModalProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadLink = async () => {
    if (!item) return;
    setIsLoading(true);
    setError(null);
    try {
      const link = await fetchFileShareLink(item.Path);
      setUrl(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && item) {
      setUrl(null);
      setCopied(false);
      loadLink();
    }
  }, [open, item?.Path]);

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (!item) return null;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader className="flex flex-col items-center text-center gap-2">
          <div className="size-10 rounded-xl bg-muted border border-border/50 flex items-center justify-center text-foreground">
            <IconShare className="size-5" />
          </div>
          <AlertDialogTitle className="text-base font-semibold">Share File</AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground truncate max-w-xs">
            {item.Name}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-3 flex flex-col gap-3">
          {isLoading ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
              <Spinner className="text-vault-accent" />
              <span>Generating shareable link from cloud...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col gap-2">
              <Alert variant="destructive">
                <IconAlertCircle className="size-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
              <Button variant="outline" size="sm" onClick={loadLink} className="self-center mt-1 text-xs">
                Retry
              </Button>
            </div>
          ) : url ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-1.5">
                <Input readOnly value={url} className="h-8 text-xs font-mono select-all flex-1" />
                <Button variant="secondary" size="sm" onClick={handleCopy} className="h-8 px-2.5 text-xs gap-1 shrink-0">
                  {copied ? <IconCheck /> : <IconCopy />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open(url, "_blank")} title="Open in web browser" className="h-8 size-8 p-0 shrink-0">
                  <IconExternalLink />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Anyone with this link can view this file in their web browser.
              </p>
            </div>
          ) : null}
        </div>

        <AlertDialogFooter className="sm:justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Done</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
