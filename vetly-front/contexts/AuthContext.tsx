'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

type UserType = 'vet' | 'pet_owner' | null;

interface User {
  id: string;
  email: string;
  name: string;
  type: UserType;
  image_url: string | null;
  email_verified: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  userType: UserType;
  isLoading: boolean;
  login: (token: string, userType: 'vet' | 'pet_owner') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  /** Set when the profile could not be loaded for a reason other than an invalid session (network, 5xx). */
  authError: 'network' | 'unavailable' | null;
  /** Tries to load the profile again; the stored token is kept meanwhile. */
  retryAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY_VET = 'vetly_token_vet';
const TOKEN_KEY_OWNER = 'vetly_token_pet_owner';
const USER_TYPE_KEY = 'vetly_user_type';

function getTokenKey(type: UserType): string {
  return type === 'vet' ? TOKEN_KEY_VET : TOKEN_KEY_OWNER;
}

function detectUserTypeFromPath(): UserType {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname;
  if (path === '/vet' || path.startsWith('/vet/')) return 'vet';
  if (path.startsWith('/owner')) return 'pet_owner';
  return null;
}

function decodeTokenType(token: string): 'vet' | 'pet_owner' | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.type === 'vet' || payload.type === 'pet_owner' ? payload.type : null;
  } catch {
    return null;
  }
}

function getStoredTokenForType(type: 'vet' | 'pet_owner'): string | null {
  return localStorage.getItem(getTokenKey(type));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<'network' | 'unavailable' | null>(null);
  const sessionRef = useRef<{ token: string; type: UserType } | null>(null);

  useEffect(() => {
    // Migrate old shared token to per-type keys
    const oldToken = localStorage.getItem('vetly_token');
    if (oldToken) {
      const oldType = localStorage.getItem(USER_TYPE_KEY) as UserType;
      if (oldType) {
        localStorage.setItem(getTokenKey(oldType), oldToken);
      }
      localStorage.removeItem('vetly_token');
    }

    // Detect user type from URL path first, fallback to stored type
    const detectedType = detectUserTypeFromPath();
    const storedType = localStorage.getItem(USER_TYPE_KEY) as UserType;
    const resolvedType = detectedType || storedType;

    let storedToken: string | null = null;
    if (resolvedType) {
      storedToken = getStoredTokenForType(resolvedType);
      // Validate the token's type matches what we expect
      if (storedToken) {
        const decodedType = decodeTokenType(storedToken);
        if (decodedType && decodedType !== resolvedType) {
          // Token type mismatch — try the other type
          storedToken = getStoredTokenForType(decodedType);
        }
      }
    }

    // If no token found via path, try both keys
    if (!storedToken) {
      for (const type of ['vet', 'pet_owner'] as const) {
        const t = getStoredTokenForType(type);
        if (t) {
          const decoded = decodeTokenType(t);
          if (decoded === type) {
            storedToken = t;
            break;
          }
        }
      }
    }

    if (storedToken) {
      const finalType = decodeTokenType(storedToken) || resolvedType;
      if (finalType) {
        setToken(storedToken);
        setUserType(finalType);
        fetchUser(storedToken, finalType);
        return;
      }
    }

    setIsLoading(false);
  }, []);

  const fetchUser = async (authToken: string, type: UserType) => {
    sessionRef.current = { token: authToken, type };
    try {
      const endpoint = type === 'vet' ? '/auth/me' : '/auth/pet-owner/me';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          type,
          image_url: userData.image_url || null,
          email_verified: userData.email_verified ?? true,
        });
        setAuthError(null);
      } else if (response.status === 401 || response.status === 403) {
        // The server rejected the session or the account: only then is the token dropped.
        sessionRef.current = null;
        setAuthError(null);
        logout();
      } else {
        // 5xx and other transient failures keep the token so the user can retry.
        setAuthError('unavailable');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setAuthError('network');
    } finally {
      setIsLoading(false);
    }
  };

  const retryAuth = async () => {
    const session = sessionRef.current;
    if (!session) return;
    await fetchUser(session.token, session.type);
  };

  // While the profile could not be loaded, retry on reconnect and every 15 seconds.
  const retryRef = useRef(retryAuth);
  useEffect(() => { retryRef.current = retryAuth; });
  useEffect(() => {
    if (!authError) return;
    const run = () => { void retryRef.current(); };
    const timer = window.setInterval(run, 15000);
    window.addEventListener('online', run);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('online', run);
    };
  }, [authError]);

  const login = async (authToken: string, type: 'vet' | 'pet_owner') => {
    const decodedType = decodeTokenType(authToken);
    const resolvedType = decodedType || type;
    const key = getTokenKey(resolvedType);

    localStorage.setItem(key, authToken);
    localStorage.setItem(USER_TYPE_KEY, resolvedType);
    setToken(authToken);
    setUserType(resolvedType);
    await fetchUser(authToken, resolvedType);
  };

  const refreshUser = async () => {
    if (token && userType) {
      await fetchUser(token, userType);
    }
  };

  const logout = () => {
    for (const key of [TOKEN_KEY_VET, TOKEN_KEY_OWNER]) {
      localStorage.removeItem(key);
    }
    localStorage.removeItem(USER_TYPE_KEY);
    setToken(null);
    setUser(null);
    setAuthError(null);
    setUserType(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        userType,
        isLoading,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!token,
        authError,
        retryAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  const detectedType = detectUserTypeFromPath();
  const resolvedType = detectedType || (localStorage.getItem(USER_TYPE_KEY) as UserType);
  if (!resolvedType) return null;
  return localStorage.getItem(getTokenKey(resolvedType));
}
