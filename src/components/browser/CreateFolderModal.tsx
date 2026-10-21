import { useState, useEffect } from "react";
import { IconFolderPlus, IconAlertCircle } from "@tabler/icons-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DestinationCloudDropdown } from "@/components/offloader/DestinationCloudDropdown";
import { useVaultStore } from "@/store/useVaultStore";

interface CreateFolderModalProps {
  open: boolean;
  onClose: () => void;
  currentPath: string;
  onCreateFolder: (name: string, provider?: string) => Promise<unknown>;
}

const INVALID_CHARS = ["/", "\\", ":", "*", "?", '"', "<", ">", "|"];

export function CreateFolderModal({
  open,
  onClose,
  currentPath,
  onCreateFolder,
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("auto");
  const [error, setError] = useState<string | null>(null);

  const quota = useVaultStore((s) => s.quota);
  const accounts = (quota?.accounts ?? []).filter((a) => a.isConnected && !a.needsAuth);
  const totalFreeBytes = quota?.freeBytes;

  useEffect(() => {
    if (open) {
      setFolderName("");
      setSelectedProvider("auto");
      setError(null);
    }
  }, [open]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = folderName.trim();
    if (!trimmed) {
      setError("Please enter a folder name.");
      return;
    }

    if (INVALID_CHARS.some((char) => trimmed.includes(char))) {
      setError('Folder names cannot contain special characters (/ \\ : * ? " < > |).');
      return;
    }

    const providerArg = selectedProvider === "auto" ? undefined : selectedProvider;
    onClose();
    onCreateFolder(trimmed, providerArg).catch(() => {});
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <IconFolderPlus className="size-5" />
            </div>
            <div>
              <AlertDialogTitle>New folder</AlertDialogTitle>
              <AlertDialogDescription>
                Inside: Vault{currentPath ? ` / ${currentPath}` : ""}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {error && (
            <Alert variant="destructive">
              <IconAlertCircle className="size-4 shrink-0" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="folder-name-input" className="text-xs font-medium text-foreground">
              Folder name
            </label>
            <Input
              id="folder-name-input"
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Invoices, Family Photos"
              autoFocus
            />
          </div>

          {accounts.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">Destination</label>
              <DestinationCloudDropdown
                accounts={accounts}
                selectedProvider={selectedProvider}
                onSelectProvider={setSelectedProvider}
                totalFreeBytes={totalFreeBytes}
                triggerClassName="w-full justify-between gap-1.5 text-xs text-foreground bg-background"
              />
            </div>
          )}

          <AlertDialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!folderName.trim()}
              className="gap-2"
            >
              <span>Create folder</span>
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
