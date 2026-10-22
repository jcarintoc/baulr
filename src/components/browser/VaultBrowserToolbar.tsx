import { useState } from "react";
import {
  IconList,
  IconLayoutGrid,
  IconFolderPlus,
  IconCloudUpload,
  IconChevronDown,
  IconFile,
  IconFolder,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VaultBreadcrumbs } from "@/components/browser/VaultBreadcrumbs";
import { CreateFolderModal } from "@/components/browser/CreateFolderModal";
import { useRemoteFilesStore } from "@/store/useRemoteFilesStore";
import { useTransferStore } from "@/store/useTransferStore";
import { useViewStore } from "@/store/useViewStore";
import { selectOffloadFolder, selectOffloadFiles } from "@/lib/api/offload";

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
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const { createFolder } = useRemoteFilesStore();
  const { enqueuePaths } = useTransferStore();
  const { setActiveView } = useViewStore();

  const handleUploadFiles = async () => {
    const selected = await selectOffloadFiles().catch(() => null);
    if (selected && selected.length > 0) {
      await enqueuePaths(selected, undefined, currentPath || undefined);
      setActiveView("dashboard");
    }
  };

  const handleUploadFolder = async () => {
    const selected = await selectOffloadFolder().catch(() => null);
    if (selected) {
      await enqueuePaths([selected.path], undefined, currentPath || undefined);
      setActiveView("dashboard");
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-0.5">
      <VaultBreadcrumbs currentPath={currentPath} onNavigate={onNavigatePath} />

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsNewFolderOpen(true)}
          title="Create a new folder"
          className="gap-1.5 h-7 px-2.5 text-xs cursor-pointer"
        >
          <IconFolderPlus className="size-3.5" />
          <span>New folder</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                title="Upload folder or files to this location"
                className="gap-1.5 h-7 px-2.5 text-xs cursor-pointer"
              >
                <IconCloudUpload className="size-3.5" />
                <span>Upload here</span>
                <IconChevronDown className="size-3 opacity-60" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handleUploadFiles} className="gap-2 cursor-pointer text-xs">
              <IconFile className="size-3.5" />
              <span>Upload files...</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleUploadFolder} className="gap-2 cursor-pointer text-xs">
              <IconFolder className="size-3.5" />
              <span>Upload folder...</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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

      <CreateFolderModal
        open={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
        currentPath={currentPath}
        onCreateFolder={createFolder}
      />
    </div>
  );
}
