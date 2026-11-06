import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
const host = Constants.expoConfig?.hostUri?.split(':')[0] || 'localhost';
export const API_URL = ((Platform.OS === 'web' ? window.location.origin + '/api/v1' : process.env.EXPO_PUBLIC_API_URL) || `http://${Constants.expoConfig?.hostUri || `${host}:8083`}/api/v1`).replace(/\/$/, '');
const key = 'vetly_owner_session';
// Browser preview uses session storage; native devices use the OS keychain.
export const session = {
  get: () => Platform.OS === 'web' ? Promise.resolve(sessionStorage.getItem(key)) : SecureStore.getItemAsync(key),
  set: token => Platform.OS === 'web' ? Promise.resolve(sessionStorage.setItem(key, token)) : SecureStore.setItemAsync(key, token),
  clear: () => Platform.OS === 'web' ? Promise.resolve(sessionStorage.removeItem(key)) : SecureStore.deleteItemAsync(key),
};
export async function request(path, token, body, method) {
  const multipart = body instanceof FormData;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), multipart ? 60000 : 15000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: method || (body ? 'POST' : 'GET'), signal: controller.signal,
      headers: { ...(!multipart ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: multipart ? body : JSON.stringify(body) } : {}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(typeof data.detail === 'string' ? data.detail : 'Δεν ήταν δυνατή η ολοκλήρωση. Δοκιμάστε ξανά.');
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (error.status) throw error;
    throw new Error('Δεν υπάρχει σύνδεση με τον server. Ελέγξτε το δίκτυό σας και δοκιμάστε ξανά.');
  } finally { clearTimeout(timer); }
}
export function petImage(path) {
  if (!path) return undefined;
  return path.startsWith('/uploads/') ? API_URL.replace(/\/api\/v1$/, '') + path : /^https?:\/\//.test(path) ? path : undefined;
}
