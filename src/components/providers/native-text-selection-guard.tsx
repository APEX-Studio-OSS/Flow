'use client';

import { useEffect } from 'react';

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) return false;

  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [data-allow-text-selection="true"]'
    )
  );
};

export function NativeTextSelectionGuard() {
  useEffect(() => {
    const handleSelectStart = (e: Event) => {
      if (!isEditableTarget(e.target)) {
        e.preventDefault();
        try {
          window.getSelection()?.removeAllRanges();
        } catch (err) {
          // ignore selection clearing errors
        }
      }
    };

    const handleContextMenu = (e: Event) => {
      if (!isEditableTarget(e.target)) {
        e.preventDefault();
        try {
          window.getSelection()?.removeAllRanges();
        } catch (err) {
          // ignore selection clearing errors
        }
      }
    };

    document.addEventListener('selectstart', handleSelectStart, { capture: true });
    document.addEventListener('contextmenu', handleContextMenu, { capture: true });

    return () => {
      document.removeEventListener('selectstart', handleSelectStart, { capture: true });
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
    };
  }, []);

  return null;
}
