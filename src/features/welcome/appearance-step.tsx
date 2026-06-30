'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Check, Palette } from 'lucide-react';
import { useApp, colorThemes } from '@/components/providers/app-provider';
import { useTheme } from '@/components/providers/theme-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AppearanceStepProps {
  setNextDisabled?: (disabled: boolean) => void;
  setOnNext?: (handler: (() => void) | null) => void;
  setNextLabel?: (label: string) => void;
}

export function AppearanceStep({
  setNextDisabled,
  setOnNext,
  setNextLabel,
}: AppearanceStepProps) {
  const { colorThemeName, setColorThemeName, nextStep } = useApp();
  const { resolvedTheme } = useTheme();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const mode = isClient ? resolvedTheme : 'light';

  const handleSelect = useCallback((themeName: string) => {
    setColorThemeName(themeName);
  }, [setColorThemeName]);

  const handleSubmit = useCallback(() => {
    nextStep();
  }, [nextStep]);

  useEffect(() => {
    if (setNextLabel) setNextLabel('Continue');
    if (setNextDisabled) setNextDisabled(false);
    if (setOnNext) setOnNext(handleSubmit);
    return () => {
      if (setOnNext) setOnNext(null);
    };
  }, [setNextLabel, setNextDisabled, setOnNext, handleSubmit]);

  return (
    <Card className="border border-border/40 shadow-md bg-card/60 backdrop-blur-md rounded-3xl w-full select-none font-sans">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-bold tracking-tight">Choose your theme</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Select a color palette for the user interface.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="grid grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
          {colorThemes.map((theme) => {
            const isSelected = colorThemeName === theme.name;
            return (
              <button
                key={theme.name}
                type="button"
                onClick={() => handleSelect(theme.name)}
                className={cn(
                  "w-full flex items-center justify-between h-14 px-3.5 text-xs rounded-2xl transition-all border border-border/40 bg-background/25 focus:outline-none focus:ring-1 focus:ring-primary active:scale-98 text-left hover:bg-muted/30",
                  isSelected && "border-primary bg-primary/5 shadow-sm font-bold"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
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
                  <span className="font-semibold text-foreground text-xs truncate">{theme.name}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
