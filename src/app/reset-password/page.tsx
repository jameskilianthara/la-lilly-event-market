'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  EnvelopeIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(email);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to send reset email. Please try again.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/90 backdrop-blur-lg rounded-2xl border border-slate-700 p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-10 h-10 text-green-400" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-4">
              Check Your Email
            </h1>

            <p className="text-slate-300 mb-4">
              We've sent a password reset link to:
            </p>
            <p className="text-orange-400 font-medium mb-6">
              {email}
            </p>

            <p className="text-sm text-slate-400 mb-8">
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </p>

            <div className="space-y-3">
              <Link
                href="/craftsmen/login"
                className="block w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                Return to Login
              </Link>

              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                className="block w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-300"
              >
                Send to Different Email
              </button>
            </div>
          </div>

          <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-300 text-center">
              💡 Didn't receive the email? Check your spam folder or try again in a few minutes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/20 rounded-full mb-4">
            <EnvelopeIcon className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Reset Your Password
          </h1>
          <p className="text-slate-400">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {/* Reset Card */}
        <div className="bg-slate-800/90 backdrop-blur-lg rounded-2xl border border-slate-700 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
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
                    setError('');
                  }}
                  placeholder="your@company.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Enter the email address associated with your account
              </p>
            </div>

            {/* Submit Button */}
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
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Secondary Links */}
          <div className="mt-6 pt-6 border-t border-slate-700 space-y-3">
            <Link
              href="/craftsmen/login"
              className="flex items-center justify-center space-x-2 text-sm text-slate-400 hover:text-orange-400 transition-colors duration-200"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back to Login</span>
            </Link>

            <Link
              href="/craftsmen/signup"
              className="block text-center text-sm text-slate-400 hover:text-orange-400 transition-colors duration-200"
            >
              Don't have an account?{' '}
              <span className="font-medium">Register here →</span>
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
            🔒 Secure password reset for EventFoundry accounts
          </p>
        </div>
      </div>
    </div>
  );
}
