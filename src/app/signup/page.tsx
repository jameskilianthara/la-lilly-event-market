'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PhoneIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

export default function ClientSignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation (optional but if provided, must be valid)
    if (formData.phone.trim() && !/^[\d\s\-\+\(\)]{10,}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setFieldErrors({ ...fieldErrors, [field]: undefined });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signup(
        formData.email.trim(),
        formData.password,
        'client',
        {
          name: formData.fullName.trim(),
          phone: formData.phone.trim() || null
        }
      );

      if (result.success) {
        // Successful signup - redirect to forge (event creation)
        router.push('/forge');
      } else {
        setError(result.error || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
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
            Create Your Account
          </h1>
          <p className="text-slate-300">
            Start planning your perfect event
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-slate-800/90 backdrop-blur-lg rounded-2xl border border-slate-700 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Global Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start space-x-3">
                <ExclamationCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300 leading-relaxed">{error}</p>
              </div>
            )}

            {/* Full Name Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name <span className="text-pink-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="John Doe"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    fieldErrors.fullName
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-700 focus:ring-pink-500 focus:border-transparent'
                  }`}
                />
              </div>
              {fieldErrors.fullName && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.fullName}</p>
              )}
            </div>

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
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
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

            {/* Phone Field (Optional) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Phone Number <span className="text-slate-500 text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PhoneIcon className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    fieldErrors.phone
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-700 focus:ring-pink-500 focus:border-transparent'
                  }`}
                />
              </div>
              {fieldErrors.phone && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.phone}</p>
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
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Min. 8 characters"
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
              <p className="mt-1 text-xs text-slate-500">
                Must contain uppercase, lowercase, and number
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password <span className="text-pink-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Re-enter password"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    fieldErrors.confirmPassword
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-700 focus:ring-pink-500 focus:border-transparent'
                  }`}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Create Account</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Secondary Links */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-pink-400 hover:text-pink-300 transition-colors duration-200"
              >
                Login here →
              </Link>
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-pink-500/10 border border-pink-500/30 rounded-lg p-4">
          <p className="text-sm text-pink-200 text-center">
            🎉 No credit card required • Start planning in 2 minutes
          </p>
        </div>

        {/* Vendor Link */}
        <div className="mt-4 text-center">
          <p className="text-sm text-slate-400">
            Are you an event vendor?{' '}
            <Link
              href="/craftsmen/signup"
              className="font-medium text-orange-400 hover:text-orange-300 transition-colors duration-200"
            >
              Register as a Craftsman →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
