'use client';

import React from 'react';
import { OverlayStack } from '@/lib/overlay-stack';

export function OverlayStackManager({ id, close, priority = 1 }: { id: string; close: () => void; priority?: number }) {
  React.useEffect(() => {
    OverlayStack.register(id, close, priority);
    return () => {
      OverlayStack.unregister(id);
    };
  }, [id, close, priority]);
  return null;
}
