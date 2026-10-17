import { IconFileText } from "@tabler/icons-react";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

interface VaultEmptyStateProps {
  isCheckingCloud: boolean;
  hasQuery: boolean;
  totalFiles: number;
  checkingTarget?: string;
}

export function VaultEmptyState({
  isCheckingCloud,
  hasQuery,
  totalFiles,
  checkingTarget = "cloud accounts",
}: VaultEmptyStateProps) {
  if (isCheckingCloud) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-center">
        <Spinner className="text-vault-accent" />
        <p className="text-sm font-medium text-foreground">
          {hasQuery ? "Searching your cloud accounts" : "Looking for your vault files"}
        </p>
        <p className="text-xs text-muted-foreground max-w-sm">
          {hasQuery
            ? "Looking across your connected accounts for matches..."
            : `Checking ${checkingTarget} for saved files...`}
        </p>
      </div>
    );
  }

  return (
    <Empty className="py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFileText className="size-4 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>No files found</EmptyTitle>
        <EmptyDescription>
          {totalFiles === 0
            ? "No files offloaded to the vault yet."
            : "No files match your search query."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
