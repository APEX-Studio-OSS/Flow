'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface TouchSafePreferenceDropdownProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  triggerContent: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  buttonWidth?: string;
  children: React.ReactNode;
  variant?: 'outline' | 'unboxed';
}

export function TouchSafePreferenceDropdown({
  title,
  description,
  icon,
  triggerContent,
  isOpen,
  onOpenChange,
  buttonWidth = 'w-[120px]',
  children,
  variant = 'outline'
}: TouchSafePreferenceDropdownProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;
  const shouldReduceMotion = useReducedMotion();

  const dropdownRootRef = React.useRef<HTMLDivElement>(null);

  // Outside click/touch handling using pointerup and click
  React.useEffect(() => {
    if (!open) return;

    const handleOutsideEvent = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target || !target.ownerDocument?.contains(target)) {
        return;
      }
      
      const path = e.composedPath?.() ?? [];
      const root = dropdownRootRef.current;
      
      if (root && (root.contains(target) || path.includes(root))) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener('pointerup', handleOutsideEvent);
    document.addEventListener('click', handleOutsideEvent);

    return () => {
      document.removeEventListener('pointerup', handleOutsideEvent);
      document.removeEventListener('click', handleOutsideEvent);
    };
  }, [open, setOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!open);
  };

  return (
    <div ref={dropdownRootRef} className="flex flex-col select-none">
      {/* Clickable Preference Row */}
      <div 
        onClick={handleToggle}
        className={cn(
          "flex items-center justify-between p-4 cursor-pointer select-none transition-[background-color,transform,opacity] duration-150 ease-out active:scale-[0.99] active:opacity-95",
          variant === 'unboxed' 
            ? cn("rounded-xl hover:bg-muted/15 focus-within:bg-muted/15", open && "bg-muted/10")
            : "rounded-2xl hover:bg-muted/40"
        )}
      >
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground flex-shrink-0">
            {icon}
          </span>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground leading-normal mt-0.5">
              {description}
            </p>
          </div>
        </div>

        {/* Trigger Content / Button */}
        {variant === 'unboxed' ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium pr-1 select-none flex-shrink-0">
            {triggerContent}
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground/80 flex-shrink-0 transition-transform duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]", open && "rotate-180")} />
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={handleToggle}
            className={cn(
              buttonWidth,
              "justify-between h-12 rounded-xl border-input focus:ring-2 focus:ring-primary active:scale-95 gap-1",
              open && "ring-2 ring-primary border-primary"
            )}
          >
            {triggerContent}
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]", open && "rotate-180")} />
          </Button>
        )}
      </div>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0, marginTop: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { height: 'auto', opacity: 1, marginTop: 4 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "overflow-hidden p-2.5 mx-2 mb-2 rounded-2xl animate-none",
              variant === 'unboxed' ? "bg-muted/10 border-0" : "bg-muted/20 border border-border/40"
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
