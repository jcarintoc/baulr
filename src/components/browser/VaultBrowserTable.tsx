import { useState } from "react";
import {
  FileText,
  Search,
  Download,
  Trash2,
  Cloud,
  FolderArchive,
  ShieldCheck,
} from "lucide-react";
import { formatBytes } from "@/lib/formatters";
import { useRemoteFilesStore } from "@/store/useRemoteFilesStore";

export function VaultBrowserTable() {
  const { files, searchQuery, setSearchQuery, deleteToCloudTrash } =
    useRemoteFilesStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalVaultBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      deleteToCloudTrash(id);
      setDeletingId(null);
    }, 200);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Summary Bar */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <FolderArchive className="w-5 h-5 text-vault-accent-text" />
          <div>
            <h3 className="font-semibold text-sm text-neutral-100">
              Vault Directory ({files.length} {files.length === 1 ? "file" : "files"})
            </h3>
            <p className="text-xs text-neutral-400 tabular-nums">
              Total pooled archive: {formatBytes(totalVaultBytes)}
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vault files..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700 transition"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
        {filteredFiles.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 text-neutral-600" />
            <p className="text-xs text-neutral-400">
              {files.length === 0
                ? "No files offloaded to the vault yet."
                : "No files match your search query."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/60 text-neutral-400">
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">Size</th>
                  <th className="py-3 px-4 font-medium">Cloud Target</th>
                  <th className="py-3 px-4 font-medium">Offloaded</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredFiles.map((file) => (
                  <tr
                    key={file.id}
                    className="hover:bg-neutral-900/50 transition group"
                  >
                    <td className="py-3 px-4 text-neutral-200 font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
                      <span className="truncate max-w-xs">{file.name}</span>
                    </td>
                    <td className="py-3 px-4 text-neutral-300 tabular-nums">
                      {formatBytes(file.sizeBytes)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-neutral-800 text-neutral-300 border border-neutral-700/50">
                        <Cloud className="w-3 h-3 text-vault-accent-text" />
                        <span>{file.provider}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-400 tabular-nums">
                      {file.modifiedAt}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="Download file"
                          className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Move to Cloud Trash"
                          onClick={() => handleDelete(file.id)}
                          disabled={deletingId === file.id}
                          className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Non-destructive Trash Safety Callout */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 px-1">
        <ShieldCheck className="w-3.5 h-3.5 text-vault-accent-text" />
        <span>
          Zero-loss invariant: Deleting files moves them to your provider’s Cloud Trash bin.
        </span>
      </div>
    </div>
  );
}
