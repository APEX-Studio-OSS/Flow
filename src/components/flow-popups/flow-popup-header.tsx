'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FlowPopupHeaderProps {
  title: string;
  description?: string;
  onClose?: () => void;
  className?: string;
}

export function FlowPopupHeader({ title, description, onClose, className }: FlowPopupHeaderProps) {
  return (
    <div className={cn("popup-drag-region popup-header flex flex-col space-y-1.5 text-left relative pr-10 select-none", className)}>
      <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
      {description && (
        <p className="text-xs text-muted-foreground leading-normal">{description}</p>
      )}
      {onClose && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-0 top-0 h-10 w-10 rounded-full hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring text-muted-foreground hover:text-foreground transition-all duration-200"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
