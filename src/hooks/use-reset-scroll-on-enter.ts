'use client';

import { useEffect } from 'react';

/**
 * Reusable hook to reset scroll position to the top (0) on page entry.
 * It targets standard window/body scrolls as well as Flow's custom
 * app layout scroll container (`.app-main-scroll`).
 */
export function useResetScrollOnEnter() {
  useEffect(() => {
    const resetScroll = () => {
      // 1. Reset standard window and document scrolling elements
      window.scrollTo(0, 0);
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }

      // 2. Reset Flow's custom layout main scroll viewport
      const mainScroll = document.querySelector('.app-main-scroll');
      if (mainScroll) {
        mainScroll.scrollTop = 0;
      }
    };

    // Run immediately on client-side mounting
    resetScroll();

    // Defer by one animation frame to override browser layout/render timings
    const rafHandle = requestAnimationFrame(resetScroll);

    // Secondary backup execution to handle asynchronous page transitions or rendering delays
    const timeoutHandle = setTimeout(resetScroll, 0);

    return () => {
      cancelAnimationFrame(rafHandle);
      clearTimeout(timeoutHandle);
    };
  }, []);
}
