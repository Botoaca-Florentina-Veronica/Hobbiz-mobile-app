import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

// Lazy helper to try to load expo-secure-store only on native platforms.
function getSecureStoreIfAvailable() {
  if (isWeb) return null;
  try {
    // Use require so bundlers don't eagerly evaluate on web
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SecureStore = require('expo-secure-store');
    return SecureStore;
  } catch (e) {
    return null;
  }
}

async function setItemAsync(key: string, value: string) {
  if (isWeb) {
    try { window.localStorage.setItem(key, value); } catch (_) { /* ignore */ }
    return;
  }

  const SecureStore = getSecureStoreIfAvailable();
  if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
    try { await SecureStore.setItemAsync(key, value); return; } catch (e) { /* fallback */ }
  }
  try { window.localStorage.setItem(key, value); } catch (_) { /* ignore */ }
}

async function getItemAsync(key: string) {
  if (isWeb) {
    try { return Promise.resolve(window.localStorage.getItem(key)); } catch (_) { return null; }
  }
  const SecureStore = getSecureStoreIfAvailable();
  if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
    try { return await SecureStore.getItemAsync(key); } catch (e) { /* fallback */ }
  }
  try { return Promise.resolve(window.localStorage.getItem(key)); } catch (_) { return null; }
}

async function deleteItemAsync(key: string) {
  if (isWeb) {
    try { window.localStorage.removeItem(key); } catch (_) { /* ignore */ }
    return;
  }
  const SecureStore = getSecureStoreIfAvailable();
  if (SecureStore && typeof SecureStore.deleteItemAsync === 'function') {
    try { await SecureStore.deleteItemAsync(key); return; } catch (e) { /* fallback */ }
  }
  try { window.localStorage.removeItem(key); } catch (_) { /* ignore */ }
}

export default {
  setItemAsync,
  getItemAsync,
  deleteItemAsync,
};
