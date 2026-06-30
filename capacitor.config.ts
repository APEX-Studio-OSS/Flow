import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flow.apex',
  appName: 'Flow',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Keyboard: {
      resizeOnFullScreen: true
    },
    SplashScreen: {
      launchShowDuration: 30000,
      showSpinner: false,
      launchAutoHide: false
    }
  }
};

export default config;
