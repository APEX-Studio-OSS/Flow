'use client';

import * as React from 'react';
import { FlowDialog } from './flow-dialog';
import { FlowPopupHeader } from './flow-popup-header';
import { FlowPopupFooter } from './flow-popup-footer';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'framer-motion';

interface FlowAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'destructive' | 'warning' | 'info';
  className?: string;
  onExitComplete?: () => void;
  closeDisabled?: boolean;
  isSubmitting?: boolean;
  showCancel?: boolean;
}

export function FlowAlert({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'destructive',
  className,
  onExitComplete,
  closeDisabled = false,
  isSubmitting = false,
  showCancel = true,
}: FlowAlertProps) {
  const shouldReduceMotion = useReducedMotion();

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const iconVariants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.22,
        delay: 0.06,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <FlowDialog open={open} onOpenChange={onOpenChange} className={cn("p-5 select-none", className)} onExitComplete={onExitComplete} closeDisabled={closeDisabled}>
      <div className="flex flex-col space-y-4">
        {/* Header Icon + Title */}
        <div className="flex items-start gap-3">
          <motion.div
            variants={shouldReduceMotion ? undefined : iconVariants}
            initial={shouldReduceMotion ? undefined : "hidden"}
            animate={shouldReduceMotion ? undefined : "visible"}
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
              variant === 'destructive' && "bg-destructive/10 text-destructive",
              variant === 'warning' && "bg-amber-500/10 text-amber-500",
              variant === 'info' && "bg-blue-500/10 text-blue-500"
            )}
          >
            <AlertCircle className="h-5 w-5" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground leading-normal">{title}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Footer actions */}
        <FlowPopupFooter className="mt-4 gap-2 flex-col sm:flex-row">
          {showCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="rounded-xl h-11 text-xs font-semibold border-input btn-premium-touch"
            >
              {cancelText}
            </Button>
          )}
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isSubmitting) {
                handleConfirm();
              }
            }}
            disabled={isSubmitting}
            className={cn(
              "rounded-xl h-11 text-xs font-semibold text-white btn-premium-touch flex items-center justify-center gap-1.5",
              showCancel ? "min-w-[120px]" : "w-full",
              variant === 'destructive' && "bg-destructive hover:bg-destructive/90",
              variant === 'warning' && "bg-amber-500 hover:bg-amber-600 text-foreground",
              variant === 'info' && "bg-primary hover:bg-primary/90"
            )}
          >
            {isSubmitting && <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white animate-spin rounded-full" />}
            {confirmText}
          </Button>
        </FlowPopupFooter>
      </div>
    </FlowDialog>
  );
}
