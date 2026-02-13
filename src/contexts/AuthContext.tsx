"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '../types/enums';
import { tokenManager } from '@/Services/token.management.service';
import { authApi } from '@/Services/auth.api';

interface User {
  id: number;
  username: string;
  role: UserRole;
  branchId: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string | null;
  branch?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, userData?: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  fetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const expiryTimeoutRef = useRef<number | null>(null);

  const clearExpiryTimeout = () => {
    if (expiryTimeoutRef.current !== null) {
      window.clearTimeout(expiryTimeoutRef.current);
      expiryTimeoutRef.current = null;
    }
  };

  const handleSessionExpiry = () => {
    clearExpiryTimeout();
    tokenManager.removeToken();
    localStorage.removeItem('theme');
    localStorage.removeItem('adminInventoryColumnConfig');
    setUser(null);
    router.push('/auth/login');
  };

  const scheduleTokenExpiryLogout = (token?: string) => {
    const accessToken = token ?? tokenManager.getAccessToken();
    if (!accessToken) return;

    const decoded = tokenManager.decodeToken(accessToken);
    const exp = decoded?.exp;
    if (!exp) return;

    const msUntilExpiry = exp * 1000 - Date.now();
    if (msUntilExpiry <= 0) {
      handleSessionExpiry();
      return;
    }

    clearExpiryTimeout();
    expiryTimeoutRef.current = window.setTimeout(() => {
      handleSessionExpiry();
    }, msUntilExpiry);
  };

  const fetchProfile = async () => {
    try {
      const response = await authApi.getProfile();
      if (response.success && response.data) {
        setUser(prevUser => ({
          ...prevUser,
          ...response.data,
        } as User));
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  useEffect(() => {
    // Check if user is logged in on app start
    const token = tokenManager.getToken();
    if (token) {
      const decoded = tokenManager.decodeToken(token);
      const exp = decoded?.exp ? decoded.exp * 1000 : null;

      if (exp && exp <= Date.now()) {
        handleSessionExpiry();
      } else if (decoded) {
        setUser({
          id: decoded.sub || 0,
          username: decoded.username || "",
          role: (decoded.role as UserRole) || UserRole.BRANCH,
          branchId: decoded.branchId || 0,
        });
        fetchProfile();
        scheduleTokenExpiryLogout(token);
      }
    }

    // Listen for session expiry event from API
    window.addEventListener("auth:session-expired", handleSessionExpiry);

    setIsLoading(false);

    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpiry);
      clearExpiryTimeout();
    };
  }, []);


  const login = (token: string, userData?: User) => {
    tokenManager.setAccessToken(token);
    if (userData) {
      setUser(userData);
      fetchProfile();
    }
    scheduleTokenExpiryLogout(token);
  };

  const logout = () => {
    clearExpiryTimeout();
    tokenManager.removeToken();
    localStorage.removeItem('theme');
    localStorage.removeItem('adminInventoryColumnConfig');
    setUser(null);
    router.push('/auth/login');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    fetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

