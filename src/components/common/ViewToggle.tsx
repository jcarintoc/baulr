import { useViewStore } from "@/store/useViewStore";
import { IconCloudDownload, IconArchive } from "@tabler/icons-react";
import { useRemoteFilesStore } from "@/store/useRemoteFilesStore";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function ViewToggle() {
  const { activeView, setActiveView } = useViewStore();
  const fileCount = useRemoteFilesStore((s) => s.files.length);

  return (
    <Tabs
      value={activeView}
      onValueChange={(value) => setActiveView(value as "dashboard" | "files")}
    >
      <TabsList>
        <TabsTrigger value="dashboard">
          <IconCloudDownload />
          <span>Offload & Capacity</span>
        </TabsTrigger>
        <TabsTrigger value="files">
          <IconArchive />
          <span>Vault Files</span>
          <Badge variant="secondary" className="px-1.5 py-0 text-[0.625rem] font-mono">
            {fileCount}
          </Badge>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
