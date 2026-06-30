import { useEffect } from 'react';

const activeLocks = new Set<string>();
let originalOverflow = '';

if (typeof window !== 'undefined') {
  (window as any).__activeScrollLocks = activeLocks;
}

export function useBodyScrollLock(open: boolean, id: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (open) {
      if (activeLocks.size === 0) {
        originalOverflow = document.body.style.overflow || '';
        document.body.style.overflow = 'hidden';
      }
      activeLocks.add(id);
    } else {
      if (activeLocks.has(id)) {
        activeLocks.delete(id);
        if (activeLocks.size === 0) {
          document.body.style.overflow = originalOverflow;
        }
      }
    }

    return () => {
      if (activeLocks.has(id)) {
        activeLocks.delete(id);
        if (activeLocks.size === 0) {
          document.body.style.overflow = originalOverflow;
        }
      }
    };
  }, [open, id]);
}

export function clearAllBodyScrollLocks() {
  activeLocks.clear();
  if (typeof document !== 'undefined') {
    document.body.style.overflow = originalOverflow || '';
  }
}

