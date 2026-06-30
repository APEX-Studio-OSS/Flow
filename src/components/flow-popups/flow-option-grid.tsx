'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FlowOptionGridItem {
  id: string;
  node: React.ReactNode;
  label?: string;
  color?: string;
}

interface FlowOptionGridProps {
  items: FlowOptionGridItem[];
  value: string;
  onSelect: (id: string) => void;
  columns?: string;
  maxHeight?: string;
  className?: string;
}

export function FlowOptionGrid({
  items,
  value,
  onSelect,
  columns = 'grid-cols-4',
  maxHeight = 'max-h-[160px]',
  className,
}: FlowOptionGridProps) {
  return (
    <div
      className={cn(
        "grid gap-2 p-1.5 border border-border/40 rounded-2xl bg-background/50 overflow-y-auto select-none",
        columns,
        maxHeight,
        className
      )}
    >
      {items.map((item) => {
        const isSelected = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            aria-label={item.label || item.id}
            aria-pressed={isSelected}
            className={cn(
              "p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 active:scale-95 transition-all text-center focus:outline-none focus:ring-2 focus:ring-primary",
              isSelected
                ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                : "border-border/40 hover:bg-muted/40 text-muted-foreground"
            )}
            style={
              isSelected
                ? undefined
                : item.color
                ? { backgroundColor: `${item.color}15` }
                : undefined
            }
          >
            <div className="flex items-center justify-center">
              {item.node}
            </div>
            {item.label && (
              <span className="text-[9px] font-semibold tracking-wide truncate w-full mt-0.5 leading-none">
                {item.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
