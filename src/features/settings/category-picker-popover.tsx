'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategoryIcon } from '@/components/icons/category-icon';
import { FlowFloatingSheet } from '@/components/flow-popups/flow-floating-sheet';

interface CategoryPickerPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'icon' | 'color';
  selectedValue: string;
  onSelect: (value: string) => void;
  trigger: React.ReactNode;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
}

import { CURATED_ICONS } from '@/lib/icon-registry';

export const curatedIcons = CURATED_ICONS;

export const colorPresets = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Fuchsia', value: '#D946EF' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Royal Blue', value: '#2563EB' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Lime', value: '#84CC16' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Terracotta', value: '#C2410C' },
  { name: 'Brown', value: '#78350F' },
  { name: 'Stone', value: '#78716C' },
  { name: 'Slate', value: '#64748B' },
  { name: 'Charcoal', value: '#374151' },
  { name: 'Warm Neutral', value: '#8B5A2B' }
];

export function CategoryPickerPopover({
  isOpen,
  onOpenChange,
  type,
  selectedValue,
  onSelect,
  trigger,
  nameInputRef,
}: CategoryPickerPopoverProps) {

  const refocusNameInput = React.useCallback(() => {
    requestAnimationFrame(() => {
      nameInputRef.current?.focus({ preventScroll: true });
    });
  }, [nameInputRef]);

  const handleSelect = (val: string) => {
    onSelect(val);
    onOpenChange(false);
    refocusNameInput();
  };

  const triggerElement = React.isValidElement(trigger)
    ? React.cloneElement(trigger as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          if (trigger.props.onClick) {
            trigger.props.onClick(e);
          }
          onOpenChange(true);
        }
      })
    : trigger;

  return (
    <>
      {triggerElement}
      <FlowFloatingSheet
        open={isOpen}
        onOpenChange={onOpenChange}
        variant="submenu"
        title={type === 'icon' ? 'Select Icon' : 'Select Color'}
        onBack={() => onOpenChange(false)}
        className={cn(
          "max-h-[300px] space-y-2",
          type === 'icon' ? "w-[288px]" : "w-[272px]"
        )}
        onOpenAutoFocus={(e) => {
          // Prevent focus from shifting to sheet content so input keyboard stays active
          e.preventDefault();
        }}
        onCloseAutoFocus={(e) => {
          // Custom handler to return focus to name input on close
          e.preventDefault();
          refocusNameInput();
        }}
      >
         <div
          className="scrollable-area grid grid-cols-6 gap-1.5 overflow-y-auto px-1.5 pt-0.5 pb-3 no-scrollbar flex-1 max-h-[200px]"
          style={{
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {type === 'icon'
            ? curatedIcons.map((iconName) => {
                const isSelected = selectedValue === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => handleSelect(iconName)}
                    tabIndex={-1}
                    className={cn(
                      "h-9 w-9 rounded-xl border flex items-center justify-center transition-all active:scale-[0.9] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30"
                        : "border-border/30 bg-background/80 hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <CategoryIcon name={iconName} className="h-4.5 w-4.5" />
                  </button>
                );
              })
            : colorPresets.map((preset) => {
                const isSelected = selectedValue.toLowerCase() === preset.value.toLowerCase();
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelect(preset.value)}
                    tabIndex={-1}
                    className={cn(
                      "h-9 w-9 rounded-full border flex items-center justify-center transition-all active:scale-[0.85] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 relative",
                      isSelected
                        ? "ring-2 ring-primary ring-offset-2 scale-95"
                        : "border-border/30 hover:scale-105"
                    )}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                    aria-label={preset.name}
                  >
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-white mix-blend-difference" />
                    )}
                  </button>
                );
              })}
        </div>
      </FlowFloatingSheet>
    </>
  );
}
