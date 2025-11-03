import axios from 'axios';
import storage from './storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  // 1) Allow explicit override from environment (recommended for production/tests)
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  // If we're running a production build (not __DEV__) and no env var provided,
  // default to the public backend on Render so the installed app can reach API.
  // This avoids the app trying to use emulator/localhost addresses in production.
  try {
    if (typeof __DEV__ !== 'undefined' && !__DEV__) {
      return 'https://hobbiz-mui.onrender.com';
    }
  } catch (e) {
    // ignore any reference errors
  }

  // 2) If running in Expo Go or the dev server, try many places where the packager host may be present.
  //    e.g. debuggerHost = "192.168.1.10:19000" -> we want http://192.168.1.10:5000
  const manifestAny: any = (Constants as any).manifest || (Constants as any).expoConfig || {};
  const candidates = [
    manifestAny.debuggerHost,
    manifestAny.packagerOpts?.host,
    // some Expo/Router configs expose packager info under expoConfig
    (Constants as any).expoConfig?.debuggerHost,
    (Constants as any).expoConfig?.packagerOpts?.host,
    // legacy / alternative places
    (Constants as any).manifest2?.debuggerHost,
    (Constants as any).manifest2?.packagerOpts?.host,
  ];

  for (const cand of candidates) {
    if (!cand) continue;
    const host = String(cand).split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:5000`;
    }
    // if host is localhost, skip because device can't reach it
  }

  // 3) No packager host detected. For Android physical devices, localhost isn't reachable.
  if (Platform.OS === 'android') {
    // Prefer the developer to set EXPO_PUBLIC_API_URL to their machine LAN IP.
    // Log a clear instruction so it's obvious in Expo console.
    // eslint-disable-next-line no-console
    console.warn('[mobile-app] No debuggerHost detected. If you run on a physical Android device, set EXPO_PUBLIC_API_URL to http://<YOUR_PC_IP>:5000');
    // Fallback: still return emulator host so emulators keep working
    return 'http://10.0.2.2:5000';
  }

  // iOS simulator can reach localhost; default there
  return 'http://localhost:5000';
}

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  // React Native doesn't use browser cookies by default; rely on Authorization header
  // withCredentials is ignored in RN; omit to avoid any side-effects
  // Increase timeout for cold starts on Render and slower/dev networks (ms)
  timeout: 45000,
});

// Log chosen baseURL for easier debugging in Expo console
try {
  const _base = getBaseUrl();
  // Only log in dev to avoid leaking in production
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[mobile-app] API baseURL =', _base);
    if (typeof _base === 'string' && _base.includes('10.0.2.2')) {
      console.warn('[mobile-app] Detected Android emulator fallback (10.0.2.2). If you run on a physical Android device, set EXPO_PUBLIC_API_URL to http://<YOUR_PC_IP>:5000');
    }
  }
} catch (e) {
  // ignore
}

// Attach token from SecureStore
api.interceptors.request.use(async (config) => {
  try {
    const token = await storage.getItemAsync('userToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// Better logging + resilient retries for transient network errors (cold starts, timeouts, 5xx)
api.interceptors.response.use(
  (res) => res,
  (error) => {
      try {
        // eslint-disable-next-line no-console
        const cfg = error?.config || {};
        const base = cfg.baseURL || api.defaults.baseURL;
        const url = cfg.url || '(unknown)';
        // Detect timeouts vs other network errors
        const isTimeout = error?.code === 'ECONNABORTED' || (error?.message || '').toLowerCase().includes('timeout');
        const status = error?.response?.status as number | undefined;
        const isNetwork = (error?.message === 'Network Error') || (!status && !error?.response);
        const isRetriableStatus = status === 502 || status === 503 || status === 504; // gateway errors during cold start
        // If server responded with 401, it's an auth issue — show as warn to reduce noise
        if (status === 401) {
          console.warn('[mobile-app] API 401 Unauthorized:', (error?.message || '').toString(), 'baseURL:', base, 'url:', url);
          // Do not attempt retry for 401
          return Promise.reject(error);
        }

        if (isTimeout) {
          console.error('[mobile-app] API timeout:', (error?.message || '').toString(), 'baseURL:', base, 'url:', url);
        } else {
          console.error('[mobile-app] API error:', error?.message, 'code:', error?.code, 'status:', status, 'baseURL:', base, 'url:', url);
        }

        // Retry up to 3 times for timeouts, network errors, and common 5xx cold-start statuses
        const MAX_RETRIES = 3;
        const retryCount = (cfg as any).__retryCount || 0;
        const shouldRetry = (isTimeout || isNetwork || isRetriableStatus) && retryCount < MAX_RETRIES;
        if (cfg && shouldRetry) {
          (cfg as any).__retryCount = retryCount + 1;
          const delay = Math.min(1000 * Math.pow(2, retryCount), 6000); // 1s, 2s, 4s caps at 6s
          return new Promise((resolve) => setTimeout(resolve, delay)).then(() => api(cfg));
        }
    } catch (e) {
      // ignore
    }
    return Promise.reject(error);
  }
);

export default api;
