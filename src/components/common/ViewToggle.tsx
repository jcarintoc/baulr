import { useViewStore } from "@/store/useViewStore";
import { IconCloudDownload, IconArchive } from "@tabler/icons-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ViewToggle() {
  const { activeView, setActiveView } = useViewStore();

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
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
