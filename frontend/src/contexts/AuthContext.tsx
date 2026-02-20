'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import apiClient, { tokenStorage } from '@/lib/api-client';
import { User, AuthResult, LoginCredentials, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Decode JWT to extract user information
  const decodeToken = (token: string): User | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);

      return {
        id: payload.userId,
        email: payload.email,
        name: payload.name || payload.email,
        role: payload.role,
        teamId: payload.teamId,
      };
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  };

  // Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);
      const exp = payload.exp * 1000; // Convert to milliseconds

      return Date.now() >= exp;
    } catch (error) {
      return true;
    }
  };

  // Initialize auth state from stored token
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenStorage.getToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      // Check if token is expired
      if (isTokenExpired(token)) {
        // Try to refresh
        const refreshToken = tokenStorage.getRefreshToken();
        if (refreshToken) {
          try {
            const response = await apiClient.post<AuthResult>('/api/auth/refresh', {
              refreshToken,
            });
            tokenStorage.setToken(response.data.token);
            if (response.data.refreshToken) {
              tokenStorage.setRefreshToken(response.data.refreshToken);
            }
            setUser(response.data.user);
          } catch (error) {
            console.error('Failed to refresh token:', error);
            tokenStorage.removeToken();
            tokenStorage.removeRefreshToken();
          }
        } else {
          tokenStorage.removeToken();
        }
        setIsLoading(false);
        return;
      }

      // Decode token to get user info
      const userData = decodeToken(token);
      if (userData) {
        setUser(userData);
      } else {
        tokenStorage.removeToken();
        tokenStorage.removeRefreshToken();
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await apiClient.post<AuthResult>('/api/auth/login', credentials);
      const { token, refreshToken, user: userData } = response.data;

      tokenStorage.setToken(token);
      if (refreshToken) {
        tokenStorage.setRefreshToken(refreshToken);
      }

      setUser(userData);
      router.push('/dashboard');
    },
    [router]
  );

  const logout = useCallback(() => {
    // Call logout endpoint (fire and forget)
    apiClient.post('/api/auth/logout').catch((error) => {
      console.error('Logout API call failed:', error);
    });

    tokenStorage.removeToken();
    tokenStorage.removeRefreshToken();
    setUser(null);
    router.push('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    const token = tokenStorage.getToken();
    if (!token) {
      setUser(null);
      return;
    }

    const userData = decodeToken(token);
    if (userData) {
      setUser(userData);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
