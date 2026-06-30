'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence, useReducedMotion, usePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { OverlayStackManager } from '@/components/ui/overlay-stack-manager';
import { ChevronLeft } from 'lucide-react';
import { RegisteredOverlaySession } from '@/components/providers/overlay-provider';

interface FlowFloatingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  onOpenAutoFocus?: (e: Event) => void;
  onCloseAutoFocus?: (e: Event) => void;
  variant?: 'main' | 'submenu';
  title?: string;
  description?: string;
  onBack?: () => void;
  onPointerDownOutside?: (e: Event) => void;
  onInteractOutside?: (e: Event) => void;
  dragToDismiss?: boolean;
  priority?: number;
  style?: React.CSSProperties;
  id?: string;
  ownerId?: string;
  onExitComplete?: () => void;
}

export function FlowFloatingSheet({
  open,
  onOpenChange,
  children,
  className,
  onOpenAutoFocus,
  onCloseAutoFocus,
  variant = 'main',
  title,
  description,
  onBack,
  onPointerDownOutside,
  onInteractOutside,
  dragToDismiss = true,
  priority,
  style,
  id,
  ownerId,
  onExitComplete,
}: FlowFloatingSheetProps) {
  const stableId = React.useId();
  const componentInstanceId = React.useMemo(() => stableId.replace(/:/g, ''), [stableId]);
  const [sheetId] = React.useState(() => id || `floating-sheet-${Math.random().toString(36).substring(2, 9)}`);
  const shouldReduceMotion = useReducedMotion();
  const [, safeToRemove] = usePresence();

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
      
      const isHandle = !!target.closest('.drag-handle');
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
    if (!isOpen) {
      requestClose('radix-on-open-change');
    } else {
      onOpenChange(true);
    }
  }, [requestClose, onOpenChange]);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.15, ease: 'easeIn' }
    }
  };

  const contentVariants = variant === 'submenu'
    ? {
        hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 },
        visible: {
          opacity: 1,
          y: dragOffset,
          scale: 1,
          transition: isDragging
            ? { duration: 0 }
            : (shouldReduceMotion ? { duration: 0.1 } : { duration: 0.18, ease: [0.215, 0.61, 0.355, 1] })
        },
        exit: shouldReduceMotion
          ? { opacity: 0, transition: { duration: 0.12 } }
          : {
              opacity: 0,
              y: '100%',
              scale: 0.97,
              transition: { duration: 0.14, ease: [0.4, 0, 1, 1] }
            }
      }
    : {
        hidden: shouldReduceMotion 
          ? { opacity: 0 } 
          : { y: '100%', opacity: 1, scale: 1 },
        visible: { 
          opacity: 1, 
          y: dragOffset, 
          scale: 1,
          transition: isDragging
            ? { duration: 0 }
            : (shouldReduceMotion
                ? { duration: 0.1 }
                : { type: 'spring', damping: 28, stiffness: 320, mass: 0.8 })
        },
        exit: shouldReduceMotion
          ? { opacity: 0, transition: { duration: 0.12 } }
          : { 
              y: '100%', 
              transition: { duration: 0.24, ease: [0.4, 0, 1, 1] }
            }
      };

  const handleExitComplete = () => {
    safeToRemove?.();
    onExitComplete?.();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} modal={false}>
      <DialogPrimitive.Portal forceMount>
        <AnimatePresence initial={false} onExitComplete={handleExitComplete}>
          {open && (
            <RegisteredOverlaySession
              key={sessionId}
              overlayId={sheetId}
              instanceId={sessionId}
              ownerId={ownerId}
            >
              <DialogPrimitive.Overlay asChild forceMount key="sheet-overlay">
                <motion.div
                  variants={backdropVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={cn(
                    "fixed inset-0 bg-transparent",
                    variant === 'submenu' ? "z-[65]" : "z-[50]"
                  )}
                />
              </DialogPrimitive.Overlay>

              <DialogPrimitive.Content 
                asChild 
                forceMount
                key="sheet-content"
                onOpenAutoFocus={onOpenAutoFocus}
                onCloseAutoFocus={onCloseAutoFocus}
                onPointerDownOutside={onPointerDownOutside}
                onInteractOutside={onInteractOutside}
              >
                <motion.div 
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={cn(
                    "fixed inset-x-0 z-[60] flex justify-center focus:outline-none pointer-events-none",
                    variant === 'submenu'
                      ? "bottom-[max(24px,calc(env(safe-area-inset-bottom)+20px))] px-6 z-[70]"
                      : "bottom-[max(16px,calc(env(safe-area-inset-bottom)+12px))] px-4"
                  )}
                >
                  <div
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    style={style}
                    className={cn(
                      "flex flex-col pointer-events-auto focus:outline-none overflow-hidden select-none",
                      variant === 'submenu'
                        ? "w-[calc(100vw-48px)] max-w-[400px] rounded-[24px] bg-card border border-border/80 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.35)] max-h-[75dvh] gap-3"
                        : "w-[calc(100vw-32px)] max-w-md rounded-[28px] bg-card border border-border p-4 px-5 pb-5 shadow-2xl max-h-[80dvh] gap-3",
                      className
                    )}
                  >
                    <DialogPrimitive.Title className="sr-only">Floating Sheet</DialogPrimitive.Title>
                    {/* Subtle Top drag handle indicator */}
                    <div 
                      style={{ touchAction: 'none' }}
                      className={cn(
                        "drag-handle rounded-full mx-auto flex-shrink-0 cursor-grab active:cursor-grabbing select-none opacity-80",
                        variant === 'submenu' ? "w-8 h-1 bg-muted/60 mb-0.5" : "w-12 h-1.5 bg-muted mb-1"
                      )}
                    />

                    {variant === 'submenu' && (title || onBack) && (
                      <div className="popup-drag-region popup-header flex flex-col gap-1 flex-shrink-0 select-none pb-2 border-b border-border/10">
                        <div className="flex items-center gap-2 min-w-0">
                          {onBack && (
                            <button
                              type="button"
                              onClick={onBack}
                              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted/50 active:scale-95 transition-all text-muted-foreground hover:text-foreground focus:outline-none"
                              aria-label="Go back"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                          )}
                          {title && (
                            <h3 className="text-sm font-extrabold text-foreground truncate">{title}</h3>
                          )}
                        </div>
                        {description && (
                          <p className="text-[10px] text-muted-foreground/85 leading-normal pl-0.5 font-medium">{description}</p>
                        )}
                      </div>
                    )}

                    {children}
                  </div>
                </motion.div>
              </DialogPrimitive.Content>
            </RegisteredOverlaySession>
          )}
        </AnimatePresence>

        {open && (
          <OverlayStackManager id={sheetId} close={handleClose} priority={priority !== undefined ? priority : (variant === 'submenu' ? 3 : 2)} />
        )}
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
