'use client';

import * as React from 'react';
import { FlowFloatingSheet } from './flow-floating-sheet';
import { FlowPopupHeader } from './flow-popup-header';
import { FlowPopupFooter } from './flow-popup-footer';

export interface BottomFloatingFormProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string | number;
  dismissOnBackdrop?: boolean;
  dragToDismiss?: boolean;
  priority?: number;
  className?: string;
  onOpenAutoFocus?: (e: Event) => void;
  id?: string;
  visuallyHiddenHeader?: boolean;
  onExitComplete?: () => void;
}

export function BottomFloatingForm({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxHeight = '80dvh',
  dismissOnBackdrop = true,
  dragToDismiss = true,
  priority = 2,
  className,
  onOpenAutoFocus,
  id,
  visuallyHiddenHeader = false,
  onExitComplete,
}: BottomFloatingFormProps) {
  const handleOpenChange = React.useCallback((isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  }, [onClose]);

  const handlePointerDownOutside = React.useCallback((e: Event) => {
    if (!dismissOnBackdrop) {
      e.preventDefault();
    }
  }, [dismissOnBackdrop]);

  return (
    <FlowFloatingSheet
      id={id}
      open={open}
      onOpenChange={handleOpenChange}
      className={className}
      onPointerDownOutside={handlePointerDownOutside}
      dragToDismiss={dragToDismiss}
      priority={priority}
      style={{ maxHeight }}
      onOpenAutoFocus={onOpenAutoFocus}
      onExitComplete={onExitComplete}
    >
      {title && (
        <div className={visuallyHiddenHeader ? "sr-only" : undefined}>
          <FlowPopupHeader
            title={title}
            description={description}
          />
        </div>
      )}

      <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
        <div className="scrollable-area overflow-y-auto flex-1 space-y-3 px-1.5 min-h-0 py-1">
          {children}
        </div>

        {footer && (
          <FlowPopupFooter className="pt-1.5">
            {footer}
          </FlowPopupFooter>
        )}
      </div>
    </FlowFloatingSheet>
  );
}
