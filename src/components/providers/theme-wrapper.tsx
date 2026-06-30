
'use client';

import { useEffect } from 'react';
import { useApp, colorThemes } from './app-provider';
import { useTheme } from './theme-provider';
import { applyNativeSystemBars } from '@/services/native-system-bars';

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { colorThemeName } = useApp();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const selectedColorTheme = colorThemes.find(t => t.name === colorThemeName) || colorThemes[0];
    const root = document.querySelector('html');
    const body = document.body;
    const docEl = document.documentElement;

    if (root) {
        docEl.classList.remove('glass');
        body.classList.remove('aurora');
        body.style.backgroundImage = '';
        body.style.backgroundAttachment = '';

        docEl.classList.remove('light', 'dark');
        docEl.classList.add(resolvedTheme);
        root.style.setProperty('--primary', selectedColorTheme.primary[resolvedTheme]);
        root.style.setProperty('--accent', selectedColorTheme.accent[resolvedTheme]);
        root.style.setProperty('--ring', selectedColorTheme.primary[resolvedTheme]);

        // Apply native system bars coloring on Android
        applyNativeSystemBars(resolvedTheme, colorThemeName);
    }
  }, [colorThemeName, resolvedTheme]);

  return <>{children}</>;
}
