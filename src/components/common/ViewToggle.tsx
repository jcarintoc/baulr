import { useViewStore } from "@/store/useViewStore";
import { HardDriveDownload, FolderArchive } from "lucide-react";
import { useRemoteFilesStore } from "@/store/useRemoteFilesStore";

export function ViewToggle() {
  const { activeView, setActiveView } = useViewStore();
  const fileCount = useRemoteFilesStore((s) => s.files.length);

  return (
    <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl self-start">
      <button
        onClick={() => setActiveView("dashboard")}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
          activeView === "dashboard"
            ? "bg-neutral-800 text-white"
            : "text-neutral-400 hover:text-neutral-200"
        }`}
      >
        <HardDriveDownload className="w-3.5 h-3.5" />
        <span>Offload & Capacity</span>
      </button>

      <button
        onClick={() => setActiveView("files")}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
          activeView === "files"
            ? "bg-neutral-800 text-white"
            : "text-neutral-400 hover:text-neutral-200"
        }`}
      >
        <FolderArchive className="w-3.5 h-3.5" />
        <span>Vault Files</span>
        <span className="px-1.5 py-0.5 rounded-full text-xs bg-neutral-800 text-neutral-300 font-mono">
          {fileCount}
        </span>
      </button>
    </div>
  );
}
