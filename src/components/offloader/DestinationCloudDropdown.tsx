import { IconCloudUpload, IconChevronDown, IconCheck } from "@tabler/icons-react";
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

interface DestinationCloudDropdownProps {
  accounts: CloudAccount[];
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
  disabled?: boolean;
}

export function DestinationCloudDropdown({
  accounts,
  selectedProvider,
  onSelectProvider,
  disabled,
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
            className="gap-1.5 text-xs text-muted-foreground"
            title="Choose cloud destination"
          >
            <IconCloudUpload />
            <span>{activeLabel}</span>
            <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Destination Cloud</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onSelectProvider("auto")}>
          <span className="flex-1">Let Baulr decide (Auto)</span>
          {selectedProvider === "auto" && <IconCheck />}
        </DropdownMenuItem>
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.provider}
            onClick={() => onSelectProvider(account.provider)}
          >
            <span className="flex-1">{account.name}</span>
            {selectedProvider === account.provider && <IconCheck />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
