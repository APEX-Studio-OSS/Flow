/**
 * Flow Motion Presets
 * Standardized, native-feeling transitions using transform and opacity only.
 * Automatically handles prefers-reduced-motion configuration.
 */

export const fadeIn = (shouldReduceMotion: boolean = false) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' }
  }
});

export const slideUpFade = (shouldReduceMotion: boolean = false) => ({
  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' }
  }
});

export const scaleFade = (shouldReduceMotion: boolean = false) => ({
  hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: 'easeOut' }
  }
});

export const cardMotion = (shouldReduceMotion: boolean = false) => ({
  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' }
  }
});

export const dialogMotion = (shouldReduceMotion: boolean = false) => ({
  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16, scale: shouldReduceMotion ? 1 : 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    y: shouldReduceMotion ? 0 : 12,
    scale: shouldReduceMotion ? 1 : 0.98,
    transition: { duration: 0.15, ease: 'easeIn' }
  }
});

export const listItemMotion = (shouldReduceMotion: boolean = false) => ({
  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' }
  }
});

export const pillMotion = (shouldReduceMotion: boolean = false) => ({
  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.15, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    y: shouldReduceMotion ? 0 : -8,
    transition: { duration: 0.12, ease: 'easeIn' }
  }
});

export const chartMotionConfig = (shouldReduceMotion: boolean = false, isMotionReady: boolean = true) => ({
  isAnimationActive: !shouldReduceMotion && isMotionReady,
  animationDuration: 500,
  animationEasing: 'ease-out' as const
});

