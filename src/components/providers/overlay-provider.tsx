'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useApp } from './app-provider';
import { useTheme } from './theme-provider';
import { applyNativeSystemBars } from '@/services/native-system-bars';
import { Capacitor, registerPlugin } from '@capacitor/core';

const SystemBarScrim = registerPlugin<any>('SystemBarScrim');

export type OverlayInstance = {
  overlayId: string;
  instanceId: string;
  ownerId?: string;
};

interface OverlayContextType {
  activeOverlayIds: Set<string>;
  registerOverlay: (overlayId: string, instanceId: string, ownerId?: string) => void;
  unregisterOverlay: (overlayId: string, instanceId: string) => void;
  unregisterOverlayOwner: (ownerId: string) => void;
  hasActiveOverlay: boolean;
}

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

export function OverlayProvider({ children }: { children: React.ReactNode }) {
  // Manage active overlay IDs with a map of sets of structured OverlayInstance records to deduplicate
  const [activeOverlayInstances, setActiveOverlayInstances] = useState<Map<string, Set<OverlayInstance>>>(new Map());
  const { colorThemeName } = useApp();
  const { resolvedTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  // Deduplicate active overlay IDs
  const activeOverlayIds = useMemo(() => {
    const ids = new Set<string>();
    activeOverlayInstances.forEach((instances, id) => {
      if (instances.size > 0) {
        ids.add(id);
      }
    });
    return ids;
  }, [activeOverlayInstances]);

  // Derive hasActiveOverlay and transitions from the total count of instances across all sets
  const totalInstancesCount = useMemo(() => {
    let count = 0;
    activeOverlayInstances.forEach((instances) => {
      count += instances.size;
    });
    return count;
  }, [activeOverlayInstances]);

  const hasActiveOverlay = totalInstancesCount > 0;

  // Idempotent registration functions
  const registerOverlay = useCallback((overlayId: string, instanceId: string, ownerId?: string) => {
    setActiveOverlayInstances((prev) => {
      const next = new Map(prev);
      const instances = next.get(overlayId) ? new Set(next.get(overlayId)) : new Set<OverlayInstance>();
      
      // Check if instance already exists to be idempotent
      let exists = false;
      instances.forEach((inst) => {
        if (inst.instanceId === instanceId) {
          exists = true;
        }
      });

      if (!exists) {
        instances.add({ overlayId, instanceId, ownerId });
        next.set(overlayId, instances);
        return next;
      }
      return prev;
    });
  }, []);

  const unregisterOverlay = useCallback((overlayId: string, instanceId: string) => {
    setActiveOverlayInstances((prev) => {
      const next = new Map(prev);
      const instances = next.get(overlayId);
      if (instances) {
        const updated = new Set(instances);
        let targetInst: OverlayInstance | null = null;
        updated.forEach((inst) => {
          if (inst.instanceId === instanceId) {
            targetInst = inst;
          }
        });
        if (targetInst) {
          updated.delete(targetInst);
          if (updated.size === 0) {
            next.delete(overlayId);
          } else {
            next.set(overlayId, updated);
          }
          return next;
        }
      }
      return prev;
    });
  }, []);

  // Unregister all overlays belonging to a specific ownerId exactly
  const unregisterOverlayOwner = useCallback((ownerId: string) => {
    setActiveOverlayInstances((prev) => {
      const next = new Map(prev);
      let changed = false;
      next.forEach((instances, overlayId) => {
        const updated = new Set(instances);
        updated.forEach((inst) => {
          if (inst.ownerId === ownerId) {
            updated.delete(inst);
            changed = true;
          }
        });
        if (updated.size === 0) {
          next.delete(overlayId);
        } else {
          next.set(overlayId, updated);
        }
      });
      return changed ? next : prev;
    });
  }, []);

  // 13. Development-only diagnostics check to warn if active overlays leak
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    if (activeOverlayIds.size === 0) return;

    const checkLeaks = () => {
      const openDialogs = document.querySelectorAll('[data-state="open"]');
      const closingDialogs = document.querySelectorAll('[data-state="closed"]');
      
      if (openDialogs.length === 0 && closingDialogs.length === 0) {
        console.warn(
          `[OVERLAY_DIAGNOSTIC] Warning: ${activeOverlayIds.size} overlays registered (${Array.from(activeOverlayIds).join(', ')}), but no active overlay elements found in the DOM.`
        );
      }
    };

    const timer = setTimeout(checkLeaks, 2000);
    return () => clearTimeout(timer);
  }, [activeOverlayIds]);

  // Track transitions of total instances for dimming and system bars
  const lastDimmedRef = React.useRef(false);
  const lastThemeRef = React.useRef<{ theme: string; color: string } | null>(null);

  useEffect(() => {
    const isCurrentlyDimmed = totalInstancesCount > 0;
    const wasDimmed = lastDimmedRef.current;
    
    const themeChanged = 
      !lastThemeRef.current || 
      lastThemeRef.current.theme !== resolvedTheme || 
      lastThemeRef.current.color !== colorThemeName;

    // Transition 0 -> 1: enable dimming
    const isTransitionToDimmed = !wasDimmed && isCurrentlyDimmed;
    // Transition 1 -> 0: disable dimming
    const isTransitionToNormal = wasDimmed && !isCurrentlyDimmed;

    if (isTransitionToDimmed || (isCurrentlyDimmed && themeChanged)) {
      applyNativeSystemBars(resolvedTheme, colorThemeName, { isDimmed: true });
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        SystemBarScrim.show({
          isDark: resolvedTheme === 'dark',
          statusBarColor: resolvedTheme === 'dark' ? '#121212' : '#FAFAFA',
          navigationBarColor: resolvedTheme === 'dark' ? '#121212' : '#FAFAFA',
        }).catch((err: any) => {
          console.error('SystemBarScrim.show failed:', err);
        });
      }
    } else if (isTransitionToNormal || (!isCurrentlyDimmed && themeChanged)) {
      applyNativeSystemBars(resolvedTheme, colorThemeName, { isDimmed: false });
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        SystemBarScrim.hide({
          statusBarColor: resolvedTheme === 'dark' ? '#121212' : '#FAFAFA',
          navigationBarColor: resolvedTheme === 'dark' ? '#121212' : '#FAFAFA',
          statusBarIconsDark: resolvedTheme !== 'dark',
          navigationBarIconsDark: resolvedTheme !== 'dark',
        }).catch((err: any) => {
          console.error('SystemBarScrim.hide failed:', err);
        });
      }
    }

    lastDimmedRef.current = isCurrentlyDimmed;
    lastThemeRef.current = { theme: resolvedTheme, color: colorThemeName };
  }, [totalInstancesCount, resolvedTheme, colorThemeName]);

  // Reapply system bars dimming on device orientation changes or layout resize events
  useEffect(() => {
    const handleResizeOrRotation = () => {
      applyNativeSystemBars(resolvedTheme, colorThemeName, { isDimmed: totalInstancesCount > 0 });
    };
    window.addEventListener('resize', handleResizeOrRotation);
    window.addEventListener('orientationchange', handleResizeOrRotation);
    return () => {
      window.removeEventListener('resize', handleResizeOrRotation);
      window.removeEventListener('orientationchange', handleResizeOrRotation);
    };
  }, [totalInstancesCount, resolvedTheme, colorThemeName]);

  const contextValue = useMemo(() => ({
    activeOverlayIds,
    registerOverlay,
    unregisterOverlay,
    unregisterOverlayOwner,
    hasActiveOverlay,
  }), [activeOverlayIds, registerOverlay, unregisterOverlay, unregisterOverlayOwner, hasActiveOverlay]);

  // Client-only portal setup
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Set transition durations as specified in Phase 3
  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: hasActiveOverlay ? 0.18 : 0.16, ease: 'linear' };

  return (
    <OverlayContext.Provider value={contextValue}>
      {children}
      {mounted && createPortal(
        <AnimatePresence>
          {hasActiveOverlay && (
            <motion.div
              key="global-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
              className="fixed inset-0 z-[49] w-[100dvw] h-[100dvh] pointer-events-auto bg-[var(--flow-modal-scrim)]"
              style={{ mixBlendMode: 'normal' }}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </OverlayContext.Provider>
  );
}

export function useOverlay() {
  const context = useContext(OverlayContext);
  if (context === undefined) {
    throw new Error('useOverlay must be used within an OverlayProvider');
  }
  return context;
}

export function RegisteredOverlaySession({
  overlayId,
  instanceId,
  ownerId,
  children,
}: {
  overlayId: string;
  instanceId: string;
  ownerId?: string;
  children: React.ReactNode;
}) {
  const { registerOverlay, unregisterOverlay } = useOverlay();

  useEffect(() => {
    registerOverlay(overlayId, instanceId, ownerId);
    return () => {
      unregisterOverlay(overlayId, instanceId);
    };
  }, [overlayId, instanceId, ownerId, registerOverlay, unregisterOverlay]);

  return <>{children}</>;
}
