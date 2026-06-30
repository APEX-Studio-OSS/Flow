
'use client';

import { Inter, Allura } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AppProvider } from '@/components/providers/app-provider';
import { useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { AndroidNavigation } from '@/components/layout/android-navigation';
import { WelcomeFlow } from '@/features/welcome/welcome-flow';
import { NativeTextSelectionGuard } from '@/components/providers/native-text-selection-guard';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const allura = Allura({ weight: '400', subsets: ['latin'], variable: '--font-allura' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    document.title = 'Flow';

    let appStateListener: any = null;

    const setupCapacitor = async () => {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        document.body.classList.add('is-native');
        if (Capacitor.getPlatform() === 'android') {
          document.body.classList.add('is-android');
        }
        const { StatusBar } = await import('@capacitor/status-bar');
        
        const reapplyBars = async () => {
          try {
            const { storage } = await import('@/lib/storage');
            const { applyNativeSystemBars } = await import('@/services/native-system-bars');
            
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const resolvedTheme = isDark ? 'dark' : 'light';
            const colorTheme = await storage.getItem('flow-color-palette') || 'Ocean';
            
            await applyNativeSystemBars(resolvedTheme, colorTheme);
          } catch (e) {
            console.warn('Failed to reapply system bars', e);
          }
        };

        try {
          await StatusBar.setOverlaysWebView({ overlay: true });
          await reapplyBars();
        } catch (e) {
          console.warn('StatusBar configuration failed', e);
        }

        try {
          const { App } = await import('@capacitor/app');
          appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
              reapplyBars();
            }
          });
        } catch (e) {
          console.warn('AppState listener configuration failed', e);
        }

        try {
          const { Keyboard } = await import('@capacitor/keyboard');
          await Keyboard.setAccessoryBarVisible({ isVisible: false });
        } catch (e) {
          console.warn('Keyboard configuration failed', e);
        }
      }
    };

    setupCapacitor();

    return () => {
      if (appStateListener) {
        appStateListener.remove();
      }
    };
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var keysToClear = ['flow-ui-theme', 'theme', 'themeMode', 'colorScheme', 'glassMode', 'selectedMode'];
                for (var i = 0; i < keysToClear.length; i++) {
                  localStorage.removeItem(keysToClear[i]);
                }
                var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                var resolvedTheme = isDark ? 'dark' : 'light';
                
                var root = document.documentElement;
                root.classList.remove('light', 'dark', 'glass');
                root.classList.add(resolvedTheme);
                root.style.colorScheme = resolvedTheme;
              } catch (e) {}
            })();
          `
        }} />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable,
          allura.variable
        )}
      >
        <ThemeProvider>
          <NativeTextSelectionGuard />
          <AppProvider>
              <AndroidNavigation />
              <WelcomeFlow>
                <AppShell>
                  {children}
                </AppShell>
              </WelcomeFlow>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
