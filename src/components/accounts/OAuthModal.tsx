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
import { ProviderIcon } from "@/components/common/ProviderIcons";
import { PROVIDER_NAMES } from "@/components/browser/ProviderSyncAlert";

interface OAuthModalProps {
  isOpen: boolean;
  provider: string | null;
  onCancel: () => void;
  isFinalizing?: boolean;
}

export function OAuthModal({
  isOpen,
  provider,
  onCancel,
  isFinalizing = false,
}: OAuthModalProps) {
  if (!isOpen || !provider) return null;

  const providerLabel = PROVIDER_NAMES[provider.toLowerCase()] || provider;

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader className="flex flex-col items-center text-center gap-3">
          <div className="size-12 rounded-xl bg-muted border border-border/50 flex items-center justify-center text-foreground">
            <ProviderIcon provider={provider} className="size-6" />
          </div>

          <AlertDialogTitle className="text-base font-semibold">
            Connecting to {providerLabel}
          </AlertDialogTitle>

          <AlertDialogDescription className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            {isFinalizing
              ? "Authorization received. Setting up your cloud storage now."
              : "We opened your browser to sign in. Finish signing in to connect your storage to Baulr."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 p-3 rounded-lg bg-input/20 border border-border/50 flex items-center justify-center gap-2.5 text-xs text-muted-foreground">
          <Spinner className="text-vault-accent" />
          <span>
            {isFinalizing
              ? "Finishing setup..."
              : "Waiting for authorization in browser"}
          </span>
        </div>

        <AlertDialogFooter className="sm:justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isFinalizing}
          >
            Cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
