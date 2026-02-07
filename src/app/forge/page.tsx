'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ForgeChat } from '../../components/forge/ForgeChat';
import { useAuth } from '../../contexts/AuthContext';
import { XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function ForgePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [showVendorWarning, setShowVendorWarning] = useState(false);

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // If authenticated and is a vendor, show warning modal
    if (isAuthenticated && user?.userType === 'vendor') {
      setShowVendorWarning(true);
    }
  }, [isAuthenticated, user, isLoading]);

  const handleGoToDashboard = () => {
    router.push('/craftsmen/dashboard');
  };

  const handleLogout = async () => {
    try {
      console.log('Starting logout from forge page...');
      setShowVendorWarning(false); // Close modal first
      await logout();
      console.log('Logout complete, redirecting to /login');

      // Give a tiny delay for state to settle
      setTimeout(() => {
        window.location.href = '/login'; // Force full page navigation
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if logout fails
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen">
      <ForgeChat />

      {/* Vendor Warning Modal */}
      {showVendorWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 relative">
            {/* Close button */}
            <button
              onClick={() => setShowVendorWarning(false)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-slate-400" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white text-center mb-4">
              Vendor Account Detected
            </h2>

            {/* Message */}
            <div className="text-slate-300 text-center space-y-3 mb-6">
              <p>
                You're currently logged in as a <strong className="text-orange-400">vendor</strong> ({user?.email}).
              </p>
              <p className="text-sm">
                <strong className="text-white">Only client accounts can create events.</strong> Vendors can view events and submit bids from the vendor dashboard.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleGoToDashboard}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                <span>Go to Vendor Dashboard</span>
                <ArrowRightIcon className="w-5 h-5" />
              </button>

              <button
                onClick={handleLogout}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Logout & Create Client Account
              </button>

              <button
                onClick={() => setShowVendorWarning(false)}
                className="w-full text-slate-400 hover:text-slate-300 text-sm py-2 transition-colors"
              >
                Continue anyway (view only)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}