'use client';

import { useRouter, usePathname } from 'next/navigation';
import { OverlayStack } from '@/lib/overlay-stack';
import { useRef, useEffect } from 'react';
import { ROUTES, isMainRoute } from '@/constants/routes';
import { useApp } from '@/components/providers/app-provider';

let lastPressTimeGlobal = 0;

export function useAppBack() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentStep, prevStep } = useApp();

  const routerRef = useRef(router);
  const pathnameRef = useRef(pathname);
  const currentStepRef = useRef(currentStep);
  const prevStepRef = useRef(prevStep);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    currentStepRef.current = currentStep;
    prevStepRef.current = prevStep;
  }, [currentStep, prevStep]);

  const handleAppBack = async () => {
    const currentPath = pathnameRef.current || '/';
    const cleanPath = currentPath.split('?')[0].replace(/\/$/, '') || '/';
    const isTargetPage = cleanPath === '/settings' || cleanPath === '/account' || cleanPath === '/budgets';

    if (isTargetPage && process.env.NODE_ENV === 'development') {
      const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
      const focusedDesc = activeEl ? `${activeEl.tagName.toLowerCase()}${activeEl.id ? '#' + activeEl.id : ''}` : 'none';
      const isInputFocused = !!(
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.hasAttribute('contenteditable'))
      );
      const stackInfo = OverlayStack.getStackInfo();
      console.log(`[DEBUG BACK] [Start] pathname=${cleanPath}, historyLength=${typeof window !== 'undefined' ? window.history.length : 0}, keyboardFocused=${isInputFocused}, focusedElement=${focusedDesc}, overlayCount=${stackInfo.count}, overlayEntries=${JSON.stringify(stackInfo.entries)}`);
    }

    // 1. Controlled Overlay Stack Close
    if (OverlayStack.hasOverlays()) {
      const topOverlayId = OverlayStack.getStackInfo().top;
      if (OverlayStack.closeTop()) {
        if (isTargetPage && process.env.NODE_ENV === 'development') {
          console.log(`[DEBUG BACK] [Action] pathname=${cleanPath}, overlayCount=${OverlayStack.getOverlayCount() + 1}, action=closeOverlay(${topOverlayId}), reason=overlay_stack_not_empty`);
        } else if (process.env.NODE_ENV === 'development') {
          console.log('[App Back] Closed top controlled overlay from OverlayStack');
        }
        return;
      }
    }

    // 2. Hard override for target pages when no overlay is open
    if (isTargetPage) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEBUG BACK] [Action] pathname=${cleanPath}, overlayCount=0, action=router.replace('/dashboard'), reason=hard_override`);
      }
      routerRef.current.replace(ROUTES.dashboard);
      return;
    }

    // 3. Settings About page
    if (cleanPath === ROUTES.about) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[App Back] ${cleanPath} page back navigation -> settings`);
      }
      routerRef.current.replace(ROUTES.settings);
      return;
    }

    // 4. Main routes check
    if (isMainRoute(cleanPath) && cleanPath !== ROUTES.dashboard) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[App Back] Main route ${cleanPath} back navigation -> dashboard`);
      }
      routerRef.current.replace(ROUTES.dashboard);
      return;
    }

    // 5. Onboarding / Welcome page back navigation
    if (cleanPath === '/welcome') {
      if (currentStepRef.current !== 'welcome') {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[App Back] Welcome page back navigation: ${currentStepRef.current} -> previous step`);
        }
        prevStepRef.current();
        return;
      }

      // First step back to exit application directly
      if (process.env.NODE_ENV === 'development') {
        console.log('[App Back] Exiting application from welcome step');
      }
      const { App } = await import('@capacitor/app');
      App.exitApp();
      return;
    }

    // 6. Dashboard back check - Exit application directly
    if (cleanPath === ROUTES.dashboard || cleanPath === '' || cleanPath === '/') {
      if (process.env.NODE_ENV === 'development') {
        console.log('[App Back] Exiting application from dashboard');
      }
      const { App } = await import('@capacitor/app');
      App.exitApp();
      return;
    }

    // 7. Otherwise safely route to dashboard
    if (process.env.NODE_ENV === 'development') {
      console.log(`[App Back] Fallback route ${cleanPath} back navigation -> dashboard`);
    }
    routerRef.current.replace(ROUTES.dashboard);
  };

  return handleAppBack;
}
