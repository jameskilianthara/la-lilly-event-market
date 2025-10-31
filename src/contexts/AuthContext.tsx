'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

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
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, userType: 'vendor' | 'client', metadata?: Record<string, any>) => Promise<{ success: boolean; userId?: string; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Helper: Convert Supabase user + metadata to our User type
async function mapSupabaseUserToAppUser(supabaseUser: SupabaseUser): Promise<User | null> {
  if (!supabase) return null;

  try {
    // Fetch user profile from public.users table
    const { data: profile, error } = await supabase
      .from('users')
      .select('user_type, name, company_name, service_type')
      .eq('id', supabaseUser.id)
      .single();

    if (error || !profile) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    const baseUser = {
      userId: supabaseUser.id,
      email: supabaseUser.email!,
      isAuthenticated: true as const,
      persistent: true,
      loginTime: new Date().toISOString(),
      expiresAt: null as null,
    };

    if (profile.user_type === 'vendor') {
      return {
        ...baseUser,
        userType: 'vendor',
        companyName: profile.company_name || undefined,
        serviceType: profile.service_type || undefined,
      } as VendorUser;
    } else {
      return {
        ...baseUser,
        userType: 'client',
        name: profile.name || undefined,
      } as ClientUser;
    }
  } catch (error) {
    console.error('Error mapping Supabase user:', error);
    return null;
  }
}

// Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from Supabase session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (!supabase) {
        console.warn('Supabase client not initialized, falling back to localStorage');
        // Fallback to localStorage if Supabase not available
        try {
          const currentUserStr = localStorage.getItem('currentUser');
          if (currentUserStr) {
            const userData = JSON.parse(currentUserStr);
            if (userData.isAuthenticated && userData.userId && userData.email) {
              setUser(userData);
              setIsAuthenticated(true);
            }
          }
        } catch (error) {
          console.error('Error loading localStorage auth:', error);
        }
        setIsLoading(false);
        return;
      }

      try {
        // Get current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error fetching session:', error);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          const appUser = await mapSupabaseUserToAppUser(session.user);
          if (appUser) {
            setUser(appUser);
            setIsAuthenticated(true);
            // Store in localStorage as backup
            localStorage.setItem('currentUser', JSON.stringify(appUser));
            console.log('Auth initialized from Supabase:', {
              userId: appUser.userId,
              userType: appUser.userType,
              email: appUser.email
            });
          }
        } else {
          // Check localStorage fallback
          const currentUserStr = localStorage.getItem('currentUser');
          if (currentUserStr) {
            const userData = JSON.parse(currentUserStr);
            if (userData.isAuthenticated) {
              setUser(userData);
              setIsAuthenticated(true);
              console.log('Auth initialized from localStorage fallback');
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          const appUser = await mapSupabaseUserToAppUser(session.user);
          if (appUser) {
            setUser(appUser);
            setIsAuthenticated(true);
            localStorage.setItem('currentUser', JSON.stringify(appUser));
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('currentUser');
          localStorage.removeItem('authToken');
          localStorage.removeItem('rememberMe');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Login function with Supabase Auth
  const login = async (email: string, password: string, rememberMe: boolean = true): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        const appUser = await mapSupabaseUserToAppUser(data.user);
        if (appUser) {
          setUser(appUser);
          setIsAuthenticated(true);
          localStorage.setItem('currentUser', JSON.stringify(appUser));
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          }
          console.log('Login successful:', {
            userId: appUser.userId,
            userType: appUser.userType
          });
          return { success: true };
        } else {
          return { success: false, error: 'User profile not found' };
        }
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Unexpected login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Signup function with Supabase Auth
  const signup = async (
    email: string,
    password: string,
    userType: 'vendor' | 'client',
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType,
            ...metadata
          }
        }
      });

      if (authError) {
        console.error('Signup error:', authError);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Signup failed' };
      }

      // Create user profile in public.users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          user_type: userType,
          full_name: metadata?.name || null,
          phone: metadata?.phone || null,
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        return { success: false, error: 'Failed to create user profile' };
      }

      // If email confirmation is not required, map user immediately
      if (authData.session) {
        const appUser = await mapSupabaseUserToAppUser(authData.user);
        if (appUser) {
          setUser(appUser);
          setIsAuthenticated(true);
          localStorage.setItem('currentUser', JSON.stringify(appUser));
        }
      }

      console.log('Signup successful:', { userId: authData.user.id, userType });
      return { success: true, userId: authData.user.id };
    } catch (error) {
      console.error('Unexpected signup error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Logout function with Supabase Auth
  const logout = async (): Promise<void> => {
    if (!supabase) {
      // Fallback to localStorage clear
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      localStorage.removeItem('rememberMe');
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }

      // Clear localStorage
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('vendor_session');

      // Update state
      setUser(null);
      setIsAuthenticated(false);

      console.log('Logout successful');
    } catch (error) {
      console.error('Unexpected logout error:', error);
    }
  };

  // Update user function
  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (!user || !supabase) {
      console.warn('Cannot update user: not authenticated or Supabase not available');
      return;
    }

    try {
      // Update public.users table
      const dbUpdates: Record<string, any> = {};
      if ('name' in updates) dbUpdates.name = updates.name;
      if ('companyName' in updates) dbUpdates.company_name = updates.companyName;
      if ('serviceType' in updates) dbUpdates.service_type = updates.serviceType;

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from('users')
          .update(dbUpdates)
          .eq('id', user.userId);

        if (error) {
          console.error('Error updating user profile:', error);
          return;
        }
      }

      // Update local state
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser as User);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      console.log('User updated:', updates);
    } catch (error) {
      console.error('Unexpected error updating user:', error);
    }
  };

  // Reset password function
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        return { success: false, error: error.message };
      }

      console.log('Password reset email sent to:', email);
      return { success: true };
    } catch (error) {
      console.error('Unexpected password reset error:', error);
      return { success: false, error: 'An unexpected error occurred' };
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
    signup,
    logout,
    updateUser,
    resetPassword,
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
