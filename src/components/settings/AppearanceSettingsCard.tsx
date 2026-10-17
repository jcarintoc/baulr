import { IconPalette, IconCheck } from "@tabler/icons-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useThemeStore, AVAILABLE_THEMES } from "@/store/useThemeStore";

const THEME_DESCRIPTIONS: Record<string, string> = {
  obsidian: "Deep charcoal canvas with emerald beacon highlights.",
  titanium: "Metallic slate finish with cool sky cyan accents.",
  bronze: "Warm dark earth tones with glowing amber bronze.",
};

export function AppearanceSettingsCard() {
  const { theme, setTheme } = useThemeStore();

  return (
    <Card className="bg-card/60 backdrop-blur border-border">
      <CardHeader>
        <div className="flex items-center gap-2 text-foreground">
          <IconPalette />
          <CardTitle>Appearance & Theme</CardTitle>
        </div>
        <CardDescription>
          Personalize the visual tone and accent palette of your vault interface.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {AVAILABLE_THEMES.map((t) => {
            const isSelected = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`relative flex flex-col items-start gap-2 p-3.5 rounded-lg border text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/30 ${
                  isSelected
                    ? "border-vault-accent-border bg-vault-accent-muted/40"
                    : "border-border/70 bg-card/40 hover:bg-input/20 hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full shrink-0 ring-2 ring-background"
                      style={{ backgroundColor: t.accentHex }}
                    />
                    <span className="font-medium text-xs text-foreground">
                      {t.name}
                    </span>
                  </div>
                  {isSelected && (
                    <IconCheck className="size-3.5 text-vault-accent-text" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {THEME_DESCRIPTIONS[t.id] ?? t.name}
                </p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
