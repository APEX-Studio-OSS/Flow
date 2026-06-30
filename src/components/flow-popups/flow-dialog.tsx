'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { OverlayStackManager } from '@/components/ui/overlay-stack-manager';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { RegisteredOverlaySession } from '@/components/providers/overlay-provider';

interface FlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  onOpenAutoFocus?: (e: Event) => void;
  onExitComplete?: () => void;
  closeDisabled?: boolean;
  id?: string;
  ownerId?: string;
}

export function FlowDialog({ 
  open, 
  onOpenChange, 
  children, 
  className, 
  onOpenAutoFocus,
  onExitComplete,
  closeDisabled = false,
  id,
  ownerId,
}: FlowDialogProps) {
  const stableId = React.useId();
  const componentInstanceId = React.useMemo(() => stableId.replace(/:/g, ''), [stableId]);
  const [dialogId] = React.useState(() => id || `dialog-${Math.random().toString(36).substring(2, 9)}`);
  const shouldReduceMotion = useReducedMotion();

  const generationRef = React.useRef(0);
  const lastOpenRef = React.useRef(false);
  const sessionIdRef = React.useRef('');

  if (open && !lastOpenRef.current) {
    generationRef.current++;
    sessionIdRef.current = `${componentInstanceId}-${generationRef.current}`;
  }
  const prevOpen = lastOpenRef.current;
  lastOpenRef.current = open;
  const sessionId = sessionIdRef.current;

  const requestClose = React.useCallback(() => {
    if (closeDisabled || !open) return;
    onOpenChange(false);
  }, [open, onOpenChange, closeDisabled]);

  const handleClose = React.useCallback(() => {
    requestClose();
  }, [requestClose]);

  const handleOpenChange = React.useCallback((isOpen: boolean) => {
    if (!isOpen) {
      requestClose();
    } else {
      onOpenChange(true);
    }
  }, [requestClose, onOpenChange]);

  const backdropDuration = shouldReduceMotion ? 0.08 : 0.18;
  const backdropExitDuration = shouldReduceMotion ? 0.08 : 0.14;
  const backdropEase = shouldReduceMotion ? 'linear' : [0.22, 1, 0.36, 1];
  const backdropExitEase = shouldReduceMotion ? 'linear' : [0.4, 0, 1, 1];

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: backdropDuration, ease: backdropEase }
    },
    exit: { 
      opacity: 0,
      transition: { duration: backdropExitDuration, ease: backdropExitEase }
    }
  };

  const dialogDuration = shouldReduceMotion ? 0.08 : 0.24;
  const dialogExitDuration = shouldReduceMotion ? 0.08 : 0.17;
  const dialogEase = shouldReduceMotion ? 'linear' : [0.22, 1, 0.36, 1];
  const dialogExitEase = shouldReduceMotion ? 'linear' : [0.4, 0, 1, 1];

  const contentVariants = {
    hidden: shouldReduceMotion 
      ? { opacity: 0 } 
      : { opacity: 0, scale: 0.985, y: 18 },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        duration: dialogDuration,
        ease: dialogEase
      }
    },
    exit: shouldReduceMotion
      ? { opacity: 0 }
      : { 
          opacity: 0, 
          scale: 0.99,
          y: 12,
          transition: { duration: dialogExitDuration, ease: dialogExitEase }
        }
  };

  const handleExitComplete = () => {
    onExitComplete?.();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal forceMount>
        <AnimatePresence initial={false} onExitComplete={handleExitComplete}>
          {open && (
            <RegisteredOverlaySession
              key={sessionId}
              overlayId={dialogId}
              instanceId={sessionId}
              ownerId={ownerId}
            >
              {/* Backdrop overlay */}
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  variants={backdropVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="fixed inset-0 z-[50] bg-transparent pointer-events-auto"
                />
              </DialogPrimitive.Overlay>
              
              {/* Centered dialog content wrapper */}
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
                <DialogPrimitive.Content
                  asChild
                  forceMount
                  onOpenAutoFocus={onOpenAutoFocus}
                >
                  <motion.div
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={cn(
                      "w-full max-w-[400px] gap-4 border border-border bg-card p-6 shadow-2xl rounded-[28px] focus:outline-none max-h-[85dvh] overflow-y-auto flex flex-col pointer-events-auto",
                      className
                    )}
                  >
                    <DialogPrimitive.Title className="sr-only">Dialog</DialogPrimitive.Title>
                    <OverlayStackManager id={dialogId} close={handleClose} priority={1} />
                    {children}
                  </motion.div>
                </DialogPrimitive.Content>
              </div>
            </RegisteredOverlaySession>
          )}
        </AnimatePresence>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
