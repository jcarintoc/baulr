import { useRemoteFilesStore } from "@/store/useRemoteFilesStore";
import { useVaultStore } from "@/store/useVaultStore";
import { ProviderIcon } from "@/components/common/ProviderIcons";
import { PROVIDER_NAMES } from "@/components/browser/ProviderSyncAlert";

export function ProviderFilterPills() {
  const { selectedProvider, setSelectedProvider, filesByProvider, files } = useRemoteFilesStore();
  const accounts = useVaultStore((s) => s.quota?.accounts);

  // Collect connected or populated providers
  const activeProviders = Array.from(
    new Set([
      ...(accounts ?? []).filter((a) => a.isConnected).map((a) => a.provider),
      ...Object.keys(filesByProvider).filter((p) => (filesByProvider[p]?.length ?? 0) > 0),
    ])
  );

  // Only render filter pills if user has more than 1 cloud provider
  if (activeProviders.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
      <button
        type="button"
        data-testid="provider-pill-all"
        onClick={() => setSelectedProvider("all")}
        className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs transition-colors cursor-pointer border ${
          selectedProvider === "all"
            ? "bg-vault-accent/15 border-vault-accent/40 text-vault-accent-text font-medium shadow-xs"
            : "bg-muted/30 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
      >
        <span>All</span>
        <span className="text-[10px] opacity-75 tabular-nums">({files.length})</span>
      </button>

      {activeProviders.map((provider) => {
        const count = filesByProvider[provider]?.length ?? 0;
        const isSelected = selectedProvider === provider;
        const name = PROVIDER_NAMES[provider] || provider;

        return (
          <button
            key={provider}
            type="button"
            data-testid={`provider-pill-${provider}`}
            onClick={() => setSelectedProvider(provider)}
            className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs transition-colors cursor-pointer border shrink-0 ${
              isSelected
                ? "bg-vault-accent/15 border-vault-accent/40 text-vault-accent-text font-medium shadow-xs"
                : "bg-muted/30 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <ProviderIcon provider={provider} className="size-3.5 shrink-0" />
            <span>{name}</span>
            <span className="text-[10px] opacity-75 tabular-nums">({count})</span>
          </button>
        );
      })}
    </div>
  );
}
