'use client';

import * as React from 'react';
import { Palette, Check } from 'lucide-react';
import { useApp, colorThemes } from '@/components/providers/app-provider';
import { useTheme } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';
import { TouchSafePreferenceDropdown } from '@/components/ui/touch-safe-preference-dropdown';

export function ColorSettings({
  isOpen,
  onOpenChange,
  buttonWidth = 'w-[120px]',
  description
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  buttonWidth?: string;
  description?: string;
}) {
  const { colorThemeName, setColorThemeName } = useApp();
  const { resolvedTheme } = useTheme();
  const [isClient, setIsClient] = React.useState(false);

  const lastSelectedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const selectedTheme = colorThemes.find((t) => t.name === colorThemeName) || colorThemes[0];
  const mode = isClient ? resolvedTheme : 'light';

  const handleSelect = (themeName: string) => {
    if (lastSelectedRef.current === themeName) return;
    lastSelectedRef.current = themeName;
    setTimeout(() => {
      lastSelectedRef.current = null;
    }, 300);

    setColorThemeName(themeName);
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <TouchSafePreferenceDropdown
      title="Color Palette"
      description={description ?? "Select a color palette for the user interface."}
      icon={<Palette className="h-6 w-6 text-muted-foreground flex-shrink-0" />}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      buttonWidth={buttonWidth}
      triggerContent={
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex -space-x-1 flex-shrink-0">
            <div
              className="h-3.5 w-3.5 rounded-full border border-background shadow-sm"
              style={{ backgroundColor: isClient ? `hsl(${selectedTheme.primary[mode]})` : undefined }}
            />
            <div
              className="h-3.5 w-3.5 rounded-full border border-background shadow-sm"
              style={{ backgroundColor: isClient ? `hsl(${selectedTheme.accent[mode]})` : undefined }}
            />
          </div>
          <span className="font-semibold text-foreground text-xs truncate">{selectedTheme.name}</span>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {colorThemes.map((theme) => {
          const isSelected = colorThemeName === theme.name;
          return (
            <button
              key={theme.name}
              type="button"
              onPointerUp={(e) => {
                e.stopPropagation();
                handleSelect(theme.name);
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(theme.name);
              }}
              className={cn(
                "w-full flex items-center justify-between h-11 px-3 text-xs rounded-xl transition-all border border-transparent focus:outline-none focus:ring-1 focus:ring-primary active:scale-98 text-left",
                isSelected 
                  ? "bg-muted/70 font-bold text-foreground"
                  : "hover:bg-muted/40 text-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex -space-x-1.5 flex-shrink-0">
                  <div
                    className="h-4 w-4 rounded-full border border-background shadow-sm"
                    style={{ backgroundColor: isClient ? `hsl(${theme.primary[mode]})` : undefined }}
                  />
                  <div
                    className="h-4 w-4 rounded-full border border-background shadow-sm"
                    style={{ backgroundColor: isClient ? `hsl(${theme.accent[mode]})` : undefined }}
                  />
                </div>
                <span className="font-semibold">{theme.name}</span>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </TouchSafePreferenceDropdown>
  );
}
