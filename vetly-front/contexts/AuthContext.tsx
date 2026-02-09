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

const TOKEN_KEY = 'vetly_token';
const USER_TYPE_KEY = 'vetly_user_type';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUserType = localStorage.getItem(USER_TYPE_KEY) as UserType;

    if (storedToken && storedUserType) {
      setToken(storedToken);
      setUserType(storedUserType);
      fetchUser(storedToken, storedUserType);
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
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(USER_TYPE_KEY, type);
    setToken(authToken);
    setUserType(type);
    await fetchUser(authToken, type);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
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
  return localStorage.getItem(TOKEN_KEY);
}
