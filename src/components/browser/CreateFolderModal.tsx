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
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateFolderModalProps {
  open: boolean;
  onClose: () => void;
  currentPath: string;
  onCreateFolder: (name: string) => Promise<void>;
}

const INVALID_CHARS = ["/", "\\", ":", "*", "?", '"', "<", ">", "|"];

export function CreateFolderModal({
  open,
  onClose,
  currentPath,
  onCreateFolder,
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFolderName("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e?: React.FormEvent) => {
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

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreateFolder(trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
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
              disabled={isSubmitting}
            />
          </div>

          <AlertDialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !folderName.trim()}
              className="gap-2"
            >
              {isSubmitting && <Spinner className="size-3.5" />}
              <span>Create folder</span>
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
