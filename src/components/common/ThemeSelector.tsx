import { useState, useRef, useEffect } from "react";
import { Palette, Check } from "lucide-react";
import { useThemeStore, AVAILABLE_THEMES } from "@/store/useThemeStore";

export function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useThemeStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeTheme = AVAILABLE_THEMES.find((t) => t.id === theme) || AVAILABLE_THEMES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change color theme"
        className="flex items-center gap-2 text-xs text-neutral-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 transition cursor-pointer"
      >
        <Palette className="w-3.5 h-3.5 text-neutral-400" />
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: activeTheme.accentHex }}
        />
        <span className="hidden sm:inline font-medium">{activeTheme.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-neutral-900 border border-neutral-800 p-1.5 z-50 flex flex-col gap-1">
          <div className="px-2.5 py-1 text-xs text-neutral-400 font-medium border-b border-neutral-800/80 mb-0.5">
            Vault Palette
          </div>
          {AVAILABLE_THEMES.map((t) => {
            const isSelected = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTheme(t.id);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer w-full text-left ${
                  isSelected
                    ? "bg-neutral-800 text-white font-medium"
                    : "text-neutral-300 hover:text-white hover:bg-neutral-800/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: t.accentHex }}
                  />
                  <span>{t.name}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-vault-accent-text" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
