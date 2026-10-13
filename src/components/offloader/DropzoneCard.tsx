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
      role="region"
      aria-label="File offloader drop zone"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`p-10 rounded-2xl border-2 border-dashed transition flex flex-col items-center justify-center gap-3.5 text-center group ${
        isDragging
          ? "border-neutral-500 bg-neutral-900/80"
          : "border-neutral-800 hover:border-neutral-700 bg-neutral-900/30 hover:bg-neutral-900/50"
      }`}
    >
      <div className="w-12 h-12 rounded-xl bg-neutral-800/80 text-neutral-400 group-hover:text-neutral-200 border border-neutral-700/40 flex items-center justify-center transition">
        <ArrowUpCircle className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-semibold text-sm text-neutral-200">
          Drag and drop folders or files here to offload
        </h3>
        <p className="text-xs text-neutral-400 mt-1 max-w-md leading-relaxed">
          Files are backed up to your unified cloud vault and removed from this computer once safely saved.
        </p>
      </div>
      <button
        type="button"
        onClick={() => onSelectFolder("Family_Photos_Archive", 1024 * 1024 * 1024 * 3.1)}
        className="mt-1 text-xs font-medium px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-100 hover:text-white border border-neutral-700 transition flex items-center gap-2 cursor-pointer"
      >
        <Folder className="w-3.5 h-3.5 text-neutral-400" />
        <span>Select Folder to Free Up Space</span>
      </button>
    </section>
  );
}
