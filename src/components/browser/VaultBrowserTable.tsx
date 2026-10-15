import { useState } from "react";
import {
  IconFileText,
  IconSearch,
  IconDownload,
  IconTrash,
  IconCloud,
  IconArchive,
  IconFolder,
} from "@tabler/icons-react";
import { formatBytes } from "@/lib/formatters";
import { useRemoteFilesStore } from "@/store/useRemoteFilesStore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

export function VaultBrowserTable() {
  const { files, searchQuery, setSearchQuery, deleteToCloudTrash } =
    useRemoteFilesStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const totalBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      deleteToCloudTrash(id);
      setDeletingId(null);
    }, 200);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="bg-card/75 border-border">
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <IconArchive className="size-5 text-vault-accent-text" />
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                Vault Directory ({files.length}{" "}
                {files.length === 1 ? "file" : "files"})
              </h3>
              <p className="text-xs text-muted-foreground tabular-nums">
                Total pooled archive: {formatBytes(totalBytes)}
              </p>
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <IconSearch className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vault files..."
              className="pl-8 text-xs bg-muted/30 border-border"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card/75 overflow-hidden p-0">
        {filtered.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconFileText className="size-4 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No files found</EmptyTitle>
              <EmptyDescription>
                {files.length === 0
                  ? "No files offloaded to the vault yet."
                  : "No files match your search query."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Size</TableHead>
                <TableHead className="text-muted-foreground">
                  Cloud Target
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Offloaded
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {filtered.map((file) => (
                <TableRow
                  key={file.id}
                  className="border-border/60 hover:bg-muted/30"
                >
                  <TableCell className="text-foreground font-medium">
                    <div className="flex items-center gap-2">
                      <IconFileText className="size-4 text-muted-foreground shrink-0" />
                      <span className="truncate max-w-xs">{file.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground/90 tabular-nums">
                    {formatBytes(file.sizeBytes)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-border text-foreground/80 gap-1.5"
                    >
                      <IconCloud className="text-vault-accent-text" />
                      <span>{file.provider}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {file.modifiedAt}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Download file"
                      >
                        <IconDownload />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Move to Cloud Trash"
                        onClick={() => handleDelete(file.id)}
                        disabled={deletingId === file.id}
                        className="hover:text-destructive"
                      >
                        <IconTrash />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <IconFolder className="size-3.5 text-vault-accent-text" />
        <span>
          Deleted files are moved to your cloud trash so you can restore them
          anytime.
        </span>
      </div>
    </div>
  );
}
