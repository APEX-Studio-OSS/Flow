'use client';

import * as React from 'react';
import { FlowFloatingSheet } from './flow-floating-sheet';
import { FlowPopupHeader } from './flow-popup-header';
import { cn } from '@/lib/utils';

export interface FlowActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

interface FlowActionMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  items: FlowActionMenuItem[];
  className?: string;
  variant?: 'main' | 'submenu';
  onBack?: () => void;
}

export function FlowActionMenu({
  open,
  onOpenChange,
  title,
  description,
  items,
  className,
  variant = 'main',
  onBack,
}: FlowActionMenuProps) {
  return (
    <FlowFloatingSheet 
      open={open} 
      onOpenChange={onOpenChange} 
      className={className}
      variant={variant}
      title={title}
      description={description}
      onBack={onBack}
    >
      {variant === 'main' && (title || description) && (
        <FlowPopupHeader title={title || ''} description={description} />
      )}
      <div className="flex flex-col gap-1.5 pt-1.5 select-none">
        {items.map((item, index) => {
          const isDestructive = item.destructive;
          return (
            <button
              key={index}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  onOpenChange(false);
                }
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 rounded-xl text-left transition-all active:scale-98 select-none focus:outline-none focus:ring-2 focus:ring-primary",
                variant === 'submenu' ? "h-12 text-xs font-semibold" : "h-14 text-sm font-bold",
                isDestructive
                  ? "bg-destructive/10 hover:bg-destructive/20 text-destructive"
                  : "bg-muted/30 hover:bg-muted/60 text-foreground",
                item.disabled && "opacity-40 cursor-not-allowed active:scale-100"
              )}
            >
              {item.icon && (
                <span className={cn("flex-shrink-0 h-4.5 w-4.5 flex items-center justify-center", isDestructive ? "text-destructive" : "text-muted-foreground")}>
                  {item.icon}
                </span>
              )}
              <span className="flex-1 truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </FlowFloatingSheet>
  );
}
