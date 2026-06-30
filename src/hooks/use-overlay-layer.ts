'use client';

import * as React from 'react';
import { useOverlay } from '@/components/providers/overlay-provider';

export function useOverlayLayer(id: string, isOpen: boolean) {
  const { registerOverlay, unregisterOverlay } = useOverlay();
  const stableId = React.useId().replace(/:/g, '');
  const instanceId = React.useMemo(() => `global:${stableId}`, [stableId]);

  // Register when the overlay becomes open
  React.useEffect(() => {
    if (isOpen) {
      registerOverlay(id, instanceId);
    }
  }, [id, isOpen, instanceId, registerOverlay]);

  // Unregister during normal unmount to prevent state leaks
  React.useEffect(() => {
    return () => {
      unregisterOverlay(id, instanceId);
    };
  }, [id, instanceId, unregisterOverlay]);
}
