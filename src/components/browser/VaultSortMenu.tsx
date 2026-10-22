import { IconArrowsSort, IconCheck } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRemoteFilesStore, SortField, SortDirection } from "@/store/useRemoteFilesStore";

const SORT_OPTIONS: { label: string; field: SortField; dir: SortDirection }[] = [
  { label: "Name (A to Z)", field: "name", dir: "asc" },
  { label: "Name (Z to A)", field: "name", dir: "desc" },
  { label: "Date (Newest)", field: "modified", dir: "desc" },
  { label: "Date (Oldest)", field: "modified", dir: "asc" },
  { label: "Size (Largest)", field: "size", dir: "desc" },
  { label: "Size (Smallest)", field: "size", dir: "asc" },
];

export function VaultSortMenu() {
  const { sortField, sortDirection, setSorting } = useRemoteFilesStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            title="Sort items"
            className="gap-1.5 h-7 px-2 text-xs cursor-pointer"
          >
            <IconArrowsSort className="size-3.5" />
            <span className="hidden sm:inline">Sort</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-40 text-xs">
        {SORT_OPTIONS.map((opt) => {
          const isActive = sortField === opt.field && sortDirection === opt.dir;
          return (
            <DropdownMenuItem
              key={`${opt.field}-${opt.dir}`}
              onClick={() => setSorting(opt.field, opt.dir)}
              className="flex items-center justify-between cursor-pointer text-xs"
            >
              <span>{opt.label}</span>
              {isActive && <IconCheck className="size-3.5 text-vault-accent" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
