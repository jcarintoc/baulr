import { useState } from "react";
import { IconGauge, IconCheck } from "@tabler/icons-react";
import { useBandwidthStore } from "@/store/useBandwidthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const PRESET_OPTIONS = [
  { label: "Unlimited", rate: "off" },
  { label: "25 MB/s", rate: "25M:off" },
  { label: "10 MB/s", rate: "10M:off" },
  { label: "5 MB/s", rate: "5M:off" },
  { label: "2 MB/s", rate: "2M:off" },
];

export function BandwidthMenu() {
  const { currentRate, displayLabel, setLimit } = useBandwidthStore();
  const [open, setOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(customValue.trim(), 10);
    if (!isNaN(num) && num > 0) {
      setLimit(`${num}M:off`);
      setCustomValue("");
      setOpen(false);
    }
  };

  const handlePresetSelect = (rate: string) => {
    setLimit(rate);
    setOpen(false);
  };

  const isPreset = PRESET_OPTIONS.some((p) => p.rate === currentRate);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label="Upload speed limit"
            title="Upload speed limit"
            className="h-8 gap-1.5 text-xs font-normal"
          >
            <IconGauge className="text-muted-foreground" />
            <span className="font-medium">{displayLabel}</span>
          </Button>
        }
      />

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="font-semibold text-xs text-foreground">Upload Speed Limit</span>
          <span className="text-xs font-normal text-muted-foreground">
            Cap background upload speed
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {PRESET_OPTIONS.map((opt) => {
          const isSelected = currentRate === opt.rate;
          return (
            <DropdownMenuItem
              key={opt.rate}
              onClick={() => handlePresetSelect(opt.rate)}
              className="flex items-center justify-between cursor-pointer"
            >
              <span>{opt.label}</span>
              {isSelected && <IconCheck className="text-vault-accent-text" />}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        <form
          onSubmit={handleCustomSubmit}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 p-1.5"
        >
          <Input
            type="number"
            min="1"
            max="10000"
            placeholder="Custom"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="h-7 text-xs w-20 px-2"
          />
          <span className="text-xs text-muted-foreground shrink-0">MB/s</span>
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={!customValue.trim() || parseInt(customValue, 10) <= 0}
            className="h-7 px-2.5 text-xs ml-auto"
          >
            Set
          </Button>
        </form>
        {!isPreset && currentRate !== "off" && (
          <div className="px-2 pb-1.5 text-xs text-vault-accent-text flex items-center justify-between">
            <span>Active custom: {displayLabel}</span>
            <IconCheck />
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
