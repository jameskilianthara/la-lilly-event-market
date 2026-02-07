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
      <div data-testid="user">{auth.user ? JSON.stringify({
        userId: auth.user.userId,
        email: auth.user.email,
        userType: auth.user.userType,
        isAuthenticated: auth.user.isAuthenticated
      }) : 'null'}</div>
      <div data-testid="isAuthenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="isLoading">{auth.isLoading.toString()}</div>
    </div>
  );
}

describe('Session Persistence & localStorage Sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('localStorage Sync Issues', () => {
    it('should fix currentUser vs supabase.auth.token mismatch', async () => {
      // Simulate the mismatch: localStorage has currentUser but Supabase has no session
      // This can happen when user logs out in another tab or session expires
      const staleUserData = {
        userId: 'user-123',
        email: 'stale@example.com',
        userType: 'client',
        isAuthenticated: true,
        persistent: true,
        loginTime: '2024-01-01T00:00:00.000Z',
        expiresAt: null
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(staleUserData));

      // Supabase returns no session (user logged out elsewhere)
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      // Should detect the mismatch and clear stale localStorage data
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('currentUser');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('null');

      consoleWarnSpy.mockRestore();
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      // Simulate corrupted JSON in localStorage
      localStorageMock.getItem.mockReturnValue('{invalid json');

      supabase.auth.getSession.mockRejectedValue(new Error('Supabase unavailable'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      // Should not crash and should initialize as unauthenticated
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error loading localStorage auth')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle missing localStorage data gracefully', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      supabase.auth.getSession.mockRejectedValue(new Error('Supabase unavailable'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });

    it('should handle incomplete user data in localStorage', async () => {
      // Missing required fields
      const incompleteUserData = {
        email: 'test@example.com',
        userType: 'client',
        // missing userId, isAuthenticated
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(incompleteUserData));
      supabase.auth.getSession.mockRejectedValue(new Error('Supabase unavailable'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      // Should not authenticate with incomplete data
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });
  });

  describe('Session Persistence Across Page Reloads', () => {
    it('should restore session from valid localStorage data', async () => {
      const validUserData = {
        userId: 'user-123',
        email: 'test@example.com',
        userType: 'vendor',
        isAuthenticated: true,
        persistent: true,
        loginTime: new Date().toISOString(),
        expiresAt: null
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(validUserData));
      supabase.auth.getSession.mockRejectedValue(new Error('Supabase unavailable'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      const userData = JSON.parse(screen.getByTestId('user').textContent || '{}');
      expect(userData.userId).toBe('user-123');
      expect(userData.userType).toBe('vendor');
      expect(userData.isAuthenticated).toBe(true);
    });

    it('should prioritize Supabase session over localStorage', async () => {
      // localStorage has old data
      const oldUserData = {
        userId: 'old-user',
        email: 'old@example.com',
        userType: 'client',
        isAuthenticated: true,
        persistent: true,
        loginTime: '2024-01-01T00:00:00.000Z',
        expiresAt: null
      };

      // Supabase has current session
      const currentSupabaseUser = {
        id: 'current-user',
        email: 'current@example.com'
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(oldUserData));

      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: currentSupabaseUser } },
        error: null
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { user_type: 'vendor', full_name: 'Current User' },
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
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      const userData = JSON.parse(screen.getByTestId('user').textContent || '{}');
      expect(userData.userId).toBe('current-user');
      expect(userData.email).toBe('current@example.com');
      expect(userData.userType).toBe('vendor');

      // Should update localStorage with current data
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'currentUser',
        expect.stringContaining('"userId":"current-user"')
      );
    });

    it('should handle session expiry gracefully', async () => {
      // Simulate expired session data
      const expiredUserData = {
        userId: 'user-123',
        email: 'test@example.com',
        userType: 'client',
        isAuthenticated: true,
        persistent: true,
        loginTime: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
        expiresAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() // expired 1 hour ago
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredUserData));
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      // Should clear expired session
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('currentUser');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });
  });

  describe('Token Refresh Handling', () => {
    it('should handle automatic token refresh', async () => {
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

      // Simulate token refresh event
      const refreshedUser = {
        id: 'user-123',
        email: 'refreshed@example.com'
      };

      authStateChangeCallback('TOKEN_REFRESHED', { user: refreshedUser });

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      // Should update localStorage with refreshed data
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'currentUser',
        expect.stringContaining('"userId":"user-123"')
      );
    });

    it('should handle sign out from another tab', async () => {
      // Start with authenticated user
      const userData = {
        userId: 'user-123',
        email: 'test@example.com',
        userType: 'client',
        isAuthenticated: true,
        persistent: true,
        loginTime: new Date().toISOString(),
        expiresAt: null
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(userData));

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

      // Wait for authentication
      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      // Simulate sign out from another tab
      authStateChangeCallback('SIGNED_OUT', null);

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });

      // Should clear all localStorage
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('currentUser');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('rememberMe');
    });
  });

  describe('Race Conditions', () => {
    it('should handle multiple rapid auth state changes', async () => {
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

      // Simulate rapid auth state changes
      const user1 = { id: 'user-1', email: 'user1@example.com' };
      const user2 = { id: 'user-2', email: 'user2@example.com' };

      authStateChangeCallback('SIGNED_IN', { user: user1 });
      authStateChangeCallback('SIGNED_IN', { user: user2 });
      authStateChangeCallback('SIGNED_OUT', null);

      // Should end up in the final state (signed out)
      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });
    });

    it('should handle concurrent login attempts', async () => {
      supabase.auth.signInWithPassword
        .mockResolvedValueOnce({
          data: { user: { id: 'user-1' }, session: {} },
          error: null
        })
        .mockResolvedValueOnce({
          data: { user: { id: 'user-2' }, session: {} },
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

      function LoginTestComponent() {
        const auth = useAuth();
        return (
          <div>
            <button
              data-testid="login-1"
              onClick={() => auth.login('user1@example.com', 'pass1')}
            >
              Login 1
            </button>
            <button
              data-testid="login-2"
              onClick={() => auth.login('user2@example.com', 'pass2')}
            >
              Login 2
            </button>
          </div>
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

      // Click both login buttons rapidly
      const loginBtn1 = screen.getByTestId('login-1');
      const loginBtn2 = screen.getByTestId('login-2');

      loginBtn1.click();
      loginBtn2.click();

      // Should handle concurrent requests without crashing
      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(2);
      });
    });
  });
});
