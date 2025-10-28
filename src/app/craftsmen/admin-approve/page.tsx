'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface VendorSignup {
  id: string;
  personalInfo: {
    fullName: string;
  };
  contactInfo: {
    email: string;
    phone: string;
  };
  companyInfo: {
    businessName: string;
  };
  services: {
    eventTypes: string[];
    serviceAreas: string[];
  };
  portfolio: {
    images: string[];
  };
  createdAt: string;
}

interface ActiveVendor {
  id: string;
  email: string;
  phone: string;
  businessName: string;
  contactName: string;
  services: string[];
  serviceAreas: string[];
  portfolio: string[];
  rating: number;
  completedProjects: number;
  joinedDate: string;
  status: 'active';
}

export default function AdminApprovePage() {
  const [signups, setSignups] = useState<VendorSignup[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSignups();
  }, []);

  const loadSignups = () => {
    const stored = localStorage.getItem('vendor_signups');
    if (stored) {
      setSignups(JSON.parse(stored));
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const approveVendor = (signup: VendorSignup) => {
    // Create active vendor object
    const activeVendor: ActiveVendor = {
      id: signup.id,
      email: signup.contactInfo.email,
      phone: signup.contactInfo.phone,
      businessName: signup.companyInfo.businessName,
      contactName: signup.personalInfo.fullName,
      services: signup.services.eventTypes,
      serviceAreas: signup.services.serviceAreas,
      portfolio: signup.portfolio.images,
      rating: 0,
      completedProjects: 0,
      joinedDate: new Date().toISOString(),
      status: 'active'
    };

    // Get existing active vendors
    const activeVendorsStored = localStorage.getItem('active_vendors');
    const activeVendors: ActiveVendor[] = activeVendorsStored ? JSON.parse(activeVendorsStored) : [];

    // Add new vendor
    activeVendors.push(activeVendor);
    localStorage.setItem('active_vendors', JSON.stringify(activeVendors));

    // Remove from signups
    const updatedSignups = signups.filter(s => s.id !== signup.id);
    localStorage.setItem('vendor_signups', JSON.stringify(updatedSignups));
    setSignups(updatedSignups);

    showMessage('success', `✓ Approved ${signup.companyInfo.businessName}`);
  };

  const rejectVendor = (signup: VendorSignup) => {
    // Remove from signups
    const updatedSignups = signups.filter(s => s.id !== signup.id);
    localStorage.setItem('vendor_signups', JSON.stringify(updatedSignups));
    setSignups(updatedSignups);

    showMessage('error', `✗ Rejected ${signup.companyInfo.businessName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <UserGroupIcon className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-slate-100">Approve Pending Vendors</h1>
          </div>
          <p className="text-slate-400">Review and approve vendor signup requests</p>
        </div>

        {/* Message Toast */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border backdrop-blur-sm animate-fade-in ${
              message.type === 'success'
                ? 'bg-emerald-900/40 border-emerald-500/30 text-emerald-300'
                : 'bg-red-900/40 border-red-500/30 text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Signups List */}
        {signups.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-12 text-center">
            <UserGroupIcon className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No pending signups</h3>
            <p className="text-slate-500">All vendors have been processed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {signups.map((signup) => (
              <div
                key={signup.id}
                className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Vendor Info */}
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-100 mb-1">
                        {signup.companyInfo.businessName}
                      </h3>
                      <p className="text-slate-400 text-sm">Contact: {signup.personalInfo.fullName}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Email</p>
                        <p className="text-slate-300">{signup.contactInfo.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Phone</p>
                        <p className="text-slate-300">{signup.contactInfo.phone}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Services</p>
                      <div className="flex flex-wrap gap-2">
                        {signup.services.eventTypes.map((service, idx) => (
                          <span
                            key={idx}
                            className="bg-orange-900/30 border border-orange-500/30 text-orange-300 px-3 py-1 rounded-full text-xs font-medium"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Service Areas</p>
                      <div className="flex flex-wrap gap-2">
                        {signup.services.serviceAreas.map((area, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-700/50 border border-slate-600/50 text-slate-300 px-3 py-1 rounded-full text-xs"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Signup Date</p>
                      <p className="text-slate-400 text-sm">
                        {new Date(signup.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-3 lg:justify-center">
                    <button
                      onClick={() => approveVendor(signup)}
                      className="flex-1 lg:flex-none bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => rejectVendor(signup)}
                      className="flex-1 lg:flex-none bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 border border-slate-600 hover:border-red-500 flex items-center justify-center gap-2"
                    >
                      <XCircleIcon className="h-5 w-5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        <div className="mt-8 bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Pending approvals</span>
            <span className="text-orange-400 font-bold text-lg">{signups.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
