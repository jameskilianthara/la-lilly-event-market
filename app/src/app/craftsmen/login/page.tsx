'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BuildingOffice2Icon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowRightIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function VendorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; mobile?: string }>({});

  const validateForm = (): boolean => {
    const errors: { email?: string; mobile?: string } = {};

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Mobile validation
    if (!mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (!/^(\+91)?[6-9]\d{9}$/.test(mobile.replace(/\s/g, ''))) {
      errors.mobile = 'Please enter a valid 10-digit Indian mobile number';
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

    // Simulate network delay for better UX
    setTimeout(() => {
      // Normalize mobile number for comparison
      const normalizedMobile = mobile.replace(/\s/g, '').replace(/^\+91/, '');
      const normalizedEmail = email.toLowerCase().trim();

      // Check active vendors (approved vendors)
      const activeVendors = JSON.parse(localStorage.getItem('active_vendors') || '[]');
      const vendor = activeVendors.find((v: any) => {
        const vendorMobile = v.contactInfo?.mobile?.replace(/\s/g, '').replace(/^\+91/, '');
        const vendorEmail = v.contactInfo?.email?.toLowerCase().trim();
        return vendorEmail === normalizedEmail && vendorMobile === normalizedMobile;
      });

      if (vendor) {
        // Successful login - create session
        const session = {
          vendorId: vendor.id,
          email: normalizedEmail,
          companyName: vendor.companyInfo?.companyName,
          loginTime: new Date().toISOString()
        };

        localStorage.setItem('vendor_session', JSON.stringify(session));

        // Redirect to dashboard
        router.push('/craftsmen/dashboard');
        return;
      }

      // Check pending signups
      const pendingSignups = JSON.parse(localStorage.getItem('vendor_signups') || '[]');
      const pendingVendor = pendingSignups.find((v: any) => {
        const vendorMobile = v.contactInfo?.mobile?.replace(/\s/g, '').replace(/^\+91/, '');
        const vendorEmail = v.contactInfo?.email?.toLowerCase().trim();
        return vendorEmail === normalizedEmail && vendorMobile === normalizedMobile;
      });

      if (pendingVendor) {
        setError('Your registration is pending approval. We\'ll notify you within 24-48 hours. Please check your email for updates.');
        setIsLoading(false);
        return;
      }

      // No account found
      setError('No account found. Please check your email and mobile number, or register if you\'re new to EventFoundry.');
      setIsLoading(false);
    }, 800);
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

            {/* Mobile Number Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Mobile Number <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PhoneIcon className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    setFieldErrors({ ...fieldErrors, mobile: undefined });
                    setError('');
                  }}
                  placeholder="+91 98765 43210"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    fieldErrors.mobile
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-700 focus:ring-orange-500 focus:border-transparent'
                  }`}
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Use the mobile number you registered with
              </p>
              {fieldErrors.mobile && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.mobile}</p>
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

            <a
              href="mailto:kerala@eventfoundry.com"
              className="block text-center text-sm text-slate-400 hover:text-orange-400 transition-colors duration-200"
            >
              Forgot your details?{' '}
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
