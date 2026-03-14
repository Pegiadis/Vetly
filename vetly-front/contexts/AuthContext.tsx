'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  login: (token: string, userType: 'vet' | 'pet_owner', rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY_VET = 'vetly_token_vet';
const TOKEN_KEY_OWNER = 'vetly_token_pet_owner';
const USER_TYPE_KEY = 'vetly_user_type';
const SESSION_FLAG = 'vetly_session_storage';

function getTokenKey(type: UserType): string {
  return type === 'vet' ? TOKEN_KEY_VET : TOKEN_KEY_OWNER;
}

function detectUserTypeFromPath(): UserType {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname;
  if (path.startsWith('/vet')) return 'vet';
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
  const key = getTokenKey(type);
  return sessionStorage.getItem(key) || localStorage.getItem(key);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (authToken: string, type: 'vet' | 'pet_owner', rememberMe: boolean = true) => {
    const decodedType = decodeTokenType(authToken);
    const resolvedType = decodedType || type;
    const key = getTokenKey(resolvedType);

    if (rememberMe) {
      localStorage.setItem(key, authToken);
      sessionStorage.removeItem(key);
      sessionStorage.removeItem(SESSION_FLAG);
    } else {
      sessionStorage.setItem(key, authToken);
      sessionStorage.setItem(SESSION_FLAG, 'true');
      localStorage.removeItem(key);
    }

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
    // Clear from both storages for both types
    for (const key of [TOKEN_KEY_VET, TOKEN_KEY_OWNER]) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
    localStorage.removeItem(USER_TYPE_KEY);
    sessionStorage.removeItem(SESSION_FLAG);
    setToken(null);
    setUser(null);
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
  // Check sessionStorage first, then localStorage
  const key = getTokenKey(resolvedType);
  return sessionStorage.getItem(key) || localStorage.getItem(key);
}
