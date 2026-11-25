import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { errorMessage } from './apiErrors.mjs';
const host = Constants.expoConfig?.hostUri?.split(':')[0] || 'localhost';
export const API_URL = ((Platform.OS === 'web' ? window.location.origin + '/api/v1' : process.env.EXPO_PUBLIC_API_URL) || `http://${Constants.expoConfig?.hostUri || `${host}:8083`}/api/v1`).replace(/\/$/, '');
const key = 'vetly_owner_session';
// Browser preview uses session storage; native devices use the OS keychain.
export const session = {
  get: () => Platform.OS === 'web' ? Promise.resolve(sessionStorage.getItem(key)) : SecureStore.getItemAsync(key),
  set: token => Platform.OS === 'web' ? Promise.resolve(sessionStorage.setItem(key, token)) : SecureStore.setItemAsync(key, token),
  clear: () => Platform.OS === 'web' ? Promise.resolve(sessionStorage.removeItem(key)) : SecureStore.deleteItemAsync(key),
};
export async function request(path, token, body, method, timeoutMs) {
  const multipart = body instanceof FormData;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || (multipart ? 60000 : 15000));
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: method || (body ? 'POST' : 'GET'), signal: controller.signal,
      headers: { ...(!multipart ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: multipart ? body : JSON.stringify(body) } : {}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      // `message` is always Greek; `detail` keeps what the backend sent for code that branches on it.
      const error = new Error(errorMessage(response.status, data.detail));
      error.status = response.status;
      error.detail = data.detail;
      throw error;
    }
    return data;
  } catch (error) {
    if (error.status) throw error;
    throw new Error('Δεν υπάρχει σύνδεση. Έλεγξε το δίκτυό σου και δοκίμασε ξανά.');
  } finally { clearTimeout(timer); }
}
export function petImage(path) {
  if (!path) return undefined;
  return path.startsWith('/uploads/') ? API_URL.replace(/\/api\/v1$/, '') + path : /^https?:\/\//.test(path) ? path : undefined;
}
