import { useState } from "react";
import {
  IconList,
  IconLayoutGrid,
  IconFolderPlus,
  IconCloudUpload,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { VaultBreadcrumbs } from "@/components/browser/VaultBreadcrumbs";
import { CreateFolderModal } from "@/components/browser/CreateFolderModal";
import { useRemoteFilesStore } from "@/store/useRemoteFilesStore";
import { useTransferStore } from "@/store/useTransferStore";
import { useViewStore } from "@/store/useViewStore";
import { selectOffloadFolder } from "@/lib/api/offload";

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

  const handleUploadHere = async () => {
    const selected = await selectOffloadFolder().catch(() => null);
    if (selected) {
      await enqueuePaths([selected.path], undefined, currentPath);
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

        <Button
          variant="outline"
          size="sm"
          onClick={handleUploadHere}
          title="Upload folder or files to this location"
          className="gap-1.5 h-7 px-2.5 text-xs cursor-pointer"
        >
          <IconCloudUpload className="size-3.5" />
          <span>Upload here</span>
        </Button>

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
