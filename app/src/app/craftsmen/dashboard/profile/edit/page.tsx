'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  PhotoIcon,
  PlusIcon,
  XMarkIcon,
  GlobeAltIcon,
  ShareIcon,
  EyeIcon,
  CloudArrowUpIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface PortfolioImage {
  id: string;
  url: string;
  caption: string;
  category: 'Wedding' | 'Corporate' | 'Birthday' | 'Other';
  uploadedAt: string;
}

interface Package {
  id: string;
  name: string;
  price: number;
  description: string;
  inclusions: string[];
}

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
  address: string;
  portfolioImages: PortfolioImage[];
  pricingDisplay: {
    showPricing: boolean;
    startingPrice: number;
    currency: string;
    pricingNote: string;
  };
  website: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
  showEmail: boolean;
  showPhone: boolean;
  packages: Package[];
  isPublic: boolean;
  metaDescription: string;
  keywords: string;
  completionScore: number;
}

const SERVICE_TYPES = [
  'Event Management'
];

const SPECIALIZATIONS = [
  'Wedding Planning',
  'Corporate Events',
  'Social Celebrations',
  'Destination Events',
  'Luxury Event Management',
  'Budget-Friendly Events',
  'Cultural Events',
  'Theme-Based Events',
  'Product Launches',
  'Conferences & Seminars',
  'Private Parties',
  'Festival Management'
];

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Navi Mumbai', 'Thane',
  'Gurgaon', 'Noida', 'Goa'
];

