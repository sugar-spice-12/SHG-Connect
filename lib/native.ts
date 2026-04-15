// Native Mobile SDK Integration using Capacitor
// This file provides native mobile capabilities

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardStyle } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { Share } from '@capacitor/share';
import { Toast } from '@capacitor/toast';
import { LocalNotifications } from '@capacitor/local-notifications';
import { SplashScreen } from '@capacitor/splash-screen';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';

// Check if running on native platform
export const isNative = Capacitor.isNativePlatform();
export const isAndroid = Capacitor.getPlatform() === 'android';
export const isIOS = Capacitor.getPlatform() === 'ios';
export const isWeb = Capacitor.getPlatform() === 'web';

// ============ HAPTICS ============
export const haptics = {
  // Light tap feedback
  light: async () => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  },
  
  // Medium tap feedback
  medium: async () => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
  },
  
  // Heavy tap feedback
  heavy: async () => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
  },
  
  // Success notification
  success: async () => {
    if (isNative) {
      await Haptics.notification({ type: NotificationType.Success });
    }
  },
  
  // Warning notification
  warning: async () => {
    if (isNative) {
      await Haptics.notification({ type: NotificationType.Warning });
    }
  },
  
  // Error notification
  error: async () => {
    if (isNative) {
      await Haptics.notification({ type: NotificationType.Error });
    }
  },
  
  // Selection changed
  selection: async () => {
    if (isNative) {
      await Haptics.selectionChanged();
    }
  },
  
  // Vibrate for duration
  vibrate: async (duration: number = 300) => {
    if (isNative) {
      await Haptics.vibrate({ duration });
    }
  },
};

// ============ STATUS BAR ============
export const statusBar = {
  // Set dark status bar (light icons)
  setDark: async () => {
    if (isNative) {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0D0D0F' });
    }
  },
  
  // Set light status bar (dark icons)
  setLight: async () => {
    if (isNative) {
      await StatusBar.setStyle({ style: Style.Light });
    }
  },
  
  // Hide status bar
  hide: async () => {
    if (isNative) {
      await StatusBar.hide();
    }
  },
  
  // Show status bar
  show: async () => {
    if (isNative) {
      await StatusBar.show();
    }
  },
  
  // Set background color
  setColor: async (color: string) => {
    if (isNative && isAndroid) {
      await StatusBar.setBackgroundColor({ color });
    }
  },
};

// ============ KEYBOARD ============
export const keyboard = {
  // Set dark keyboard
  setDark: async () => {
    if (isNative) {
      await Keyboard.setStyle({ style: KeyboardStyle.Dark });
    }
  },
  
  // Hide keyboard
  hide: async () => {
    if (isNative) {
      await Keyboard.hide();
    }
  },
  
  // Show keyboard
  show: async () => {
    if (isNative) {
      await Keyboard.show();
    }
  },
  
  // Add keyboard listeners
  onShow: (callback: (info: { keyboardHeight: number }) => void) => {
    if (isNative) {
      return Keyboard.addListener('keyboardWillShow', callback);
    }
    return { remove: () => {} };
  },
  
  onHide: (callback: () => void) => {
    if (isNative) {
      return Keyboard.addListener('keyboardWillHide', callback);
    }
    return { remove: () => {} };
  },
};

// ============ APP LIFECYCLE ============
export const appLifecycle = {
  // Listen for app state changes
  onStateChange: (callback: (state: { isActive: boolean }) => void) => {
    if (isNative) {
      return App.addListener('appStateChange', callback);
    }
    return { remove: () => {} };
  },
  
  // Listen for back button (Android)
  onBackButton: (callback: () => void) => {
    if (isNative && isAndroid) {
      return App.addListener('backButton', callback);
    }
    return { remove: () => {} };
  },
  
  // Exit app (Android)
  exitApp: () => {
    if (isNative && isAndroid) {
      App.exitApp();
    }
  },
  
  // Get app info
  getInfo: async () => {
    if (isNative) {
      return await App.getInfo();
    }
    return { name: 'SHG Connect', version: '1.0.0', build: '1', id: 'com.shgconnect.app' };
  },
  
  // Get launch URL (deep link)
  getLaunchUrl: async () => {
    if (isNative) {
      return await App.getLaunchUrl();
    }
    return null;
  },
};

// ============ DEVICE INFO ============
export const device = {
  // Get device info
  getInfo: async () => {
    return await Device.getInfo();
  },
  
  // Get device ID
  getId: async () => {
    return await Device.getId();
  },
  
  // Get battery info
  getBattery: async () => {
    return await Device.getBatteryInfo();
  },
  
  // Get language code
  getLanguage: async () => {
    return await Device.getLanguageCode();
  },
};

// ============ NETWORK ============
export const network = {
  // Get current network status
  getStatus: async () => {
    return await Network.getStatus();
  },
  
  // Listen for network changes
  onChange: (callback: (status: { connected: boolean; connectionType: string }) => void) => {
    return Network.addListener('networkStatusChange', callback);
  },
};

