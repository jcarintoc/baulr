import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  GoogleDriveIcon,
  OneDriveIcon,
} from "@/components/common/ProviderIcons";

interface OAuthModalProps {
  isOpen: boolean;
  provider: string | null;
  onCancel: () => void;
}

export function OAuthModal({ isOpen, provider, onCancel }: OAuthModalProps) {
  if (!isOpen || !provider) return null;

  const isGoogle = provider.toLowerCase().includes("gdrive");
  const providerLabel = isGoogle ? "Google Drive" : "OneDrive";

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md bg-neutral-900 border border-neutral-800 text-neutral-100 p-6 rounded-2xl">
        <AlertDialogHeader className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700/50 flex items-center justify-center text-neutral-200">
            {isGoogle ? (
              <GoogleDriveIcon className="w-6 h-6" />
            ) : (
              <OneDriveIcon className="w-6 h-6" />
            )}
          </div>

          <AlertDialogTitle className="text-base font-semibold text-white">
            Connecting to {providerLabel}
          </AlertDialogTitle>

          <AlertDialogDescription className="text-xs text-neutral-400 max-w-xs leading-relaxed">
            We opened your browser to sign in. Finish signing in to connect
            your storage to Baulr.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 p-3 rounded-lg bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-center gap-2.5 text-xs text-neutral-300">
          <Spinner className="text-vault-accent" />
          <span>Waiting for authorization in browser</span>
        </div>

        <AlertDialogFooter className="flex justify-center sm:justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="border-neutral-700 hover:bg-neutral-800 text-neutral-300"
          >
            Cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