export default function VendorProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [vendorSession, setVendorSession] = useState<any>(null);

  const [profile, setProfile] = useState<VendorProfile>({
    slug: '',
    logo: '',
    tagline: '',
    bio: '',
    yearsInBusiness: 0,
    serviceTypes: [],
    specializations: [],
    primaryCity: '',
    serviceAreas: [],
    address: '',
    portfolioImages: [],
    pricingDisplay: {
      showPricing: false,
      startingPrice: 0,
      currency: 'INR',
      pricingNote: ''
    },
    website: '',
    instagram: '',
    facebook: '',
    whatsapp: '',
    showEmail: true,
    showPhone: true,
    packages: [],
    isPublic: false,
    metaDescription: '',
    keywords: '',
    completionScore: 0
  });

  const [newSpecialization, setNewSpecialization] = useState('');
  const [activeSection, setActiveSection] = useState('basic');

  useEffect(() => {
    loadProfile();
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (profile.slug) {
        autoSave();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [profile]);

  const loadProfile = () => {
    try {
      const session = JSON.parse(localStorage.getItem('vendor_session') || '{}');
      if (!session.vendorId) {
        router.push('/craftsmen/login');
        return;
      }

      setVendorSession(session);

      // Load active vendors
      const activeVendors = JSON.parse(localStorage.getItem('active_vendors') || '[]');
      const vendor = activeVendors.find((v: any) => v.id === session.vendorId);

      if (vendor) {
        // If vendor has profile, load it; otherwise initialize
        if (vendor.profile) {
          setProfile({ ...vendor.profile, completionScore: calculateCompletion(vendor.profile) });
        } else {
          // Initialize profile with slug from business name
          const initialSlug = generateSlug(vendor.businessName || vendor.companyInfo?.businessName || 'vendor');
          setProfile(prev => ({
            ...prev,
            slug: initialSlug,
            whatsapp: vendor.phone || vendor.contactInfo?.phone || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string): string => {
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check uniqueness
    const activeVendors = JSON.parse(localStorage.getItem('active_vendors') || '[]');
    const existingSlugs = activeVendors
      .filter((v: any) => v.id !== vendorSession?.vendorId)
      .map((v: any) => v.profile?.slug)
      .filter(Boolean);

    let finalSlug = slug;
    let counter = 1;

    while (existingSlugs.includes(finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    return finalSlug;
  };

  const calculateCompletion = (prof: VendorProfile): number => {
    let score = 0;
    if (prof.logo) score += 10;
    if (prof.tagline) score += 5;
    if (prof.bio && prof.bio.length >= 50) score += 15;
    if (prof.yearsInBusiness) score += 5;
    if (prof.serviceTypes.length >= 2) score += 10;
    if (prof.specializations.length >= 3) score += 10;
    if (prof.portfolioImages.length >= 3) score += 20;
    if (prof.portfolioImages.length >= 10) score += 10;
    if (prof.website || prof.instagram) score += 10;
    if (prof.packages && prof.packages.length > 0) score += 5;
    return Math.min(score, 100);
  };

  const autoSave = async () => {
    try {
      setSaving(true);
      await saveProfile(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async (showToast = true) => {
    try {
      const activeVendors = JSON.parse(localStorage.getItem('active_vendors') || '[]');
      const vendorIndex = activeVendors.findIndex((v: any) => v.id === vendorSession.vendorId);

      if (vendorIndex !== -1) {
        // Always ensure service type is set to Event Management
        const updatedProfile = {
          ...profile,
          serviceTypes: ['Event Management'],
          completionScore: calculateCompletion(profile)
        };
        activeVendors[vendorIndex].profile = updatedProfile;
        localStorage.setItem('active_vendors', JSON.stringify(activeVendors));

        setProfile(updatedProfile);

        if (showToast) {
          setToast({ message: 'Profile updated successfully! ✅', type: 'success' });
          setTimeout(() => setToast(null), 3000);
        }
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      if (showToast) {
        setToast({ message: 'Error saving profile', type: 'error' });
        setTimeout(() => setToast(null), 3000);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await saveProfile(true);
    setSaving(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (profile.portfolioImages.length >= 20) {
      setToast({ message: 'Maximum 20 images allowed', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        setToast({ message: 'Image size should be less than 2MB', type: 'error' });
        setTimeout(() => setToast(null), 3000);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage: PortfolioImage = {
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: event.target?.result as string,
          caption: '',
          category: 'Other',
          uploadedAt: new Date().toISOString()
        };

        setProfile(prev => ({
          ...prev,
          portfolioImages: [...prev.portfolioImages, newImage]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (imageId: string) => {
    setProfile(prev => ({
      ...prev,
      portfolioImages: prev.portfolioImages.filter(img => img.id !== imageId)
    }));
  };

  const updateImageCaption = (imageId: string, caption: string) => {
    setProfile(prev => ({
      ...prev,
      portfolioImages: prev.portfolioImages.map(img =>
        img.id === imageId ? { ...img, caption } : img
      )
    }));
  };

  const updateImageCategory = (imageId: string, category: PortfolioImage['category']) => {
    setProfile(prev => ({
      ...prev,
      portfolioImages: prev.portfolioImages.map(img =>
        img.id === imageId ? { ...img, category } : img
      )
    }));
  };

  const addSpecialization = () => {
    if (!newSpecialization.trim()) return;
    if (profile.specializations.length >= 10) {
      setToast({ message: 'Maximum 10 specializations allowed', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setProfile(prev => ({
      ...prev,
      specializations: [...prev.specializations, newSpecialization.trim()]
    }));
    setNewSpecialization('');
  };

  const removeSpecialization = (spec: string) => {
    setProfile(prev => ({
      ...prev,
      specializations: prev.specializations.filter(s => s !== spec)
    }));
  };

  const addPackage = () => {
    const newPackage: Package = {
      id: `pkg-${Date.now()}`,
      name: '',
      price: 0,
      description: '',
      inclusions: ['']
    };

    setProfile(prev => ({
      ...prev,
      packages: [...prev.packages, newPackage]
    }));
  };

  const updatePackage = (packageId: string, field: keyof Package, value: any) => {
    setProfile(prev => ({
      ...prev,
      packages: prev.packages.map(pkg =>
        pkg.id === packageId ? { ...pkg, [field]: value } : pkg
      )
    }));
  };

  const removePackage = (packageId: string) => {
    setProfile(prev => ({
      ...prev,
      packages: prev.packages.filter(pkg => pkg.id !== packageId)
    }));
  };

  const addInclusion = (packageId: string) => {
    setProfile(prev => ({
      ...prev,
      packages: prev.packages.map(pkg =>
        pkg.id === packageId ? { ...pkg, inclusions: [...pkg.inclusions, ''] } : pkg
      )
    }));
  };

  const updateInclusion = (packageId: string, index: number, value: string) => {
    setProfile(prev => ({
      ...prev,
      packages: prev.packages.map(pkg =>
        pkg.id === packageId
          ? { ...pkg, inclusions: pkg.inclusions.map((inc, i) => i === index ? value : inc) }
          : pkg
      )
    }));
  };

  const removeInclusion = (packageId: string, index: number) => {
    setProfile(prev => ({
      ...prev,
      packages: prev.packages.map(pkg =>
        pkg.id === packageId
          ? { ...pkg, inclusions: pkg.inclusions.filter((_, i) => i !== index) }
          : pkg
      )
    }));
  };

  const copyProfileLink = () => {
    const link = `${window.location.origin}/vendor/${profile.slug}`;
    navigator.clipboard.writeText(link);
    setToast({ message: 'Profile link copied! 📋', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  const completionScore = calculateCompletion(profile);
  const sections = [
    { id: 'basic', name: 'Basic Information', icon: '📝' },
    { id: 'services', name: 'Services', icon: '⚙️' },
    { id: 'location', name: 'Location', icon: '📍' },
    { id: 'portfolio', name: 'Portfolio', icon: '📸' },
    { id: 'pricing', name: 'Pricing', icon: '💰' },
    { id: 'packages', name: 'Packages', icon: '📦' },
    { id: 'social', name: 'Social & Contact', icon: '🔗' },
    { id: 'seo', name: 'SEO Settings', icon: '🔍' },
    { id: 'settings', name: 'Profile Settings', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/craftsmen/dashboard"
            className="inline-flex items-center space-x-2 text-slate-300 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
              <p className="text-slate-400">Build your professional presence on EventFoundry</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/craftsmen/dashboard/profile/preview"
                className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                <EyeIcon className="w-5 h-5" />
                <span>Preview</span>
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Completion Score */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-6 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-semibold text-white">Profile Completion</span>
            <span className="text-2xl font-bold text-orange-400">{completionScore}%</span>
          </div>
          <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
              style={{ width: `${completionScore}%` }}
            />
          </div>
          {lastSaved && (
            <p className="text-xs text-slate-400 mt-2">
              Last saved: {new Date(lastSaved).toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 sticky top-6">
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      activeSection === section.id
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        : 'text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    <span className="text-sm font-medium">{section.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Basic Information */}
            {activeSection === 'basic' && (
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Basic Information</h2>

                <div className="space-y-6">
                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Company Logo (Optional)
                    </label>
                    <div className="flex items-center space-x-4">
                      {profile.logo ? (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-700/50">
                          <img src={profile.logo} alt="Logo" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setProfile(prev => ({ ...prev, logo: '' }))}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                          >
                            <XMarkIcon className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-600 hover:border-orange-500 flex items-center justify-center cursor-pointer transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  setProfile(prev => ({ ...prev, logo: event.target?.result as string }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <PhotoIcon className="w-8 h-8 text-slate-500" />
                        </label>
                      )}
                      <div className="text-sm text-slate-400">
                        <p>Upload your company logo</p>
                        <p className="text-xs">Max 2MB, PNG or JPG</p>
                      </div>
                    </div>
                  </div>

                  {/* Tagline */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Tagline <span className="text-orange-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={profile.tagline}
                      onChange={(e) => setProfile(prev => ({ ...prev, tagline: e.target.value.slice(0, 100) }))}
                      placeholder="e.g., Creating memorable culinary experiences"
                      maxLength={100}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">{profile.tagline.length}/100 characters</p>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      About Your Business <span className="text-orange-400">*</span>
                    </label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value.slice(0, 500) }))}
                      placeholder="Tell clients about your business, experience, and what makes you unique..."
                      maxLength={500}
                      rows={6}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      {profile.bio.length}/500 characters (minimum 50 required)
                    </p>
                  </div>

                  {/* Years in Business */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Years in Business
                    </label>
                    <input
                      type="number"
                      value={profile.yearsInBusiness || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, yearsInBusiness: parseInt(e.target.value) || 0 }))}
                      placeholder="e.g., 5"
                      min="0"
                      max="100"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Services */}
            {activeSection === 'services' && (
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Services</h2>

                <div className="space-y-6">
                  {/* Service Type - Fixed to Event Management */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Service Type
                    </label>
                    <div className="px-4 py-3 bg-orange-500/10 border-2 border-orange-500/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircleIcon className="w-5 h-5 text-orange-400 flex-shrink-0" />
                        <div>
                          <p className="text-orange-300 font-semibold">Full-Service Event Management</p>
                          <p className="text-xs text-slate-400 mt-0.5">Your company provides comprehensive event planning and execution services</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Specializations */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Event Specializations <span className="text-orange-400">*</span>
                      <span className="block text-xs text-slate-400 mt-1 font-normal">Select the types of events you specialize in (at least 3 recommended)</span>
                    </label>

                    {/* Suggested Specializations */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                      {SPECIALIZATIONS.map((spec) => (
                        <button
                          key={spec}
                          onClick={() => {
                            if (profile.specializations.includes(spec)) {
                              removeSpecialization(spec);
                            } else if (profile.specializations.length < 10) {
                              setProfile(prev => ({
                                ...prev,
                                specializations: [...prev.specializations, spec]
                              }));
                            }
                          }}
                          className={`px-3 py-2 text-sm rounded-lg border-2 transition-all ${
                            profile.specializations.includes(spec)
                              ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                              : 'bg-slate-700/20 border-slate-600/30 text-slate-300 hover:border-slate-500/50'
                          }`}
                        >
                          {spec}
                        </button>
                      ))}
                    </div>

                    {/* Custom Specialization Input */}
                    <div className="mt-4">
                      <p className="text-xs text-slate-400 mb-2">Or add custom specialization:</p>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newSpecialization}
                          onChange={(e) => setNewSpecialization(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addSpecialization()}
                          placeholder="e.g., Eco-Friendly Events"
                          className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <button
                          onClick={addSpecialization}
                          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Selected Specializations */}
                    {profile.specializations.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-slate-400 mb-2">Selected ({profile.specializations.length}/10):</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.specializations.map((spec) => (
                            <span
                              key={spec}
                              className="inline-flex items-center space-x-2 px-3 py-1.5 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-full text-sm"
                            >
                              <span>{spec}</span>
                              <button
                                onClick={() => removeSpecialization(spec)}
                                className="hover:text-orange-100"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Location */}
            {activeSection === 'location' && (
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Location</h2>

                <div className="space-y-6">
                  {/* Primary City */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Primary City <span className="text-orange-400">*</span>
                    </label>
                    <select
                      value={profile.primaryCity}
                      onChange={(e) => setProfile(prev => ({ ...prev, primaryCity: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select your primary city</option>
                      {INDIAN_CITIES.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  {/* Service Areas */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Service Areas
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {INDIAN_CITIES.map((city) => (
                        <label
                          key={city}
                          className="flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={profile.serviceAreas.includes(city)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setProfile(prev => ({ ...prev, serviceAreas: [...prev.serviceAreas, city] }));
                              } else {
                                setProfile(prev => ({
                                  ...prev,
                                  serviceAreas: prev.serviceAreas.filter(c => c !== city)
                                }));
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-slate-300">{city}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Business Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={profile.address}
                      onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="123 Main St, Andheri, Mumbai"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Portfolio */}
            {activeSection === 'portfolio' && (
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Portfolio</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Portfolio Images ({profile.portfolioImages.length}/20)
                    </label>

                    {/* Upload Button */}
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 hover:border-orange-500 rounded-xl cursor-pointer transition-colors mb-4">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <CloudArrowUpIcon className="w-12 h-12 text-slate-500 mb-2" />
                      <span className="text-sm text-slate-400">Click to upload images or drag and drop</span>
                      <span className="text-xs text-slate-500">Max 2MB per image, up to 20 images</span>
                    </label>

                    {/* Image Grid */}
                    {profile.portfolioImages.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {profile.portfolioImages.map((image) => (
                          <div key={image.id} className="bg-slate-700/20 rounded-xl p-4 border border-slate-600/30">
                            <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-slate-700/50">
                              <img src={image.url} alt={image.caption} className="w-full h-full object-cover" />
                              <button
                                onClick={() => removeImage(image.id)}
                                className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                              >
                                <TrashIcon className="w-4 h-4 text-white" />
                              </button>
                            </div>

                            <input
                              type="text"
                              value={image.caption}
                              onChange={(e) => updateImageCaption(image.id, e.target.value)}
                              placeholder="Add caption..."
                              maxLength={100}
                              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2"
                            />

                            <select
                              value={image.category}
                              onChange={(e) => updateImageCategory(image.id, e.target.value as PortfolioImage['category'])}
                              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="Wedding">Wedding</option>
                              <option value="Corporate">Corporate</option>
                              <option value="Birthday">Birthday</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Pricing */}
            {activeSection === 'pricing' && (
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Pricing Display</h2>

                <div className="space-y-6">
                  {/* Show Pricing Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-700/20 rounded-xl">
                    <div>
                      <p className="font-medium text-white">Display pricing on profile</p>
                      <p className="text-sm text-slate-400">Show your starting price to clients</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.pricingDisplay.showPricing}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          pricingDisplay: { ...prev.pricingDisplay, showPricing: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  {profile.pricingDisplay.showPricing && (
                    <>
                      {/* Starting Price */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Starting Price
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                          <input
                            type="number"
                            value={profile.pricingDisplay.startingPrice || ''}
                            onChange={(e) => setProfile(prev => ({
                              ...prev,
                              pricingDisplay: { ...prev.pricingDisplay, startingPrice: parseInt(e.target.value) || 0 }
                            }))}
                            placeholder="50000"
                            className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>

                      {/* Pricing Note */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Pricing Note
                        </label>
                        <input
                          type="text"
                          value={profile.pricingDisplay.pricingNote}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            pricingDisplay: { ...prev.pricingDisplay, pricingNote: e.target.value.slice(0, 200) }
                          }))}
                          placeholder="e.g., Starting from ₹50,000 for 100 guests"
                          maxLength={200}
                          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <p className="text-xs text-slate-400 mt-1">{profile.pricingDisplay.pricingNote.length}/200</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Packages */}
            {activeSection === 'packages' && (
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Packages</h2>
                  <button
                    onClick={addPackage}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span>Add Package</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {profile.packages.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <p>No packages yet. Add packages to showcase your offerings.</p>
                    </div>
                  ) : (
                    profile.packages.map((pkg) => (
                      <div key={pkg.id} className="bg-slate-700/20 rounded-xl p-6 border border-slate-600/30">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white">Package Details</h3>
                          <button
                            onClick={() => removePackage(pkg.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {/* Package Name */}
                          <input
                            type="text"
                            value={pkg.name}
                            onChange={(e) => updatePackage(pkg.id, 'name', e.target.value)}
                            placeholder="Package name (e.g., Basic Package)"
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />

                          {/* Package Price */}
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                            <input
                              type="number"
                              value={pkg.price || ''}
                              onChange={(e) => updatePackage(pkg.id, 'price', parseInt(e.target.value) || 0)}
                              placeholder="Price"
                              className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>

                          {/* Description */}
                          <textarea
                            value={pkg.description}
                            onChange={(e) => updatePackage(pkg.id, 'description', e.target.value)}
                            placeholder="Package description"
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />

                          {/* Inclusions */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-slate-300">Inclusions</label>
                              <button
                                onClick={() => addInclusion(pkg.id)}
                                className="text-xs text-orange-400 hover:text-orange-300"
                              >
                                + Add Item
                              </button>
                            </div>
                            <div className="space-y-2">
                              {pkg.inclusions.map((inclusion, index) => (
                                <div key={index} className="flex space-x-2">
                                  <input
                                    type="text"
                                    value={inclusion}
                                    onChange={(e) => updateInclusion(pkg.id, index, e.target.value)}
                                    placeholder="e.g., Menu for 100 guests"
                                    className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  />
                                  {pkg.inclusions.length > 1 && (
                                    <button
                                      onClick={() => removeInclusion(pkg.id, index)}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      <XMarkIcon className="w-5 h-5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Social & Contact */}
            {activeSection === 'social' && (
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Social & Contact</h2>

                <div className="space-y-6">
                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={profile.website}
                      onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Instagram */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Instagram
                    </label>
                    <input
                      type="url"
                      value={profile.instagram}
                      onChange={(e) => setProfile(prev => ({ ...prev, instagram: e.target.value }))}
                      placeholder="https://instagram.com/yourcompany"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Facebook */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Facebook
                    </label>
                    <input
                      type="url"
                      value={profile.facebook}
                      onChange={(e) => setProfile(prev => ({ ...prev, facebook: e.target.value }))}
                      placeholder="https://facebook.com/yourcompany"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={profile.whatsapp}
                      onChange={(e) => setProfile(prev => ({ ...prev, whatsapp: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Privacy Toggles */}
                  <div className="space-y-3 pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between p-4 bg-slate-700/20 rounded-xl">
                      <div>
                        <p className="font-medium text-white">Show email on profile</p>
                        <p className="text-sm text-slate-400">Clients can see your email address</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.showEmail}
                          onChange={(e) => setProfile(prev => ({ ...prev, showEmail: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/20 rounded-xl">
                      <div>
                        <p className="font-medium text-white">Show phone on profile</p>
                        <p className="text-sm text-slate-400">Clients can see your phone number</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.showPhone}
                          onChange={(e) => setProfile(prev => ({ ...prev, showPhone: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEO Settings */}
            {activeSection === 'seo' && (
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">SEO Settings</h2>

                <div className="space-y-6">
                  {/* Meta Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={profile.metaDescription}
                      onChange={(e) => setProfile(prev => ({ ...prev, metaDescription: e.target.value.slice(0, 160) }))}
                      placeholder="Brief description for search engines (helps with Google rankings)"
                      maxLength={160}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">{profile.metaDescription.length}/160 characters</p>
                  </div>

                  {/* Keywords */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={profile.keywords}
                      onChange={(e) => setProfile(prev => ({ ...prev, keywords: e.target.value }))}
                      placeholder="e.g., mumbai catering, wedding catering, luxury catering"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Profile Settings */}
            {activeSection === 'settings' && (
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>

                <div className="space-y-6">
                  {/* Public Profile Toggle */}
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl">
                    <div>
                      <p className="font-semibold text-white mb-1">Make profile public</p>
                      <p className="text-sm text-slate-300">Allow clients to view and share your profile</p>
                      {completionScore < 50 && (
                        <p className="text-xs text-orange-400 mt-2">
                          Complete at least 50% of your profile to make it public
                        </p>
                      )}
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.isPublic}
                        onChange={(e) => {
                          if (completionScore < 50) {
                            setToast({ message: 'Complete at least 50% of your profile first', type: 'error' });
                            setTimeout(() => setToast(null), 3000);
                            return;
                          }
                          setProfile(prev => ({ ...prev, isPublic: e.target.checked }));
                        }}
                        disabled={completionScore < 50}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500 disabled:opacity-50"></div>
                    </label>
                  </div>

                  {/* Profile URL */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Profile URL
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 px-4 py-3 bg-slate-700/30 border border-slate-600 rounded-xl text-slate-400 font-mono text-sm">
                        eventfoundry.com/vendor/{profile.slug || 'your-slug'}
                      </div>
                      <button
                        onClick={copyProfileLink}
                        disabled={!profile.slug}
                        className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors disabled:opacity-50"
                      >
                        <ShareIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Share Profile */}
                  {profile.isPublic && (
                    <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                      <p className="font-medium text-white mb-3">Your profile is live! 🎉</p>
                      <p className="text-sm text-slate-300 mb-4">
                        Share it with clients and on social media to get more leads
                      </p>
                      <button
                        onClick={copyProfileLink}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all"
                      >
                        <ShareIcon className="w-5 h-5" />
                        <span>Copy Profile Link</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div
            className={`px-6 py-4 rounded-xl shadow-lg backdrop-blur-sm border ${
              toast.type === 'success'
                ? 'bg-green-500/90 border-green-400 text-white'
                : 'bg-red-500/90 border-red-400 text-white'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
