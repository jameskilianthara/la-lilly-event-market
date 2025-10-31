'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BuildingOffice2Icon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../contexts/AuthContext';

export default function VendorLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password.trim()) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Try Supabase Auth first
      const result = await login(email, password, true);

      if (result.success) {
        // Successful login - redirect to dashboard
        router.push('/craftsmen/dashboard');
      } else {
        // Login failed - check localStorage fallback for migration
        const normalizedEmail = email.toLowerCase().trim();

        // Check active vendors in localStorage (for legacy accounts)
        const activeVendors = JSON.parse(localStorage.getItem('active_vendors') || '[]');
        const vendorByEmail = activeVendors.find((v: any) => {
          const vendorEmail = (v.email || v.contactInfo?.email || '').toLowerCase().trim();
          return vendorEmail === normalizedEmail;
        });

        if (vendorByEmail) {
          setError('Your account needs to be migrated to our new system. Please contact support at kerala@eventfoundry.com or reset your password.');
        } else {
          // Check if pending approval
          const pendingSignups = JSON.parse(localStorage.getItem('vendor_signups') || '[]');
          const pendingByEmail = pendingSignups.find((v: any) => {
            const vendorEmail = (v.email || v.contactInfo?.email || '').toLowerCase().trim();
            return vendorEmail === normalizedEmail;
          });

          if (pendingByEmail) {
            setError('Your registration is pending approval. We\'ll notify you within 24-48 hours.');
          } else {
            setError(result.error || 'Invalid email or password. Please check your credentials and try again.');
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/20 rounded-full mb-4">
            <BuildingOffice2Icon className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Event Manager Login
          </h1>
          <p className="text-slate-400">
            Access your EventFoundry dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/90 backdrop-blur-lg rounded-2xl border border-slate-700 p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Global Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start space-x-3">
                <ExclamationCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300 leading-relaxed">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors({ ...fieldErrors, email: undefined });
                    setError('');
                  }}
                  placeholder="your@company.com"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    fieldErrors.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-700 focus:ring-orange-500 focus:border-transparent'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors({ ...fieldErrors, password: undefined });
                    setError('');
                  }}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    fieldErrors.password
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-700 focus:ring-orange-500 focus:border-transparent'
                  }`}
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.password}</p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/30 transition-all duration-300 transform ${
                isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:scale-105'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Login to Dashboard</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Secondary Links */}
          <div className="mt-6 pt-6 border-t border-slate-700 space-y-3">
            <Link
              href="/craftsmen/signup"
              className="block text-center text-sm text-slate-400 hover:text-orange-400 transition-colors duration-200"
            >
              New to EventFoundry?{' '}
              <span className="font-medium">Register your company →</span>
            </Link>

            <Link
              href="/reset-password"
              className="block text-center text-sm text-slate-400 hover:text-orange-400 transition-colors duration-200"
            >
              Forgot your password?{' '}
              <span className="font-medium">Reset it here</span>
            </Link>

            <a
              href="mailto:kerala@eventfoundry.com"
              className="block text-center text-sm text-slate-400 hover:text-orange-400 transition-colors duration-200"
            >
              Need help?{' '}
              <span className="font-medium">Contact support</span>
            </a>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-300 text-center">
            🔒 Secure login for approved event management companies
          </p>
        </div>
      </div>
    </div>
  );
}
