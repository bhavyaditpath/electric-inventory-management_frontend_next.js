"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await authApi.getProfile();
      console.log(response.data)
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
      // Decode token to get user information
      const decoded = tokenManager.decodeToken(token);
      if (decoded) {
        setUser({
          id: decoded.sub || 0,
          username: decoded.username || '',
          role: (decoded.role as UserRole) || UserRole.BRANCH,
          branchId: decoded.branchId || 0,
        });
        // Fetch full profile data
        fetchProfile();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData?: User) => {
    tokenManager.setToken(token);
    if (userData) {
      setUser(userData);
      // Fetch full profile data after login
      fetchProfile();
    }
  };

  const logout = () => {
    tokenManager.removeToken();
    setUser(null);
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