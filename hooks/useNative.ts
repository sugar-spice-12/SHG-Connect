// React hooks for native mobile features
import { useState, useEffect, useCallback } from 'react';
import {
  isNative,
  isAndroid,
  isIOS,
  haptics,
  statusBar,
  keyboard,
  appLifecycle,
  device,
  network,
  share,
  notifications,
  camera,
  preferences,
  initializeNative,
} from '../lib/native';

// Hook to initialize native features
export function useNativeInit() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeNative();
      setIsReady(true);
    };
    init();
  }, []);

  return { isReady, isNative, isAndroid, isIOS };
}

// Hook for haptic feedback
export function useHaptics() {
  const tap = useCallback(async (style: 'light' | 'medium' | 'heavy' = 'light') => {
    switch (style) {
      case 'light':
        await haptics.light();
        break;
      case 'medium':
        await haptics.medium();
        break;
      case 'heavy':
        await haptics.heavy();
        break;
    }
  }, []);

  const notify = useCallback(async (type: 'success' | 'warning' | 'error' = 'success') => {
    switch (type) {
      case 'success':
        await haptics.success();
        break;
      case 'warning':
        await haptics.warning();
        break;
      case 'error':
        await haptics.error();
        break;
    }
  }, []);

  const selection = useCallback(async () => {
    await haptics.selection();
  }, []);

  const vibrate = useCallback(async (duration?: number) => {
    await haptics.vibrate(duration);
  }, []);

  return { tap, notify, selection, vibrate, isNative };
}

// Hook for network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const checkStatus = async () => {
      const status = await network.getStatus();
      setIsOnline(status.connected);
      setConnectionType(status.connectionType);
    };

    checkStatus();

    const listener = network.onChange((status) => {
      setIsOnline(status.connected);
      setConnectionType(status.connectionType);
    });

    return () => {
      listener.remove();
    };
  }, []);

  return { isOnline, connectionType };
}

// Hook for app lifecycle
export function useAppLifecycle() {
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const listener = appLifecycle.onStateChange((state) => {
      setIsActive(state.isActive);
    });

    return () => {
      listener.remove();
    };
  }, []);

  return { isActive };
}

// Hook for keyboard
export function useKeyboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showListener = keyboard.onShow((info) => {
      setIsVisible(true);
      setKeyboardHeight(info.keyboardHeight);
    });

    const hideListener = keyboard.onHide(() => {
      setIsVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const hide = useCallback(async () => {
    await keyboard.hide();
  }, []);

  return { isVisible, keyboardHeight, hide };
}

// Hook for device info
export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [batteryInfo, setBatteryInfo] = useState<any>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      const info = await device.getInfo();
      setDeviceInfo(info);

      const battery = await device.getBattery();
      setBatteryInfo(battery);
    };

    fetchInfo();
  }, []);

  return { deviceInfo, batteryInfo };
}

// Hook for sharing
export function useShare() {
  const shareContent = useCallback(async (options: {
    title?: string;
    text?: string;
    url?: string;
  }) => {
    try {
      await share.share(options);
      return true;
    } catch (error) {
      console.error('Share failed:', error);
      return false;
    }
  }, []);

  return { share: shareContent };
}

// Hook for camera
export function useCamera() {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      const permission = await camera.checkPermission();
      setHasPermission(permission.camera === 'granted');
    };
    checkPermission();
  }, []);

  const requestPermission = useCallback(async () => {
    const permission = await camera.requestPermission();
    setHasPermission(permission.camera === 'granted');
    return permission.camera === 'granted';
  }, []);

  const takePhoto = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return null;
    }
    return await camera.takePhoto();
  }, [hasPermission, requestPermission]);

  const pickFromGallery = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return null;
    }
    return await camera.pickFromGallery();
  }, [hasPermission, requestPermission]);

  return { hasPermission, requestPermission, takePhoto, pickFromGallery };
}

// Hook for local notifications
export function useNotifications() {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      const permission = await notifications.checkPermission();
      setHasPermission(permission.display === 'granted');
    };
    checkPermission();
  }, []);

  const requestPermission = useCallback(async () => {
    const permission = await notifications.requestPermission();
    setHasPermission(permission.display === 'granted');
    return permission.display === 'granted';
  }, []);

  const schedule = useCallback(async (options: {
    id: number;
    title: string;
    body: string;
    at?: Date;
  }) => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return false;
    }
    
    await notifications.schedule({
      id: options.id,
      title: options.title,
      body: options.body,
      schedule: options.at ? { at: options.at } : undefined,
    });
    return true;
  }, [hasPermission, requestPermission]);

  const cancel = useCallback(async (ids: number[]) => {
    await notifications.cancel(ids);
  }, []);

  const cancelAll = useCallback(async () => {
    await notifications.cancelAll();
  }, []);

  return { hasPermission, requestPermission, schedule, cancel, cancelAll };
}

// Hook for preferences/storage
export function usePreferences<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const stored = await preferences.get(key);
      if (stored) {
        try {
          setValue(JSON.parse(stored));
        } catch {
          setValue(stored as unknown as T);
        }
      }
      setIsLoading(false);
    };
    load();
  }, [key]);

  const set = useCallback(async (newValue: T) => {
    setValue(newValue);
    await preferences.set(key, JSON.stringify(newValue));
  }, [key]);

  const remove = useCallback(async () => {
    setValue(defaultValue);
    await preferences.remove(key);
  }, [key, defaultValue]);

  return { value, set, remove, isLoading };
}

// Hook for back button (Android)
export function useBackButton(handler: () => boolean) {
  useEffect(() => {
    if (!isAndroid) return;

    const listener = appLifecycle.onBackButton(() => {
      const handled = handler();
      if (!handled) {
        // Default behavior - exit app
        appLifecycle.exitApp();
      }
    });

    return () => {
      listener.remove();
    };
  }, [handler]);
}

// Combined platform hook
export function usePlatform() {
  return {
    isNative,
    isAndroid,
    isIOS,
    isWeb: !isNative,
  };
}
