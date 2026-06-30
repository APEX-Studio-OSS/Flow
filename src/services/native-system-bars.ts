import { Capacitor, registerPlugin } from '@capacitor/core';
import { StatusBar, StatusBarStyle } from '@capacitor/status-bar';

// Register the custom local Android Navigation Bar plugin
const NavigationBar = registerPlugin<any>('NavigationBar');

export const colorThemes = [
  {
    name: 'Ocean',
    primary: { light: '220 70% 50%', dark: '220 70% 60%' },
    accent: { light: '180 60% 45%', dark: '180 60% 55%' },
  },
  {
    name: 'Violet',
    primary: { light: '256 34% 48%', dark: '256 34% 60%' },
    accent: { light: '328 76% 60%', dark: '328 76% 70%' },
  },
  {
    name: 'Orchid',
    primary: { light: '270 50% 55%', dark: '270 50% 65%' },
    accent: { light: '310 60% 60%', dark: '310 60% 70%' },
  },
  {
    name: 'Mint',
    primary: { light: '150 50% 45%', dark: '150 50% 55%' },
    accent: { light: '170 60% 50%', dark: '170 60% 60%' },
  },
  {
    name: 'Sky',
    primary: { light: '210 70% 55%', dark: '210 70% 65%' },
    accent: { light: '190 80% 60%', dark: '190 80% 70%' },
  },
  {
    name: 'Sunset',
    primary: { light: '25 80% 55%', dark: '25 80% 65%' },
    accent: { light: '280 50% 60%', dark: '280 50% 70%' },
  },
  {
    name: 'Forest',
    primary: { light: '120 40% 40%', dark: '120 40% 50%' },
    accent: { light: '90 45% 55%', dark: '90 45% 65%' },
  },
  {
    name: 'Ruby',
    primary: { light: '350 70% 50%', dark: '350 70% 60%' },
    accent: { light: '330 65% 55%', dark: '330 65% 65%' },
  },
];

/**
 * Converts CSS-style 8-digit hex colors (#RRGGBBAA) into Android-style #AARRGGBB
 * before passing them to the native Capacitor status bar plugin.
 */
function formatColorForCapacitorStatusBar(cssColor: string): string {
  if (cssColor.startsWith('#') && cssColor.length === 9) {
    const rrggbb = cssColor.substring(1, 7);
    const aa = cssColor.substring(7, 9);
    return `#${aa}${rrggbb}`;
  }
  return cssColor;
}

const DARK_SYSTEM_BAR_COLOR = '#121212';

// Centralized final color configurations for system bars
const SYSTEM_BAR_CONFIG = {
  light: {
    background: '#FAFAFA', // Exact app light background color (matches light HSL 0 0% 98%)
    /**
     * NOTE: In Capacitor's Status Bar plugin:
     * - StatusBarStyle.Light = Dark text/icons for light backgrounds
     * - StatusBarStyle.Dark = Light text/icons for dark backgrounds
     */
    statusBarStyle: StatusBarStyle.Light,
    navigationBarDarkIcons: true,
  },
  dark: {
    background: DARK_SYSTEM_BAR_COLOR, // Matches app dark background
    statusBarStyle: StatusBarStyle.Dark,
    navigationBarDarkIcons: false,
  },
};

const WELCOME_SYSTEM_BAR_CONFIG = {
  light: {
    background: '#FAFAFA',
    statusBarStyle: StatusBarStyle.Light,
    navigationBarDarkIcons: true,
  },
  dark: {
    background: DARK_SYSTEM_BAR_COLOR,
    statusBarStyle: StatusBarStyle.Dark,
    navigationBarDarkIcons: false,
  },
};

// Dimmed state tracking across system bar applications (e.g. app resume, theme change)
let isSystemDimmed = false;

// Keep track of the last set styles to prevent duplicate native IPC invocations
let lastStatusBarColor = '';
let lastStatusBarStyle: any = null;
let lastNavBarColor = '';
let lastNavBarDarkIcons = false;

