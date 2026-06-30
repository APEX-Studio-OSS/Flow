'use client';

import * as React from 'react';
import { FlowFloatingSheet } from './flow-floating-sheet';
import { FlowPopupHeader } from './flow-popup-header';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FlowSelectOption {
  value: string;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  meta?: React.ReactNode;
}

interface FlowSelectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: FlowSelectOption[];
  searchPlaceholder?: string;
  className?: string;
  variant?: 'main' | 'submenu';
  onBack?: () => void;
}

export function FlowSelectSheet({
  open,
  onOpenChange,
  title,
  description,
  value,
  onValueChange,
  options,
  searchPlaceholder,
  className,
  variant = 'main',
  onBack,
}: FlowSelectSheetProps) {
  const [search, setSearch] = React.useState('');

  // Reset search on close/open
  React.useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  // Clean value verification with safe fallbacks
  const verifiedValue = value || '';

  const filteredOptions = React.useMemo(() => {
    if (!searchPlaceholder) return options;
    const query = search.toLowerCase().trim();
    if (!query) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        (opt.value && opt.value.toLowerCase().includes(query)) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(query))
    );
  }, [options, search, searchPlaceholder]);

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
      {variant === 'main' && (
        <FlowPopupHeader title={title} description={description} />
      )}
      
      {/* Search Input (optional) */}
      {searchPlaceholder && (
        <div className="px-1 pt-1.5 select-none">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-xl text-xs bg-background/50 border-input focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      {/* Options Scroll List */}
      <ScrollArea className="scrollable-area h-[250px] pr-1 mt-1.5 select-none">
        <div className="space-y-1 p-1">
          {filteredOptions.map((opt) => {
            const isSelected = verifiedValue === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onValueChange(opt.value);
                  onOpenChange(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between transition-colors text-left focus:outline-none focus:ring-2 focus:ring-primary active:scale-98 border border-transparent",
                  variant === 'submenu' ? "h-12 px-3 text-xs rounded-xl" : "h-14 px-3 text-xs rounded-xl",
                  isSelected 
                    ? variant === 'submenu'
                      ? "bg-primary/10 border-primary/20 text-primary font-bold"
                      : "bg-muted/50 font-bold border-border/40 text-foreground"
                    : variant === 'submenu'
                      ? "bg-background/20 hover:bg-muted/30 text-foreground"
                      : "bg-background/20 hover:bg-muted/50 text-foreground"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {opt.icon && (
                    <span className="flex-shrink-0 h-4.5 w-4.5 flex items-center justify-center text-muted-foreground">
                      {opt.icon}
                    </span>
                  )}
                  <div className="flex flex-col items-start min-w-0">
                    <span className="font-semibold text-xs leading-none">{opt.label}</span>
                    {opt.subLabel && (
                      <span className="text-[10px] text-muted-foreground mt-1 truncate max-w-[240px] font-medium leading-none">
                        {opt.subLabel}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 select-none">
                  {opt.meta && (
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {opt.meta}
                    </span>
                  )}
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
              </button>
            );
          })}
          {filteredOptions.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground select-none">
              No matching options found.
            </div>
          )}
        </div>
      </ScrollArea>
    </FlowFloatingSheet>
  );
}
