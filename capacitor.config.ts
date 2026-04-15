import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shgconnect.app',
  appName: 'SHG Connect',
  webDir: 'dist',
  
  // Server configuration for development
  server: {
    // For development, use your local IP
    // url: 'http://192.168.1.35:3000',
    // cleartext: true,
    androidScheme: 'https',
    iosScheme: 'https',
  },
  
  // Android specific configuration
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true, // Set to false for production
    backgroundColor: '#0D0D0F',
    // Permissions
    includePlugins: [
      '@capacitor/camera',
      '@capacitor/filesystem',
      '@capacitor/haptics',
      '@capacitor/keyboard',
      '@capacitor/local-notifications',
      '@capacitor/network',
      '@capacitor/preferences',
      '@capacitor/share',
      '@capacitor/splash-screen',
      '@capacitor/status-bar',
      '@capacitor/toast',
      '@capacitor/device',
      '@capacitor/app',
    ],
  },
  
  // iOS specific configuration
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0D0D0F',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
  },
  
  // Plugins configuration
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#0D0D0F',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0D0D0F',
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#6366F1',
      sound: 'notification.wav',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