// Global sequential update queue to serialize rapid Capacitor/native updates
let systemBarPromiseChain = Promise.resolve();
let currentUpdateId = 0;

function queueSystemBarUpdate(fn: () => Promise<void>): Promise<void> {
  systemBarPromiseChain = systemBarPromiseChain.then(async () => {
    try {
      await fn();
    } catch (e) {
      console.error('System bar update in queue failed:', e);
    }
  });
  return systemBarPromiseChain;
}

export async function reconcileSystemBars(
  resolvedTheme: 'light' | 'dark',
  colorThemeName: string,
  options?: { isWelcome?: boolean; isDimmed?: boolean }
) {
  currentUpdateId++;
  const updateId = currentUpdateId;

  if (options && typeof options.isDimmed === 'boolean') {
    isSystemDimmed = options.isDimmed;
  }
  const isDimmed = isSystemDimmed;

  return queueSystemBarUpdate(async () => {
    // If a new update was enqueued, discard this stale update instantly
    if (updateId !== currentUpdateId) {
      return;
    }

    const isWelcome = options?.isWelcome ?? false;
    const config = isWelcome ? WELCOME_SYSTEM_BAR_CONFIG[resolvedTheme] : SYSTEM_BAR_CONFIG[resolvedTheme];

    const currentBarBg = isDimmed
      ? (resolvedTheme === 'light' ? '#919191' : '#0a0a0a')
      : config.background;

    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--flow-system-bar-bg', currentBarBg);
    }

    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return;
    }

    try {
      // 2. Normal state (no overlay): Light mode has white bg and Light status style. Dark mode has dark bg and Dark status style.
      // 3. Overlay state: Apply dimmed bar color and choose icon style from dimmed color's luminance.
      const statusBarColor = isDimmed ? currentBarBg : '#00000000';
      const navBarColor = isDimmed ? currentBarBg : config.background;
      const statusBarStyle = isDimmed
        ? (resolvedTheme === 'light' ? StatusBarStyle.Light : StatusBarStyle.Dark)
        : config.statusBarStyle;
      const navBarDarkIcons = isDimmed
        ? (resolvedTheme === 'light' ? true : false)
        : config.navigationBarDarkIcons;

      const formattedStatusBarColor = formatColorForCapacitorStatusBar(statusBarColor);

      // Verify updateId token at each async call boundary
      if (updateId !== currentUpdateId) return;
      if (formattedStatusBarColor !== lastStatusBarColor) {
        await StatusBar.setBackgroundColor({ color: formattedStatusBarColor });
        if (updateId !== currentUpdateId) return;
        lastStatusBarColor = formattedStatusBarColor;
      }

      if (updateId !== currentUpdateId) return;
      if (statusBarStyle !== lastStatusBarStyle) {
        await StatusBar.setStyle({ style: statusBarStyle });
        if (updateId !== currentUpdateId) return;
        lastStatusBarStyle = statusBarStyle;
      }

      if (updateId !== currentUpdateId) return;
      if (navBarColor !== lastNavBarColor || navBarDarkIcons !== lastNavBarDarkIcons) {
        try {
          await NavigationBar.setNavigationBarColor({
            color: navBarColor,
            darkIcons: navBarDarkIcons,
          });
          if (updateId !== currentUpdateId) return;
          lastNavBarColor = navBarColor;
          lastNavBarDarkIcons = navBarDarkIcons;
        } catch (err) {
          console.warn('NavigationBar plugin failed to set color:', err);
        }
      }
    } catch (e) {
      console.error('Failed to apply native system bars styling:', e);
    }
  });
}

export async function applyNativeSystemBars(
  resolvedTheme: 'light' | 'dark',
  colorThemeName: string,
  options?: { isWelcome?: boolean; isDimmed?: boolean }
) {
  return reconcileSystemBars(resolvedTheme, colorThemeName, options);
}
