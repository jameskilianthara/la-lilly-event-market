import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProtectedRoute from '@/components/ProtectedRoute';

// Mock the AuthContext
const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    reload: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Loading session...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated Users', () => {
    it('should redirect to login when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated Users - No User Type Required', () => {
    it('should render children for authenticated client user', () => {
      mockUseAuth.mockReturnValue({
        user: {
          userId: 'user-123',
          email: 'client@example.com',
          userType: 'client',
          isAuthenticated: true,
          persistent: true,
          loginTime: new Date().toISOString(),
          expiresAt: null,
        },
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should render children for authenticated vendor user', () => {
      mockUseAuth.mockReturnValue({
        user: {
          userId: 'user-456',
          email: 'vendor@example.com',
          userType: 'vendor',
          isAuthenticated: true,
          persistent: true,
          loginTime: new Date().toISOString(),
          expiresAt: null,
        },
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('User Type Requirements', () => {
    it('should render children when user type matches requirement', () => {
      mockUseAuth.mockReturnValue({
        user: {
          userId: 'user-123',
          email: 'client@example.com',
          userType: 'client',
          isAuthenticated: true,
          persistent: true,
          loginTime: new Date().toISOString(),
          expiresAt: null,
        },
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <ProtectedRoute requiredUserType="client">
          <div>Client Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Client Protected Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should redirect vendor to vendor dashboard when client access required', () => {
      mockUseAuth.mockReturnValue({
        user: {
          userId: 'user-456',
          email: 'vendor@example.com',
          userType: 'vendor',
          isAuthenticated: true,
          persistent: true,
          loginTime: new Date().toISOString(),
          expiresAt: null,
        },
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <ProtectedRoute requiredUserType="client">
          <div>Client Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockPush).toHaveBeenCalledWith('/craftsmen/dashboard');
      expect(screen.queryByText('Client Protected Content')).not.toBeInTheDocument();
    });

    it('should redirect client to client dashboard when vendor access required', () => {
      mockUseAuth.mockReturnValue({
        user: {
          userId: 'user-123',
          email: 'client@example.com',
          userType: 'client',
          isAuthenticated: true,
          persistent: true,
          loginTime: new Date().toISOString(),
          expiresAt: null,
        },
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <ProtectedRoute requiredUserType="vendor">
          <div>Vendor Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockPush).toHaveBeenCalledWith('/dashboard/client');
      expect(screen.queryByText('Vendor Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle user object being null even when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Should render since isAuthenticated is true, but user type checks should be skipped
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should handle undefined user type', () => {
      mockUseAuth.mockReturnValue({
        user: {
          userId: 'user-123',
          email: 'test@example.com',
          userType: undefined as any,
          isAuthenticated: true,
          persistent: true,
          loginTime: new Date().toISOString(),
          expiresAt: null,
        },
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <ProtectedRoute requiredUserType="client">
          <div>Client Protected Content</div>
        </ProtectedRoute>
      );

      // Should redirect since user type doesn't match
      expect(mockPush).toHaveBeenCalledWith('/dashboard/client');
    });
  });

  describe('Router Integration', () => {
    it('should not redirect during initial render when still loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should redirect after loading completes', async () => {
      // Start with loading state
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      });

      const { rerender } = render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockPush).not.toHaveBeenCalled();

      // Change to loaded but unauthenticated
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      rerender(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });
});
