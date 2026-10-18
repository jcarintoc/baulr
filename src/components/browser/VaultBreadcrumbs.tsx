import { IconFolder, IconChevronRight, IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface VaultBreadcrumbsProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function VaultBreadcrumbs({
  currentPath,
  onNavigate,
}: VaultBreadcrumbsProps) {
  const segments = currentPath.split("/").filter(Boolean);

  const handleBack = () => {
    if (segments.length === 0) return;
    onNavigate(segments.slice(0, -1).join("/"));
  };

  return (
    <nav
      aria-label="Vault directory breadcrumb"
      className="flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto py-0.5"
    >
      {segments.length > 0 && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleBack}
          title="Back to parent folder"
          className="mr-0.5 size-7 p-0 rounded-lg hover:bg-muted/70 cursor-pointer shrink-0"
        >
          <IconArrowLeft className="size-3.5" />
        </Button>
      )}

      <button
        type="button"
        onClick={() => onNavigate("")}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
          segments.length === 0
            ? "font-semibold text-foreground bg-muted/40"
            : "hover:bg-muted/50 hover:text-foreground"
        }`}
      >
        <IconFolder className="size-3.5 text-vault-accent-text" />
        <span>Vault</span>
      </button>

      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        return (
          <div key={index} className="flex items-center gap-1 shrink-0">
            <IconChevronRight className="size-3 text-muted-foreground/40 shrink-0" />
            <button
              type="button"
              onClick={() => onNavigate(segments.slice(0, index + 1).join("/"))}
              disabled={isLast}
              className={`transition-colors truncate max-w-[160px] px-2 py-1 rounded-md ${
                isLast
                  ? "font-semibold text-foreground bg-muted/40 cursor-default"
                  : "hover:bg-muted/50 hover:text-foreground cursor-pointer"
              }`}
            >
              {segment}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
