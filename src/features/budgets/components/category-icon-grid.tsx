'use client';

import React from 'react';
import { CategoryIcon } from '@/components/icons/category-icon';
import { cn } from '@/lib/utils';

interface CategoryIconGridProps {
  value: string;
  onChange: (value: string) => void;
}

const curatedIcons = [
  'ShoppingCart', 'UtensilsCrossed', 'Car', 'Ticket',
  'HeartPulse', 'Zap', 'Home', 'Briefcase',
  'Plane', 'Gift', 'PiggyBank', 'Book',
  'Landmark', 'User', 'MoreHorizontal', 'Circle'
];

export function CategoryIconGrid({ value, onChange }: CategoryIconGridProps) {
  return (
    <div className="flex flex-col gap-1.5 select-none">
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Icon</span>
      <div className="grid grid-cols-4 gap-2.5 p-3.5 border border-border/40 rounded-2xl bg-background/40 max-h-[190px] overflow-y-auto scrollbar-thin">
        {curatedIcons.map((iconName) => {
          const isSelected = value === iconName;
          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onChange(iconName)}
              aria-label={iconName}
              aria-pressed={isSelected}
              className={cn(
                "h-12 w-full rounded-xl border flex items-center justify-center transition-all active:scale-[0.93] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                isSelected
                  ? "border-primary bg-primary/15 text-primary scale-98 font-bold shadow-xs"
                  : "border-border/30 bg-background/50 hover:bg-muted/40 text-muted-foreground"
              )}
            >
              <CategoryIcon name={iconName} className="h-5 w-5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
