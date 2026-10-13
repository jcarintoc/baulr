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
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader className="flex flex-col items-center text-center gap-3">
          <div className="size-12 rounded-xl bg-muted border border-border/50 flex items-center justify-center text-foreground">
            {isGoogle ? (
              <GoogleDriveIcon className="size-6" />
            ) : (
              <OneDriveIcon className="size-6" />
            )}
          </div>

          <AlertDialogTitle className="text-base font-semibold">
            Connecting to {providerLabel}
          </AlertDialogTitle>

          <AlertDialogDescription className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            We opened your browser to sign in. Finish signing in to connect
            your storage to Baulr.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 p-3 rounded-lg bg-input/20 border border-border/50 flex items-center justify-center gap-2.5 text-xs text-muted-foreground">
          <Spinner className="text-vault-accent" />
          <span>Waiting for authorization in browser</span>
        </div>

        <AlertDialogFooter className="sm:justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
