'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'vendor' | 'client';
}

export default function ProtectedRoute({ children, requiredUserType }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not authenticated - redirect to login
        router.push('/login');
      } else if (requiredUserType && user?.userType !== requiredUserType) {
        // Wrong user type - redirect to appropriate dashboard
        if (user?.userType === 'vendor') {
          router.push('/craftsmen/dashboard');
        } else {
          router.push('/dashboard/client');
        }
      }
    }
  }, [isAuthenticated, isLoading, user, requiredUserType, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  if (requiredUserType && user?.userType !== requiredUserType) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
