'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
interface VendorUser {
  userId: string;
  email: string;
  userType: 'vendor';
  companyName?: string;
  serviceType?: string;
  isAuthenticated: true;
  persistent: boolean;
  loginTime: string;
  expiresAt: null;
}

interface ClientUser {
  userId: string;
  email: string;
  userType: 'client';
  name?: string;
  isAuthenticated: true;
  persistent: boolean;
  loginTime: string;
  expiresAt: null;
}

type User = VendorUser | ClientUser;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isVendor: boolean;
  isClient: boolean;
  login: (userData: User, rememberMe?: boolean) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const currentUserStr = localStorage.getItem('currentUser');

        if (currentUserStr) {
          const userData = JSON.parse(currentUserStr);

          // Validate user data
          if (userData.isAuthenticated && userData.userId && userData.email) {
            setUser(userData);
            setIsAuthenticated(true);

            console.log('Auth initialized:', {
              userId: userData.userId,
              userType: userData.userType,
              email: userData.email
            });
          } else {
            // Invalid session data, clear it
            console.warn('Invalid session data found, clearing...');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            localStorage.removeItem('rememberMe');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        localStorage.removeItem('rememberMe');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = (userData: User, rememberMe: boolean = true) => {
    try {
      // Ensure required fields
      const userWithDefaults: User = {
        ...userData,
        isAuthenticated: true,
        persistent: rememberMe,
        loginTime: new Date().toISOString(),
        expiresAt: null
      };

      // Save to localStorage
      localStorage.setItem('currentUser', JSON.stringify(userWithDefaults));
      localStorage.setItem('authToken', `${userData.userType}-session-${userData.userId}`);
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      // Update state
      setUser(userWithDefaults);
      setIsAuthenticated(true);

      console.log('Login successful:', {
        userId: userWithDefaults.userId,
        userType: userWithDefaults.userType
      });
    } catch (error) {
      console.error('Error during login:', error);
      throw new Error('Failed to save login session');
    }
  };

  // Logout function
  const logout = () => {
    try {
      // Clear localStorage
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      localStorage.removeItem('rememberMe');

      // Also clear old vendor session if exists
      localStorage.removeItem('vendor_session');

      // Update state
      setUser(null);
      setIsAuthenticated(false);

      console.log('Logout successful');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Update user function
  const updateUser = (updates: Partial<User>) => {
    if (!user) return;

    try {
      const updatedUser = { ...user, ...updates };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser as User);

      console.log('User updated:', updates);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Computed values
  const isVendor = user?.userType === 'vendor';
  const isClient = user?.userType === 'client';

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    isVendor,
    isClient,
    login,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

// Export types for use in other files
export type { User, VendorUser, ClientUser };
