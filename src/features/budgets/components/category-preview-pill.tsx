'use client';

import React from 'react';
import { CategoryIcon } from '@/components/icons/category-icon';

interface CategoryPreviewPillProps {
  name: string;
  icon: string;
  color: string;
}

export function CategoryPreviewPill({ name, icon, color }: CategoryPreviewPillProps) {
  const resolvedName = name.trim() || 'New Category';

  return (
    <div className="flex flex-col gap-1.5 select-none w-full">
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Preview</span>
      <div className="flex items-center justify-between p-3.5 border border-border/30 rounded-2xl bg-card/60 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors" 
            style={{ backgroundColor: `${color}15` }}
          >
            <CategoryIcon name={icon} style={{ color }} className="h-4.5 w-4.5" />
          </div>
          <span className="font-extrabold text-sm text-foreground truncate max-w-[180px]">{resolvedName}</span>
        </div>
        <span 
          className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border transition-colors select-none"
          style={{ 
            backgroundColor: `${color}10`, 
            color: color, 
            borderColor: `${color}25` 
          }}
        >
          Preview
        </span>
      </div>
    </div>
  );
}
