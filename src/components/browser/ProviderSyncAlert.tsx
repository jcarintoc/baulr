import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRemoteFilesStore } from "@/store/useRemoteFilesStore";

export const PROVIDER_NAMES: Record<string, string> = {
  gdrive: "Google Drive",
  onedrive: "OneDrive",
};

export function ProviderSyncAlert() {
  const { providerErrors, retryProvider, providerLoading } = useRemoteFilesStore();
  const failedProviders = Object.entries(providerErrors).filter(([, err]) => Boolean(err));

  if (failedProviders.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {failedProviders.map(([provider]) => {
        const name = PROVIDER_NAMES[provider] || provider;
        const isLoading = providerLoading[provider] ?? false;

        return (
          <Alert
            key={provider}
            variant="destructive"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2">
              <IconAlertCircle className="shrink-0" />
              <div>
                <AlertTitle className="text-xs font-semibold">Unable to load {name} files</AlertTitle>
                <AlertDescription className="text-xs">
                  We could not reach your {name} account. Your other files are still available.
                </AlertDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => retryProvider(provider)}
              className="self-start sm:self-auto h-7 text-xs cursor-pointer gap-1"
            >
              <IconRefresh className={isLoading ? "animate-spin" : ""} />
              <span>Retry {name}</span>
            </Button>
          </Alert>
        );
      })}
    </div>
  );
}
