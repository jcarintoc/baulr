import { IconPalette, IconCheck } from "@tabler/icons-react";
import { useThemeStore, AVAILABLE_THEMES } from "@/store/useThemeStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function ThemeSelector() {
  const { theme, setTheme } = useThemeStore();
  const activeTheme = AVAILABLE_THEMES.find((t) => t.id === theme) ?? AVAILABLE_THEMES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" aria-label="Change color theme">
            <IconPalette />
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: activeTheme.accentHex }}
            />
            <span className="hidden sm:inline font-medium">{activeTheme.name}</span>
          </Button>
        }
      />

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Vault Palette</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {AVAILABLE_THEMES.map((t) => {
          const isSelected = t.id === theme;
          return (
            <DropdownMenuItem
              key={t.id}
              onClick={() => setTheme(t.id)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: t.accentHex }}
                />
                <span>{t.name}</span>
              </div>
              {isSelected && <IconCheck className="text-vault-accent-text" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
