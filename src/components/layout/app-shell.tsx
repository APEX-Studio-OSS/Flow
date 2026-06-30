'use client';

import { useEffect } from 'react';
import { useApp } from '@/components/providers/app-provider';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { OverlayStack } from '@/lib/overlay-stack';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';

import { SafeErrorBoundary } from '@/components/ui/error-boundary';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isFirstTime } = useApp();
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkOverlays = () => {
      const hasOverlayInStack = OverlayStack.hasModalOverlay();
      const hasOverlayInDOM = !!document.querySelector('[role="dialog"], [role="alertdialog"]');
      if (hasOverlayInStack || hasOverlayInDOM) {
        document.body.classList.add('overlay-active');
      } else {
        document.body.classList.remove('overlay-active');
        // Delayed check to guarantee Radix UI cleanups have completed
        setTimeout(() => {
          const hasOverlayStill = OverlayStack.hasModalOverlay() || !!document.querySelector('[role="dialog"], [role="alertdialog"]');
          if (!hasOverlayStill) {
            document.body.style.pointerEvents = '';
            document.body.style.overflow = '';
          }
        }, 0);
      }
    };

    checkOverlays();

    const unsubscribe = OverlayStack.subscribe(() => {
      checkOverlays();
    });

    const observer = new MutationObserver(() => {
      checkOverlays();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['role', 'open'],
    });

    return () => {
      unsubscribe();
      observer.disconnect();
      document.body.classList.remove('overlay-active');
    };
  }, []);

  return (
    <div className="app-shell">
      <div aria-hidden="true" className="native-status-bar-backdrop" />
      <Header />
      <main className={cn("app-main-scroll", isFirstTime && "app-main-onboarding" )}>
        <motion.div
          key={pathname}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="w-full flex-grow flex flex-col min-h-full"
        >
          <SafeErrorBoundary>
            {children}
          </SafeErrorBoundary>
        </motion.div>
      </main>
      <div aria-hidden="true" className="native-navigation-bar-backdrop" />
    </div>
  );
}

