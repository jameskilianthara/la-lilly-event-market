import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
// Import the mocked supabase

// Import the mocked supabase from setup.ts
import { supabase } from '@/lib/supabase';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Test component that uses auth context
function TestComponent() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="user">{auth.user ? JSON.stringify(auth.user) : 'null'}</div>
      <div data-testid="isAuthenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="isLoading">{auth.isLoading.toString()}</div>
      <div data-testid="isVendor">{auth.isVendor.toString()}</div>
      <div data-testid="isClient">{auth.isClient.toString()}</div>
      <button data-testid="login-btn" onClick={() => auth.login('test@example.com', 'password')}>
        Login
      </button>
      <button data-testid="signup-btn" onClick={() => auth.signup('test@example.com', 'password', 'client')}>
        Signup
      </button>
      <button data-testid="logout-btn" onClick={() => auth.logout()}>
        Logout
      </button>
      <button data-testid="reset-btn" onClick={() => auth.resetPassword('test@example.com')}>
        Reset Password
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should initialize with loading state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('isLoading')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });

    it('should initialize from Supabase session', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      };
      const mockSession = { user: mockUser };

      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { user_type: 'client', full_name: 'Test User' },
              error: null
            })
          })
        })
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('isClient')).toHaveTextContent('true');
      });

      // Check localStorage was updated
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'currentUser',
        expect.stringContaining('"userId":"user-123"')
      );
    });

    it('should fallback to localStorage when Supabase fails', async () => {
      const storedUser = {
        userId: 'user-123',
        email: 'test@example.com',
        userType: 'vendor',
        isAuthenticated: true,
        persistent: true,
        loginTime: new Date().toISOString(),
        expiresAt: null
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedUser));
      supabase.auth.getSession.mockRejectedValue(new Error('Supabase unavailable'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('isVendor')).toHaveTextContent('true');
      });
    });

    it('should handle localStorage corruption gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      supabase.auth.getSession.mockRejectedValue(new Error('Supabase unavailable'));

      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Login Flow', () => {
    it('should handle successful login', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { user_type: 'client', full_name: 'Test User' },
              error: null
            })
          })
        })
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const loginBtn = screen.getByTestId('login-btn');
      loginBtn.click();

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('isClient')).toHaveTextContent('true');
      });

      // Verify localStorage was updated
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'currentUser',
        expect.stringContaining('"userId":"user-123"')
      );
    });

    it('should handle login errors', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' }
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const loginBtn = screen.getByTestId('login-btn');
      loginBtn.click();

      // State should remain unchanged
      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });
    });

    it('should handle remember me functionality', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { user_type: 'client', full_name: 'Test User' },
              error: null
            })
          })
        })
      });

      // Test component that calls login with rememberMe
      function LoginTestComponent() {
        const auth = useAuth();
        return (
          <button
            data-testid="login-remember-btn"
            onClick={() => auth.login('test@example.com', 'password', true)}
          >
            Login with Remember
          </button>
        );
      }

      render(
        <AuthProvider>
          <LoginTestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const loginBtn = screen.getByTestId('login-remember-btn');
      loginBtn.click();

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('rememberMe', 'true');
      });
    });
  });

  describe('Signup Flow', () => {
    it('should handle successful signup', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      };

      supabase.auth.signUp.mockResolvedValue({
        data: {
          user: mockUser,
          session: {}
        },
        error: null
      });

      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-123', email: 'test@example.com', user_type: 'client' },
              error: null
            })
          })
        })
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const signupBtn = screen.getByTestId('signup-btn');
      signupBtn.click();

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });
    });

    it('should handle signup errors', async () => {
      supabase.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Email already exists' }
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const signupBtn = screen.getByTestId('signup-btn');
      signupBtn.click();

      // Should remain unauthenticated
      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });
    });
  });

  describe('Logout Flow', () => {
    it('should handle successful logout', async () => {
      // First set up authenticated state
      const storedUser = {
        userId: 'user-123',
        email: 'test@example.com',
        userType: 'client',
        isAuthenticated: true,
        persistent: true,
        loginTime: new Date().toISOString(),
        expiresAt: null
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedUser));
      supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });

      supabase.auth.signOut.mockResolvedValue({ error: null });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for authentication to be restored
      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      const logoutBtn = screen.getByTestId('logout-btn');
      logoutBtn.click();

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });

      // Verify localStorage cleanup
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('currentUser');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('rememberMe');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('vendor_session');
    });

    it('should handle logout when Supabase is unavailable', async () => {
      // First set up authenticated state
      const storedUser = {
        userId: 'user-123',
        email: 'test@example.com',
        userType: 'client',
        isAuthenticated: true,
        persistent: true,
        loginTime: new Date().toISOString(),
        expiresAt: null
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedUser));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for authentication to be restored
      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      const logoutBtn = screen.getByTestId('logout-btn');
      logoutBtn.click();

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });

      // Should still clear localStorage
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('currentUser');
    });
  });

  describe('Password Reset', () => {
    it('should handle password reset request', async () => {
      supabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const resetBtn = screen.getByTestId('reset-btn');
      resetBtn.click();

      await waitFor(() => {
        expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          'test@example.com',
          { redirectTo: expect.stringContaining('/reset-password') }
        );
      });
    });
  });

  describe('Auth State Persistence', () => {
    it('should persist user state across component re-renders', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      };

      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { user_type: 'vendor', full_name: 'Test Vendor' },
              error: null
            })
          })
        })
      });

      const { rerender } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('isVendor')).toHaveTextContent('true');
      });

      // Rerender and check persistence
      rerender(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('isVendor')).toHaveTextContent('true');
    });

    it('should handle localStorage sync issues', async () => {
      // Simulate localStorage being out of sync with Supabase
      const localStorageUser = {
        userId: 'user-123',
        email: 'test@example.com',
        userType: 'client',
        isAuthenticated: true,
        persistent: true,
        loginTime: new Date().toISOString(),
        expiresAt: null
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(localStorageUser));

      // Supabase returns no session (user logged out elsewhere)
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      // Should clear stale localStorage data and set unauthenticated state
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('currentUser');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');

      consoleSpy.mockRestore();
    });
  });

  describe('Token Refresh', () => {
    it('should handle auth state changes from Supabase', async () => {
      let authStateChangeCallback: any;

      supabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateChangeCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { user_type: 'client', full_name: 'Test User' },
              error: null
            })
          })
        })
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      // Simulate SIGNED_IN event
      const mockUser = { id: 'user-456', email: 'new@example.com' };
      authStateChangeCallback('SIGNED_IN', { user: mockUser });

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      // Simulate SIGNED_OUT event
      authStateChangeCallback('SIGNED_OUT', null);

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });

      // Verify localStorage cleanup
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('currentUser');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('rememberMe');
    });
  });

  describe('Error Handling', () => {
    it('should handle Supabase initialization failure gracefully', async () => {
      // Mock supabase being undefined
      vi.mocked(supabase).auth.getSession.mockRejectedValue(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });

      consoleSpy.mockRestore();
    });

    it('should handle user profile fetch failures', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      };

      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null
      });

      // Mock profile fetch failure
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Profile not found' }
            })
          })
        })
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });

      consoleSpy.mockRestore();
    });
  });
});
