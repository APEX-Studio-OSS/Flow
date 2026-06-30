'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface CategoryColorPaletteProps {
  value: string;
  onChange: (value: string) => void;
}

const colorPresets = [
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Coral', value: '#FF5757' },
  { name: 'Orange', value: '#EF6C00' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Mint', value: '#20C997' },
  { name: 'Teal', value: '#06B6D4' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Slate', value: '#64748B' },
];

export function CategoryColorPalette({ value, onChange }: CategoryColorPaletteProps) {
  return (
    <div className="flex flex-col gap-1.5 select-none">
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Color</span>
      <div className="flex flex-wrap gap-2.5 p-3.5 border border-border/40 rounded-2xl bg-background/40 items-center justify-center">
        {colorPresets.map((preset) => {
          const isSelected = value.toLowerCase() === preset.value.toLowerCase();
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => onChange(preset.value)}
              className={cn(
                "h-8.5 w-8.5 rounded-full transition-all border border-border/10 flex items-center justify-center relative active:scale-[0.9] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                isSelected && "ring-2 ring-primary ring-offset-2"
              )}
              style={{ backgroundColor: preset.value }}
              aria-label={preset.name}
            >
              {isSelected && (
                <Check className="h-4 w-4 text-white mix-blend-difference" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
