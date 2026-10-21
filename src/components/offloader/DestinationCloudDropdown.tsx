import {
  IconCloudUpload,
  IconChevronDown,
  IconCheck,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CloudAccount } from "@/lib/bindings";
import { formatBytes } from "@/lib/formatters";

interface DestinationCloudDropdownProps {
  accounts: CloudAccount[];
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
  disabled?: boolean;
  totalFreeBytes?: number | null;
  triggerClassName?: string;
}

export function DestinationCloudDropdown({
  accounts,
  selectedProvider,
  onSelectProvider,
  disabled,
  totalFreeBytes,
  triggerClassName,
}: DestinationCloudDropdownProps) {
  if (accounts.length <= 1) return null;

  const activeProvider = accounts.find((a) => a.provider === selectedProvider);
  const activeLabel =
    selectedProvider === "auto" || !activeProvider
      ? "Let Baulr decide"
      : activeProvider.name;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className={triggerClassName ?? "gap-1.5 text-xs text-muted-foreground"}
            title="Choose cloud destination"
          >
            <IconCloudUpload />
            <span>{activeLabel}</span>
            <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Destination Cloud</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onSelectProvider("auto")}>
          <div className="flex items-center justify-between w-full gap-2">
            <span>Let Baulr decide (Auto)</span>
            {totalFreeBytes != null && (
              <span className="text-[11px] text-muted-foreground font-normal">
                {formatBytes(totalFreeBytes)} free
              </span>
            )}
          </div>
          {selectedProvider === "auto" && <IconCheck />}
        </DropdownMenuItem>
        {accounts.map((account) => {
          const free = Math.max(0, (account.totalBytes ?? 0) - (account.usedBytes ?? 0));
          return (
            <DropdownMenuItem
              key={account.provider}
              onClick={() => onSelectProvider(account.provider)}
            >
              <div className="flex items-center justify-between w-full gap-2">
                <span>{account.name}</span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  {formatBytes(free)} free
                </span>
              </div>
              {selectedProvider === account.provider && <IconCheck />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
