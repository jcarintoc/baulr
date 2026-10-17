import { useState } from "react";
import { IconGauge, IconCheck } from "@tabler/icons-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBandwidthStore } from "@/store/useBandwidthStore";

const PRESETS = [
  { label: "Unlimited", rate: "off" },
  { label: "25 MB/s", rate: "25M:off" },
  { label: "10 MB/s", rate: "10M:off" },
  { label: "5 MB/s", rate: "5M:off" },
  { label: "2 MB/s", rate: "2M:off" },
];

export function NetworkSettingsCard() {
  const { currentRate, displayLabel, isLoading, error, setLimit } = useBandwidthStore();
  const [customValue, setCustomValue] = useState("");

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(customValue);
    if (val > 0) {
      await setLimit(`${Math.floor(val)}M:off`);
      setCustomValue("");
    }
  };

  const isPreset = PRESETS.some((p) => p.rate === currentRate);

  return (
    <Card className="bg-card/60 backdrop-blur border-border">
      <CardHeader>
        <div className="flex items-center gap-2 text-foreground">
          <IconGauge />
          <CardTitle>Network & Transfer Limits</CardTitle>
        </div>
        <CardDescription>
          Cap background cloud upload speed so your home network stays fast for streaming and browsing.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-foreground">Speed Presets</span>
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((preset) => {
              const isSelected = currentRate === preset.rate;
              return (
                <Button
                  key={preset.rate}
                  type="button"
                  variant={isSelected ? "secondary" : "outline"}
                  size="sm"
                  disabled={isLoading}
                  onClick={() => setLimit(preset.rate)}
                  className={`h-8 px-3 text-xs gap-1.5 transition-all ${
                    isSelected ? "border-vault-accent-border font-medium" : ""
                  }`}
                >
                  {isSelected && <IconCheck className="size-3 text-vault-accent-text" />}
                  <span>{preset.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Custom limit:</span>
            <Input
              type="number"
              min="1"
              max="10000"
              placeholder="e.g. 15"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="h-8 text-xs w-24 px-2.5"
            />
            <span className="text-xs text-muted-foreground shrink-0">MB/s</span>
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              disabled={isLoading || Number(customValue) <= 0}
              className="h-8 px-3 text-xs"
            >
              Apply
            </Button>
          </form>

          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span>Active upload cap:</span>
            <span className="font-medium text-vault-accent-text">
              {displayLabel}
              {!isPreset && currentRate !== "off" ? " (Custom)" : ""}
            </span>
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