// ============ SHARE ============
export const share = {
  // Share content
  share: async (options: { title?: string; text?: string; url?: string; dialogTitle?: string }) => {
    if (isNative) {
      return await Share.share(options);
    } else if (navigator.share) {
      return await navigator.share(options);
    }
    // Fallback: copy to clipboard
    if (options.url) {
      await navigator.clipboard.writeText(options.url);
    }
  },
  
  // Check if sharing is available
  canShare: async () => {
    if (isNative) {
      return true;
    }
    return !!navigator.share;
  },
};

// ============ TOAST ============
export const toast = {
  // Show toast message
  show: async (text: string, duration: 'short' | 'long' = 'short', position: 'top' | 'center' | 'bottom' = 'bottom') => {
    if (isNative) {
      await Toast.show({ text, duration, position });
    } else {
      // Fallback to console or custom toast
      console.log('Toast:', text);
    }
  },
};

// ============ LOCAL NOTIFICATIONS ============
export const notifications = {
  // Request permission
  requestPermission: async () => {
    if (isNative) {
      return await LocalNotifications.requestPermissions();
    }
    return { display: 'granted' as const };
  },
  
  // Check permission
  checkPermission: async () => {
    if (isNative) {
      return await LocalNotifications.checkPermissions();
    }
    return { display: 'granted' as const };
  },
  
  // Schedule notification
  schedule: async (options: {
    id: number;
    title: string;
    body: string;
    schedule?: { at: Date };
    sound?: string;
    actionTypeId?: string;
    extra?: any;
  }) => {
    if (isNative) {
      await LocalNotifications.schedule({
        notifications: [{
          id: options.id,
          title: options.title,
          body: options.body,
          schedule: options.schedule,
          sound: options.sound,
          actionTypeId: options.actionTypeId,
          extra: options.extra,
        }],
      });
    }
  },
  
  // Cancel notification
  cancel: async (ids: number[]) => {
    if (isNative) {
      await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) });
    }
  },
  
  // Cancel all notifications
  cancelAll: async () => {
    if (isNative) {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
    }
  },
  
  // Listen for notification tap
  onTap: (callback: (notification: any) => void) => {
    if (isNative) {
      return LocalNotifications.addListener('localNotificationActionPerformed', callback);
    }
    return { remove: () => {} };
  },
};

// ============ SPLASH SCREEN ============
export const splashScreen = {
  // Hide splash screen
  hide: async () => {
    if (isNative) {
      await SplashScreen.hide();
    }
  },
  
  // Show splash screen
  show: async () => {
    if (isNative) {
      await SplashScreen.show({
        autoHide: false,
        fadeInDuration: 300,
        fadeOutDuration: 300,
      });
    }
  },
};

// ============ CAMERA ============
export const camera = {
  // Take photo
  takePhoto: async () => {
    if (isNative) {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });
      return image.base64String;
    }
    return null;
  },
  
  // Pick from gallery
  pickFromGallery: async () => {
    if (isNative) {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });
      return image.base64String;
    }
    return null;
  },
  
  // Check camera permission
  checkPermission: async () => {
    if (isNative) {
      return await Camera.checkPermissions();
    }
    return { camera: 'granted' as const, photos: 'granted' as const };
  },
  
  // Request camera permission
  requestPermission: async () => {
    if (isNative) {
      return await Camera.requestPermissions();
    }
    return { camera: 'granted' as const, photos: 'granted' as const };
  },
};

// ============ PREFERENCES (Local Storage) ============
export const preferences = {
  // Set value
  set: async (key: string, value: string) => {
    if (isNative) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  },
  
  // Get value
  get: async (key: string): Promise<string | null> => {
    if (isNative) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  },
  
  // Remove value
  remove: async (key: string) => {
    if (isNative) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },
  
  // Clear all
  clear: async () => {
    if (isNative) {
      await Preferences.clear();
    } else {
      localStorage.clear();
    }
  },
  
  // Get all keys
  keys: async (): Promise<string[]> => {
    if (isNative) {
      const { keys } = await Preferences.keys();
      return keys;
    }
    return Object.keys(localStorage);
  },
};

// ============ INITIALIZATION ============
export const initializeNative = async () => {
  if (!isNative) {
    console.log('Running in web mode');
    return;
  }
  
  console.log(`Running on ${Capacitor.getPlatform()}`);
  
  // Set dark status bar
  await statusBar.setDark();
  
  // Set dark keyboard
  await keyboard.setDark();
  
  // Hide splash screen after a delay
  setTimeout(async () => {
    await splashScreen.hide();
  }, 1000);
  
  // Request notification permission
  await notifications.requestPermission();
  
  // Log device info
  const deviceInfo = await device.getInfo();
  console.log('Device:', deviceInfo);
};

// Export platform check
export const getPlatform = () => Capacitor.getPlatform();
