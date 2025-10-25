'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  InformationCircleIcon,
  PencilSquareIcon,
  LinkIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface VendorProfile {
  slug: string;
  logo: string;
  tagline: string;
  bio: string;
  yearsInBusiness: number;
  serviceTypes: string[];
  specializations: string[];
  primaryCity: string;
  serviceAreas: string[];
  portfolioImages: Array<{
    url: string;
    title: string;
    description: string;
    category: string;
    eventDate?: string;
  }>;
  pricingDisplay: {
    showPricing: boolean;
    startingPrice?: number;
  };
  packages: Array<{
    name: string;
    description: string;
    price: number;
    features: string[];
  }>;
  website: string;
  instagram: string;
  facebook: string;
  showEmail: boolean;
  showPhone: boolean;
  isPublic: boolean;
  stats: {
    totalProjects: number;
    avgRating: number;
    reviewCount: number;
    repeatClients: number;
  };
}

interface VendorSession {
  vendorId: string;
  businessName: string;
}

export default function ProfilePreviewPage() {
  const router = useRouter();
  const [vendor, setVendor] = useState<any>(null);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    // Get vendor session
    const sessionStr = localStorage.getItem('vendor_session');
    if (!sessionStr) {
      router.push('/craftsmen/login');
      return;
    }

    const session: VendorSession = JSON.parse(sessionStr);

    // Get vendor data
    const activeVendors = JSON.parse(localStorage.getItem('active_vendors') || '[]');
    const vendorData = activeVendors.find((v: any) => v.id === session.vendorId);

    if (!vendorData || !vendorData.profile) {
      router.push('/craftsmen/dashboard/profile/edit');
      return;
    }

    setVendor(vendorData);
    setProfile(vendorData.profile);
    setIsPublic(vendorData.profile.isPublic || false);
  }, [router]);

  const displayToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const togglePublic = () => {
    if (!vendor || !profile) return;

    const newPublicState = !isPublic;

    // Update localStorage
    const activeVendors = JSON.parse(localStorage.getItem('active_vendors') || '[]');
    const updatedVendors = activeVendors.map((v: any) => {
      if (v.id === vendor.id) {
        return {
          ...v,
          profile: {
            ...v.profile,
            isPublic: newPublicState
          }
        };
      }
      return v;
    });

    localStorage.setItem('active_vendors', JSON.stringify(updatedVendors));
    setIsPublic(newPublicState);
    setProfile({ ...profile, isPublic: newPublicState });

    displayToast(
      newPublicState
        ? '✅ Profile is now public - clients can discover you!'
        : '🔒 Profile is now private',
      'success'
    );
  };

  const copyProfileLink = () => {
    if (!profile?.slug) return;

    const profileUrl = `${window.location.origin}/vendor/${profile.slug}`;
    navigator.clipboard.writeText(profileUrl);
    displayToast('✅ Profile link copied to clipboard!', 'success');
  };

  if (!vendor || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading preview...</p>
        </div>
      </div>
    );
  }

  const profileUrl = `/vendor/${profile.slug}`;
  const fullProfileUrl = typeof window !== 'undefined' ? `${window.location.origin}${profileUrl}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 right-6 z-[100] animate-slide-in-right">
          <div className={`px-6 py-4 rounded-lg shadow-2xl border backdrop-blur-lg ${
            toastType === 'success'
              ? 'bg-green-500/20 border-green-500/30 text-green-300'
              : 'bg-red-500/20 border-red-500/30 text-red-300'
          }`}>
            <div className="flex items-center space-x-3">
              {toastType === 'success' ? (
                <CheckCircleIcon className="w-6 h-6 flex-shrink-0" />
              ) : (
                <ExclamationTriangleIcon className="w-6 h-6 flex-shrink-0" />
              )}
              <p className="font-medium">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Mode Banner - Sticky */}
      <div className="sticky top-[72px] z-40 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-500/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Info */}
            <div className="flex items-center space-x-3">
              <InformationCircleIcon className="w-6 h-6 text-blue-200 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold text-sm sm:text-base">
                  Preview Mode
                </p>
                <p className="text-blue-100 text-xs sm:text-sm">
                  See how clients view your profile
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Edit Profile Button */}
              <Link
                href="/craftsmen/dashboard/profile/edit"
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg border border-white/30 transition-all duration-200 backdrop-blur-sm"
              >
                <PencilSquareIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </Link>

              {/* Make Public/Private Toggle */}
              <button
                onClick={togglePublic}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 backdrop-blur-sm ${
                  isPublic
                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-100 border-green-400/30'
                    : 'bg-slate-500/20 hover:bg-slate-500/30 text-slate-100 border-slate-400/30'
                }`}
              >
                {isPublic ? (
                  <EyeIcon className="w-4 h-4" />
                ) : (
                  <EyeSlashIcon className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{isPublic ? 'Public' : 'Private'}</span>
              </button>

              {/* Copy Link Button */}
              <button
                onClick={copyProfileLink}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-100 text-sm font-medium rounded-lg border border-orange-400/30 transition-all duration-200 backdrop-blur-sm"
              >
                <LinkIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Private Profile Warning */}
      {!isPublic && (
        <div className="bg-yellow-500/10 border-y border-yellow-500/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-200 font-semibold text-sm sm:text-base">
                  Your profile is currently private
                </p>
                <p className="text-yellow-300/80 text-xs sm:text-sm mt-1">
                  Clients cannot discover or view your profile. Toggle &quot;Make Public&quot; above to start receiving inquiries.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Preview Content - Embedded iframe-style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl">
          {/* Preview Header */}
          <div className="bg-slate-700/30 border-b border-slate-600/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">Client View</p>
                <p className="text-slate-400 text-sm mt-0.5">
                  This is how your profile appears to potential clients
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span className="px-3 py-1.5 bg-slate-600/30 rounded-full border border-slate-500/30">
                  {fullProfileUrl}
                </span>
              </div>
            </div>
          </div>

          {/* Actual Profile Content */}
          <div className="bg-white">
            <ProfilePreviewContent vendor={vendor} profile={profile} />
          </div>
        </div>

        {/* Footer Tips */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-300 font-semibold text-sm mb-2">💡 Quick Tip</p>
            <p className="text-blue-200/80 text-xs">
              Share your profile link on social media, business cards, and email signatures to attract more clients.
            </p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <p className="text-orange-300 font-semibold text-sm mb-2">🎯 Pro Tip</p>
            <p className="text-orange-200/80 text-xs">
              Keep your profile updated with your latest work and projects to maintain high search rankings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simplified profile content component (matching public vendor page but in preview context)
function ProfilePreviewContent({ vendor, profile }: { vendor: any; profile: VendorProfile }) {
  const businessName = vendor.businessName || vendor.companyInfo?.businessName || 'Vendor';
  const contactEmail = vendor.email || vendor.contactInfo?.email || '';
  const contactPhone = vendor.phone || vendor.contactInfo?.phone || vendor.contactInfo?.mobile || '';

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            {/* Logo */}
            {profile.logo && (
              <div className="flex-shrink-0">
                <img
                  src={profile.logo}
                  alt={businessName}
                  className="w-24 h-24 rounded-xl object-cover border-4 border-white/20 shadow-xl"
                />
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{businessName}</h1>
              {profile.tagline && (
                <p className="text-lg text-blue-200 mb-4">{profile.tagline}</p>
              )}

              {/* Service Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.serviceTypes.slice(0, 3).map((service, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-orange-500/20 text-orange-200 text-sm font-medium rounded-full border border-orange-400/30"
                  >
                    {service}
                  </span>
                ))}
              </div>

              {/* Location & Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                <span>📍 {profile.primaryCity}</span>
                {profile.yearsInBusiness > 0 && (
                  <span>⏱️ {profile.yearsInBusiness}+ years</span>
                )}
                {profile.stats?.avgRating > 0 && (
                  <span>⭐ {profile.stats.avgRating.toFixed(1)} ({profile.stats.reviewCount} reviews)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">About Us</h2>
        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>

        {profile.specializations.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Specializations</h3>
            <div className="flex flex-wrap gap-2">
              {profile.specializations.map((spec, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg border border-slate-200"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Portfolio Section */}
      {profile.portfolioImages.length > 0 && (
        <div className="bg-slate-50 border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Portfolio</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {profile.portfolioImages.slice(0, 8).map((img, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-shadow duration-200"
                >
                  <img
                    src={img.url}
                    alt={img.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pricing/Packages Section */}
      {(profile.pricingDisplay.showPricing || profile.packages.length > 0) && (
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Pricing & Packages</h2>

          {profile.packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.packages.map((pkg, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-200"
                >
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{pkg.name}</h3>
                  <p className="text-2xl font-bold text-orange-600 mb-4">
                    ₹{pkg.price.toLocaleString('en-IN')}
                  </p>
                  <p className="text-slate-600 text-sm mb-4">{pkg.description}</p>
                  <ul className="space-y-2">
                    {pkg.features.map((feature, fIdx) => (
                      <li key={fIdx} className="text-sm text-slate-700 flex items-start">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : profile.pricingDisplay.startingPrice ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <p className="text-slate-700 mb-2">Starting from</p>
              <p className="text-3xl font-bold text-orange-600">
                ₹{profile.pricingDisplay.startingPrice.toLocaleString('en-IN')}
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Contact Section */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-blue-200">
                Ready to bring your event vision to life? Contact us to discuss your requirements.
              </p>
              {profile.showEmail && contactEmail && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Email</p>
                  <a href={`mailto:${contactEmail}`} className="text-orange-400 hover:text-orange-300">
                    {contactEmail}
                  </a>
                </div>
              )}
              {profile.showPhone && contactPhone && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Phone</p>
                  <a href={`tel:${contactPhone}`} className="text-orange-400 hover:text-orange-300">
                    {contactPhone}
                  </a>
                </div>
              )}
              {profile.website && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Website</p>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-400 hover:text-orange-300"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
