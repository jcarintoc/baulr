import {
  IconFolder,
  IconChevronRight,
  IconArrowLeft,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface VaultBreadcrumbsProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  maxVisible?: number;
}

export function VaultBreadcrumbs({
  currentPath,
  onNavigate,
  maxVisible = 2,
}: VaultBreadcrumbsProps) {
  const segments = currentPath.split("/").filter(Boolean);

  const handleBack = () => {
    if (segments.length === 0) return;
    onNavigate(segments.slice(0, -1).join("/"));
  };

  const isCollapsed = segments.length > maxVisible;
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];
  const hiddenSegments = isCollapsed
    ? segments.slice(1, -1).map((name, idx) => ({
        name,
        path: segments.slice(0, idx + 2).join("/"),
      }))
    : [];

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

      {isCollapsed ? (
        <>
          <div className="flex items-center gap-1 shrink-0">
            <IconChevronRight className="size-3 text-muted-foreground/40 shrink-0" />
            <button
              type="button"
              onClick={() => onNavigate(firstSegment)}
              className="transition-colors truncate max-w-[140px] px-2 py-1 rounded-md hover:bg-muted/50 hover:text-foreground cursor-pointer"
            >
              {firstSegment}
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <IconChevronRight className="size-3 text-muted-foreground/40 shrink-0" />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    title={`Hidden folders: ${hiddenSegments.map((s) => s.name).join(" / ")}`}
                    className="flex items-center justify-center px-1.5 py-0.5 rounded-md text-xs font-semibold tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                    aria-label="Show hidden breadcrumb folders"
                  >
                    ...
                  </button>
                }
              />
              <DropdownMenuContent align="start" className="min-w-40">
                {hiddenSegments.map((item) => (
                  <DropdownMenuItem
                    key={item.path}
                    onClick={() => onNavigate(item.path)}
                    className="flex items-center gap-2 cursor-pointer text-xs"
                  >
                    <IconFolder className="size-3.5 text-vault-accent-text shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <IconChevronRight className="size-3 text-muted-foreground/40 shrink-0" />
            <span className="truncate max-w-[160px] px-2 py-1 rounded-md font-semibold text-foreground bg-muted/40">
              {lastSegment}
            </span>
          </div>
        </>
      ) : (
        segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          return (
            <div key={index} className="flex items-center gap-1 shrink-0">
              <IconChevronRight className="size-3 text-muted-foreground/40 shrink-0" />
              <button
                type="button"
                onClick={() =>
                  onNavigate(segments.slice(0, index + 1).join("/"))
                }
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
        })
      )}
    </nav>
  );
}
