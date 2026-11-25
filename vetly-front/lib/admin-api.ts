/**
 * API client for the admin panel. Admin sessions are kept apart from vet and
 * owner sessions: their own token key, their own login page, no AuthContext.
 */

import { ApiError, throwApiError } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'vetly_token_admin';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* nothing stored */
  }
}

/** Ends the admin session and returns to the admin login page. */
export function adminSignOut(expired = false): void {
  clearAdminToken();
  window.location.href = expired ? '/admin/login?expired=true' : '/admin/login';
}

async function request<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const token = getAdminToken();
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/admin${endpoint}`, {
      ...init,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'Δεν ήταν δυνατή η σύνδεση με τον διακομιστή. Ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.', 'Network error');
  }
  if (response.status === 401 && endpoint !== '/login') adminSignOut(true);
  if (!response.ok) await throwApiError(response);
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const adminApi = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data: unknown = {}) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
};
