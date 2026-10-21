import { IconList, IconLayoutGrid } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { VaultBreadcrumbs } from "@/components/browser/VaultBreadcrumbs";

interface VaultBrowserToolbarProps {
  currentPath: string;
  onNavigatePath: (path: string) => void;
  viewMode: "table" | "grid";
  onViewModeChange: (mode: "table" | "grid") => void;
}

export function VaultBrowserToolbar({
  currentPath,
  onNavigatePath,
  viewMode,
  onViewModeChange,
}: VaultBrowserToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-0.5">
      <VaultBreadcrumbs currentPath={currentPath} onNavigate={onNavigatePath} />
      <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-muted/30 shrink-0">
        <Button
          variant={viewMode === "table" ? "secondary" : "ghost"}
          size="icon-xs"
          onClick={() => onViewModeChange("table")}
          title="Table view"
          className="cursor-pointer gap-1.5 px-2.5 h-7 w-auto text-xs"
        >
          <IconList className="size-3.5" />
          <span className="hidden sm:inline font-medium text-xs">List</span>
        </Button>
        <Button
          variant={viewMode === "grid" ? "secondary" : "ghost"}
          size="icon-xs"
          onClick={() => onViewModeChange("grid")}
          title="Grid view"
          className="cursor-pointer gap-1.5 px-2.5 h-7 w-auto text-xs"
        >
          <IconLayoutGrid className="size-3.5" />
          <span className="hidden sm:inline font-medium text-xs">Grid</span>
        </Button>
      </div>
    </div>
  );
}
