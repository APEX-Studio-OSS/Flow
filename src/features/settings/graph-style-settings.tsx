'use client';

import * as React from 'react';
import { BarChart, TrendingUp, PieChart, Check } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import type { GraphStyle } from '@/components/providers/app-provider';
import { cn } from '@/lib/utils';
import { TouchSafePreferenceDropdown } from '@/components/ui/touch-safe-preference-dropdown';

const graphStyles = [
  { value: 'bar', label: 'Bar Chart', icon: <BarChart className="h-4 w-4" /> },
  { value: 'line', label: 'Line Chart', icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'donut', label: 'Donut Chart', icon: <PieChart className="h-4 w-4" /> },
];

export function GraphStyleSettings({
  isOpen,
  onOpenChange
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { graphStyle, setGraphStyle } = useApp();
  const lastSelectedRef = React.useRef<string | null>(null);

  const handleSelect = (newStyle: string) => {
    if (lastSelectedRef.current === newStyle) return;
    lastSelectedRef.current = newStyle;
    setTimeout(() => {
      lastSelectedRef.current = null;
    }, 300);

    setGraphStyle(newStyle as GraphStyle);
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const selectedItem = graphStyles.find((s) => s.value === graphStyle) || graphStyles[0];

  return (
    <TouchSafePreferenceDropdown
      title="Graph Style"
      description="Choose the default chart type for expenses."
      icon={selectedItem.icon}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      triggerContent={
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-muted-foreground flex-shrink-0">{selectedItem.icon}</span>
          <span className="font-semibold text-foreground text-xs truncate">{selectedItem.value.toUpperCase()}</span>
        </div>
      }
    >
      <div className="space-y-1">
        {graphStyles.map((style) => {
          const isSelected = graphStyle === style.value;
          return (
            <button
              key={style.value}
              type="button"
              onPointerUp={(e) => {
                e.stopPropagation();
                handleSelect(style.value);
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(style.value);
              }}
              className={cn(
                "w-full flex items-center justify-between h-11 px-3 text-xs rounded-xl transition-all border border-transparent focus:outline-none focus:ring-1 focus:ring-primary active:scale-98 text-left",
                isSelected 
                  ? "bg-muted/70 font-bold text-foreground"
                  : "hover:bg-muted/40 text-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{style.icon}</span>
                <span className="font-semibold">{style.label}</span>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </TouchSafePreferenceDropdown>
  );
}
