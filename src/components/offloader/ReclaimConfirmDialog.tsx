import { formatBytes } from "@/lib/formatters";
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

interface ReclaimConfirmDialogProps {
  open: boolean;
  totalReclaimBytes: number;
  itemCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ReclaimConfirmDialog({
  open,
  totalReclaimBytes,
  itemCount,
  onConfirm,
  onCancel,
}: ReclaimConfirmDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Free up {formatBytes(totalReclaimBytes)}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {itemCount} {itemCount === 1 ? "file is" : "files are"} saved to your
            cloud. You can now remove them from this computer to reclaim drive
            space.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Keep on this computer
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Free up space</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
