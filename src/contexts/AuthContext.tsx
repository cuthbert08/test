'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import axios from 'axios';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadAuthFromStorage = useCallback(() => {
    setIsLoading(true);
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load auth from storage", error);
      // Clear storage if data is corrupted
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuthFromStorage();
  }, [loadAuthFromStorage]);


  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const data = response.data;
      
      if (data.token && data.user) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authUser', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        router.push('/');
      } else {
        throw new Error('Login failed: No token or user data returned.');
      }
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || 'Login failed');
        }
        throw new Error('An unknown error occurred during login.');
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
    router.push('/login');
  };
  
  const hasRole = useCallback((roles: string[]): boolean => {
    return !!user && roles.includes(user.role);
  }, [user]);

  const value = {
    isAuthenticated: !!token,
    user,
    token,
    isLoading,
    login,
    logout,
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
