'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { OverlayStack } from '@/lib/overlay-stack';
import { useAppBack } from '@/hooks/use-app-back';
import { clearAllBodyScrollLocks } from '@/hooks/use-body-scroll-lock';

export function AndroidNavigation() {
  const pathname = usePathname();
  const handleAppBack = useAppBack();

  // Stable reference to handleAppBack to prevent listener re-registration
  const handleAppBackRef = useRef(handleAppBack);

  useEffect(() => {
    handleAppBackRef.current = handleAppBack;
  }, [handleAppBack]);

  // Clear page-scoped overlays on route change to prevent stale overlays/scroll locks
  useEffect(() => {
    if (pathname) {
      OverlayStack.clearPageScoped(pathname);
      clearAllBodyScrollLocks();
    }
  }, [pathname]);

  useEffect(() => {
    let listener: any = null;
    let cancelled = false;
    let keyboardShowListener: any = null;
    let keyboardHideListener: any = null;
    let isKeyboardVisible = false;

    const setupListener = async () => {
      // Check that platform is native Android
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        const { App } = await import('@capacitor/app');
        const { Keyboard } = await import('@capacitor/keyboard');
        if (cancelled) return;

        keyboardShowListener = await Keyboard.addListener('keyboardWillShow', () => {
          isKeyboardVisible = true;
        });
        keyboardHideListener = await Keyboard.addListener('keyboardWillHide', () => {
          isKeyboardVisible = false;
        });

        listener = await App.addListener('backButton', async () => {
          // --- 1. Keyboard dismissal ---
          const activeEl = document.activeElement;
          if (
            isKeyboardVisible &&
            activeEl &&
            (activeEl.tagName === 'INPUT' ||
              activeEl.tagName === 'TEXTAREA' ||
              activeEl.hasAttribute('contenteditable'))
          ) {
            (activeEl as HTMLElement).blur();
            if (process.env.NODE_ENV === 'development') {
              console.log('[Android Back] Keyboard visible and input active, blurring input to dismiss keyboard');
            }
            return; // Keyboard dismiss consumes back press
          }

          // --- 2. Unified Back Controller ---
          handleAppBackRef.current();
        });

        if (cancelled && listener) {
          listener.remove();
        }
      }
    };

    setupListener();

    return () => {
      cancelled = true;
      if (listener) {
        listener.remove();
      }
      if (keyboardShowListener) {
        keyboardShowListener.remove();
      }
      if (keyboardHideListener) {
        keyboardHideListener.remove();
      }
    };
  }, []);

  return null;
}
