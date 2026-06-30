'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { OverlayStackManager } from '@/components/ui/overlay-stack-manager';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { RegisteredOverlaySession } from '@/components/providers/overlay-provider';

interface FlowSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  dragToDismiss?: boolean;
  floating?: boolean;
  id?: string;
  ownerId?: string;
  style?: React.CSSProperties;
  onPointerDownOutside?: (e: Event) => void;
  onInteractOutside?: (e: Event) => void;
  onEscapeKeyDown?: (e: Event) => void;
  onExitComplete?: () => void;
  onOpenAutoFocus?: (e: Event) => void;
  onCloseAutoFocus?: (e: Event) => void;
}

export function FlowSheet({
  open,
  onOpenChange,
  children,
  className,
  dragToDismiss = true,
  floating = false,
  id,
  ownerId,
  style,
  onPointerDownOutside,
  onInteractOutside,
  onEscapeKeyDown,
  onExitComplete,
  onOpenAutoFocus,
  onCloseAutoFocus,
}: FlowSheetProps) {
  const stableId = React.useId();
  const componentInstanceId = React.useMemo(() => stableId.replace(/:/g, ''), [stableId]);
  const [sheetId] = React.useState(() => id || `sheet-${Math.random().toString(36).substring(2, 9)}`);
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

  // Gesture dragging state
  const [dragOffset, setDragOffset] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartY = React.useRef(0);
  const dragStartX = React.useRef(0);
  const lastPointerY = React.useRef(0);
  const lastPointerTime = React.useRef(0);
  const dragVelocityY = React.useRef(0);
  const hasStartedDragAttempt = React.useRef(false);
  const ignoreDrag = React.useRef(false);

  const requestClose = React.useCallback((reason: string) => {
    if (!open) return;
    if (reason === 'drag') {
      setDragOffset(600);
      setIsDragging(false);
    }
    onOpenChange(false);
  }, [open, onOpenChange]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (dragToDismiss === false) return;
    const target = e.target as HTMLElement;

    if (target.closest('button, input, select, textarea, a, [role="button"], [role="tab"], .reactEasyCrop_Container, .no-drag')) {
      return;
    }

    dragStartY.current = e.clientY;
    dragStartX.current = e.clientX;
    lastPointerY.current = e.clientY;
    lastPointerTime.current = performance.now();
    dragVelocityY.current = 0;
    hasStartedDragAttempt.current = true;
    ignoreDrag.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!hasStartedDragAttempt.current || ignoreDrag.current) return;

    const deltaY = e.clientY - dragStartY.current;
    const deltaX = e.clientX - dragStartX.current;
    const now = performance.now();
    const dt = now - lastPointerTime.current;
    const dy = e.clientY - lastPointerY.current;

    if (dt > 0) {
      const instantVelocity = (dy / dt) * 1000;
      dragVelocityY.current = dragVelocityY.current * 0.4 + instantVelocity * 0.6;
    }
    lastPointerY.current = e.clientY;
    lastPointerTime.current = now;

    if (isDragging) {
      if (deltaY > 0) {
        setDragOffset(deltaY);
      } else {
        setDragOffset(0);
      }
      return;
    }

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      ignoreDrag.current = true;
      return;
    }

    if (deltaY > 8) {
      const target = e.target as HTMLElement;
      
      const isHandle = !!target.closest('.drag-handle') || target.classList.contains('drag-handle');
      const isHeader = !!target.closest('.popup-drag-region, .popup-header');
      const scrollContainer = target.closest('.scrollable-area, [data-radix-scroll-area-viewport]') as HTMLElement;
      const isAtTop = !scrollContainer || scrollContainer.scrollTop <= 0;

      if (isHandle || isHeader || isAtTop) {
        setIsDragging(true);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch (err) {}
      } else {
        ignoreDrag.current = true;
      }
    } else if (deltaY < -8) {
      ignoreDrag.current = true;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    hasStartedDragAttempt.current = false;
    ignoreDrag.current = false;

    if (!isDragging) return;
    
    e.stopPropagation();
    e.preventDefault();

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}

    setIsDragging(false);

    const DISTANCE_THRESHOLD = 100;
    const VELOCITY_THRESHOLD = 500;

    if (dragOffset > DISTANCE_THRESHOLD || dragVelocityY.current > VELOCITY_THRESHOLD) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      requestClose('drag');
    } else {
      setDragOffset(0);
    }
  };

  React.useEffect(() => {
    if (!open) {
      setDragOffset(0);
      setIsDragging(false);
      hasStartedDragAttempt.current = false;
      ignoreDrag.current = false;
    }
  }, [open]);

  const handleClose = React.useCallback(() => {
    requestClose('stack-manager');
  }, [requestClose]);

  const handleOpenChange = React.useCallback((isOpen: boolean) => {
    onOpenChange(isOpen);
  }, [onOpenChange]);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.14, ease: [0.4, 0, 1, 1] }
    }
  };

  const contentVariants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { y: '100%' },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0.1 }
        : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
    },
    exit: shouldReduceMotion
      ? { opacity: 0 }
      : { 
          y: '100%', 
          transition: { duration: 0.24, ease: [0.4, 0, 1, 1] }
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
              overlayId={sheetId}
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
                  className="fixed inset-0 z-[50] bg-transparent"
                />
              </DialogPrimitive.Overlay>
              
              {/* Bottom sheet content wrapper & panel */}
              <DialogPrimitive.Content
                asChild
                forceMount
                onPointerDownOutside={onPointerDownOutside}
                onInteractOutside={onInteractOutside}
                onEscapeKeyDown={onEscapeKeyDown}
                onOpenAutoFocus={onOpenAutoFocus}
                onCloseAutoFocus={onCloseAutoFocus}
              >
                <motion.div
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{
                    transform: (dragToDismiss && (isDragging || dragOffset > 0)) ? `translateY(${dragOffset}px)` : undefined,
                    transition: (dragToDismiss && isDragging) ? 'none' : 'transform 0.24s cubic-bezier(0.32, 0.94, 0.6, 1)',
                    bottom: floating ? 'calc(env(safe-area-inset-bottom, 0px) + 12px)' : '0px',
                  }}
                  className="fixed inset-x-0 z-[60] flex justify-center px-3 sm:px-4 focus:outline-none pointer-events-none"
                >
                  <div
                    onPointerDown={dragToDismiss ? handlePointerDown : undefined}
                    onPointerMove={dragToDismiss ? handlePointerMove : undefined}
                    onPointerUp={dragToDismiss ? handlePointerUp : undefined}
                    onPointerCancel={dragToDismiss ? handlePointerUp : undefined}
                    style={style}
                    className={cn(
                      "w-full max-w-md bg-card border border-border shadow-2xl flex flex-col pointer-events-auto focus:outline-none overflow-hidden",
                      floating
                        ? "rounded-[28px] p-5 gap-3"
                        : "rounded-t-[32px] p-6 pb-[calc(1.5rem+var(--safe-area-bottom))] border-t border-x gap-4 max-h-[85dvh] overflow-y-auto",
                      className
                    )}
                  >
                    <DialogPrimitive.Title className="sr-only">Sheet</DialogPrimitive.Title>
                    {/* Register with local back handler overlay stack */}
                    <OverlayStackManager id={sheetId} close={handleClose} priority={1} />
                    
                    {/* Top drag handle indicator */}
                    {dragToDismiss && (
                      <div 
                        style={{ touchAction: 'none' }}
                        className="drag-handle w-12 h-1.5 bg-muted rounded-full mx-auto mb-1 flex-shrink-0 select-none opacity-80" 
                      />
                    )}
                    
                    {children}
                  </div>
                </motion.div>
              </DialogPrimitive.Content>
            </RegisteredOverlaySession>
          )}
        </AnimatePresence>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
