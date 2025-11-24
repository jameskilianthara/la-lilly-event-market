'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  SparklesIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

export default function ClientLoginPage() {
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
      const result = await login(email, password, true);

      if (result.success) {
        // Successful login - redirect to forge (event creation)
        router.push('/forge');
      } else {
        setError(result.error || 'Invalid email or password. Please check your credentials and try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-500/20 rounded-full mb-4">
            <SparklesIcon className="w-8 h-8 text-pink-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-300">
            Login to continue planning your event
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
                Email Address <span className="text-pink-400">*</span>
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
                  placeholder="your@email.com"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    fieldErrors.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-700 focus:ring-pink-500 focus:border-transparent'
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
                Password <span className="text-pink-400">*</span>
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
                      : 'border-slate-700 focus:ring-pink-500 focus:border-transparent'
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
              className={`w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-pink-500/30 transition-all duration-300 transform ${
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
                  <span>Login to Your Account</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Secondary Links */}
          <div className="mt-6 pt-6 border-t border-slate-700 space-y-3">
            <Link
              href="/signup"
              className="block text-center text-sm text-slate-400 hover:text-pink-400 transition-colors duration-200"
            >
              New to EventFoundry?{' '}
              <span className="font-medium">Create your account →</span>
            </Link>

            <Link
              href="/reset-password"
              className="block text-center text-sm text-slate-400 hover:text-pink-400 transition-colors duration-200"
            >
              Forgot your password?{' '}
              <span className="font-medium">Reset it here</span>
            </Link>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-pink-500/10 border border-pink-500/30 rounded-lg p-4">
          <p className="text-sm text-pink-200 text-center">
            🔒 Secure login for EventFoundry clients
          </p>
        </div>

        {/* Vendor Link */}
        <div className="mt-4 text-center">
          <p className="text-sm text-slate-400">
            Are you an event vendor?{' '}
            <Link
              href="/craftsmen/login"
              className="font-medium text-orange-400 hover:text-orange-300 transition-colors duration-200"
            >
              Craftsman Login →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
