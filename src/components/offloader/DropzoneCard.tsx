import { useState } from "react";
import { ArrowUpCircle, Folder } from "lucide-react";

interface DropzoneCardProps {
  onSelectFolder: (name: string, sizeBytes: number) => void;
}

export function DropzoneCard({ onSelectFolder }: DropzoneCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Simulate folder drop
    onSelectFolder("Family_Vacation_2025", 1024 * 1024 * 1024 * 2.4);
  };

  return (
    <section
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`p-10 rounded-2xl border-2 border-dashed transition flex flex-col items-center justify-center gap-3 text-center cursor-pointer group ${
        isDragging
          ? "border-sky-500 bg-sky-500/10"
          : "border-neutral-800 hover:border-sky-500/50 bg-neutral-900/20 hover:bg-sky-500/5"
      }`}
    >
      <div className="w-14 h-14 rounded-2xl bg-neutral-800 group-hover:bg-sky-500/20 text-neutral-400 group-hover:text-sky-400 flex items-center justify-center transition">
        <ArrowUpCircle className="w-7 h-7" />
      </div>
      <div>
        <h3 className="font-semibold text-base text-neutral-200">
          Drag and drop folders or files here to offload
        </h3>
        <p className="text-xs text-neutral-400 mt-1 max-w-md">
          Files are transferred to your pooled cloud vault, verified cryptographically,
          and safely moved to your Trash to reclaim SSD space.
        </p>
      </div>
      <button
        onClick={() => onSelectFolder("Family_Photos_Archive", 1024 * 1024 * 1024 * 3.1)}
        className="mt-2 text-xs font-semibold px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition flex items-center gap-2 cursor-pointer"
      >
        <Folder className="w-3.5 h-3.5" />
        <span>Select Folder to Free Up Space</span>
      </button>
    </section>
  );
}
