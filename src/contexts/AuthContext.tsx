'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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
  children: React.ReactNode;
}

// Helper: Convert Supabase user + metadata to our User type
// VERIFIED: Only queries existing fields from users table (user_type, full_name)
async function mapSupabaseUserToAppUser(supabaseClient: SupabaseClient, supabaseUser: SupabaseUser): Promise<User | null> {
  if (!supabaseClient) {
    console.error('mapSupabaseUserToAppUser: Supabase client not available');
    return null;
  }

  try {
    console.log('mapSupabaseUserToAppUser: Fetching profile for user:', supabaseUser.id);

    // Fetch user profile from public.users table
    // Note: users table only has id, email, user_type, full_name, phone, created_at
    const { data: profile, error } = await supabaseClient
      .from('users')
      .select('user_type, full_name')
      .eq('id', supabaseUser.id)
      .single() as { data: { user_type: string; full_name: string | null } | null; error: any };

    if (error) {
      console.error('Error fetching user profile:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        fullError: JSON.stringify(error)
      });

      // If RLS policy blocks read, try to use auth metadata as fallback
      console.warn('Falling back to auth metadata for user type');
      const userTypeFromMeta = supabaseUser.user_metadata?.user_type;

      if (userTypeFromMeta) {
        console.log('Using user_type from auth metadata:', userTypeFromMeta);
        const baseUser = {
          userId: supabaseUser.id,
          email: supabaseUser.email!,
          isAuthenticated: true as const,
          persistent: true,
          loginTime: new Date().toISOString(),
          expiresAt: null as null,
        };

        if (userTypeFromMeta === 'vendor') {
          return {
            ...baseUser,
            userType: 'vendor',
            companyName: undefined,
            serviceType: undefined,
          } as VendorUser;
        } else {
          return {
            ...baseUser,
            userType: 'client',
            name: supabaseUser.user_metadata?.name || undefined,
          } as ClientUser;
        }
      }

      return null;
    }

    if (!profile) {
      console.error('No profile found for user:', supabaseUser.id);
      return null;
    }

    console.log('Profile fetched successfully:', {
      userId: supabaseUser.id,
      userType: profile.user_type,
      hasName: !!profile.full_name
    });

    const baseUser = {
      userId: supabaseUser.id,
      email: supabaseUser.email!,
      isAuthenticated: true as const,
      persistent: true,
      loginTime: new Date().toISOString(),
      expiresAt: null as null,
    };

    if (profile.user_type === 'vendor') {
      // Note: company_name and service_type are in vendors table, not users table
      // They should be fetched separately if needed
      return {
        ...baseUser,
        userType: 'vendor',
        companyName: undefined,
        serviceType: undefined,
      } as VendorUser;
    } else {
      return {
        ...baseUser,
        userType: 'client',
        name: profile.full_name || undefined,
      } as ClientUser;
    }
  } catch (error) {
    console.error('Error mapping Supabase user:', error);
    return null;
  }
}

// Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Use the singleton Supabase client from lib/supabase.ts
  // Make Supabase client available globally for debugging (development only)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).supabase = supabase;
  }
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
          const appUser = await mapSupabaseUserToAppUser(supabase, session.user);
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
          // Supabase has no session - clear any stale localStorage data
          // This fixes the currentUser vs supabase.auth.token mismatch
          console.warn('Supabase returned no session, clearing stale localStorage data');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('authToken');
          localStorage.removeItem('rememberMe');
          setUser(null);
          setIsAuthenticated(false);
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
          const appUser = await mapSupabaseUserToAppUser(supabase, session.user);
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
      console.log('Attempting login for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login response:', {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error?.message
      });

      if (error) {
        console.error('Login error:', error);

        // Provide user-friendly error messages
        let errorMessage = error.message;
        if (error.message.toLowerCase().includes('invalid login credentials') ||
            error.message.toLowerCase().includes('invalid email or password')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          errorMessage = 'Please confirm your email address before logging in.';
        }

        return { success: false, error: errorMessage };
      }

      if (!data.user) {
        console.error('Login failed: No user in response');
        return { success: false, error: 'Login failed - no user returned' };
      }

      console.log('Fetching user profile for:', data.user.id);
      const appUser = await mapSupabaseUserToAppUser(supabase, data.user);

      if (!appUser) {
        console.error('Failed to map user profile');
        return { success: false, error: 'User profile not found. Please ensure your account is properly set up.' };
      }

      // Update state immediately
      setUser(appUser);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(appUser));

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      console.log('Login successful:', {
        userId: appUser.userId,
        userType: appUser.userType,
        email: appUser.email
      });

      return { success: true };
    } catch (error) {
      console.error('Unexpected login error:', error);
      return { success: false, error: 'An unexpected error occurred during login. Please try again.' };
    }
  };

  // Signup function with Supabase Auth
  const signup = async (
    email: string,
    password: string,
    userType: 'vendor' | 'client',
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; userId?: string; error?: string }> => {
    console.log('[AuthContext signup] Starting signup for:', email, 'userType:', userType);

    if (!supabase) {
      console.error('[AuthContext signup] Supabase client not initialized');
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      // Sign up with Supabase Auth
      console.log('[AuthContext signup] Calling supabase.auth.signUp...');
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

      console.log('[AuthContext signup] signUp response:', {
        hasUser: !!authData?.user,
        hasSession: !!authData?.session,
        userId: authData?.user?.id,
        error: authError?.message
      });

      if (authError) {
        console.error('[AuthContext signup] Signup error:', authError);

        // Provide user-friendly error messages
        let errorMessage = authError.message;
        if (authError.message.toLowerCase().includes('already registered') ||
            authError.message.toLowerCase().includes('already exists') ||
            authError.message.toLowerCase().includes('duplicate')) {
          errorMessage = 'This email is already registered. Please login instead.';
        }

        return { success: false, error: errorMessage };
      }

      if (!authData.user) {
        console.error('[AuthContext signup] No user in signup response');
        return { success: false, error: 'Signup failed' };
      }

      // Create user profile in public.users table
      console.log('[AuthContext signup] Creating user profile in users table...');
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          user_type: userType,
          full_name: metadata?.name || null,
          phone: metadata?.phone || null,
        })
        .select()
        .single();

      console.log('[AuthContext signup] User profile insert response:', {
        hasData: !!profileData,
        error: profileError?.message
      });

      if (profileError) {
        console.error('[AuthContext signup] Error creating user profile:', {
          error: profileError,
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        return {
          success: false,
          error: `Failed to create user profile: ${profileError.message || 'Unknown error'}. This may be a permissions issue.`
        };
      }

      console.log('[AuthContext signup] ✅ User profile created successfully:', profileData);

      // If email confirmation is not required, map user immediately
      if (authData.session) {
        console.log('[AuthContext signup] Session exists, mapping user...');
        const appUser = await mapSupabaseUserToAppUser(supabase, authData.user);
        if (appUser) {
          setUser(appUser);
          setIsAuthenticated(true);
          localStorage.setItem('currentUser', JSON.stringify(appUser));
          console.log('[AuthContext signup] ✅ User mapped and stored');
        } else {
          console.warn('[AuthContext signup] Failed to map user');
        }
      } else {
        console.log('[AuthContext signup] No session - email confirmation may be required');
      }

      console.log('[AuthContext signup] ✅ Signup successful:', { userId: authData.user.id, userType });
      return { success: true, userId: authData.user.id };
    } catch (error) {
      console.error('[AuthContext signup] Unexpected signup error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Logout function with Supabase Auth
  const logout = async (): Promise<void> => {
    console.log('[AuthContext] Starting logout...');

    // Immediately clear state first to prevent any race conditions
    setUser(null);
    setIsAuthenticated(false);

    // Clear all localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('vendor_session');

    if (!supabase) {
      console.log('[AuthContext] Logout complete (no Supabase)');
      return;
    }

    try {
      // Clear Supabase session
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthContext] Logout error:', error);
      } else {
        console.log('[AuthContext] Supabase signOut successful');
      }
    } catch (error) {
      console.error('[AuthContext] Unexpected logout error:', error);
    }

    console.log('[AuthContext] Logout complete');
  };

  // Update user function
  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (!user || !supabase) {
      console.warn('Cannot update user: not authenticated or Supabase not available');
      return;
    }

    try {
      // Update public.users table (only has user_type, full_name, phone)
      const dbUpdates: Record<string, any> = {};
      if ('name' in updates) dbUpdates.full_name = updates.name;
      // Note: companyName and serviceType are in vendors table, not users table

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
