'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserType = 'vet' | 'pet_owner' | null;

interface User {
  id: string;
  email: string;
  name: string;
  type: UserType;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  userType: UserType;
  isLoading: boolean;
  login: (token: string, userType: 'vet' | 'pet_owner') => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
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
  if (path.startsWith('/vet')) return 'vet';
  if (path.startsWith('/owner')) return 'pet_owner';
  return null;
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
    const resolvedType = detectedType || (localStorage.getItem(USER_TYPE_KEY) as UserType);
    const storedToken = resolvedType
      ? localStorage.getItem(getTokenKey(resolvedType))
      : null;

    if (storedToken && resolvedType) {
      setToken(storedToken);
      setUserType(resolvedType);
      fetchUser(storedToken, resolvedType);
    } else {
      setIsLoading(false);
    }
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
        });
      } else {
        // Token is invalid, clear it
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (authToken: string, type: 'vet' | 'pet_owner') => {
    localStorage.setItem(getTokenKey(type), authToken);
    localStorage.setItem(USER_TYPE_KEY, type);
    setToken(authToken);
    setUserType(type);
    await fetchUser(authToken, type);
  };

  const logout = () => {
    if (userType) {
      localStorage.removeItem(getTokenKey(userType));
    }
    localStorage.removeItem(USER_TYPE_KEY);
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
  // Detect from URL path which token to use — prevents cross-tab interference
  const detectedType = detectUserTypeFromPath();
  const resolvedType = detectedType || (localStorage.getItem(USER_TYPE_KEY) as UserType);
  if (!resolvedType) return null;
  return localStorage.getItem(getTokenKey(resolvedType));
}
