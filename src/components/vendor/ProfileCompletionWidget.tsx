'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  ArrowRightIcon,
  PhotoIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  CurrencyRupeeIcon,
  GlobeAltIcon,
  EyeSlashIcon
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
  }>;
  pricingDisplay: {
    showPricing: boolean;
    startingPrice?: number;
  };
  packages: Array<{
    name: string;
    price: number;
  }>;
  website: string;
  instagram: string;
  facebook: string;
  isPublic: boolean;
}

interface ProfileCompletionTip {
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  link: string;
  weight: number;
}

export default function ProfileCompletionWidget() {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [completionScore, setCompletionScore] = useState(0);
  const [tips, setTips] = useState<ProfileCompletionTip[]>([]);

  useEffect(() => {
    // Get vendor session
    const sessionStr = localStorage.getItem('vendor_session');
    if (!sessionStr) return;

    const session = JSON.parse(sessionStr);

    // Get vendor data
    const activeVendors = JSON.parse(localStorage.getItem('active_vendors') || '[]');
    const vendor = activeVendors.find((v: any) => v.id === session.vendorId);

    if (!vendor?.profile) return;

    setProfile(vendor.profile);

    // Calculate completion score
    const score = calculateCompletion(vendor.profile);
    setCompletionScore(score);

    // Generate tips
    const generatedTips = generateTips(vendor.profile);
    setTips(generatedTips);
  }, []);

  const calculateCompletion = (prof: VendorProfile): number => {
    let score = 0;

    // Basic Info (30 points)
    if (prof.logo) score += 10;
    if (prof.tagline && prof.tagline.length >= 20) score += 5;
    if (prof.bio && prof.bio.length >= 100) score += 15;

    // Services (20 points)
    if (prof.serviceTypes.length >= 2) score += 10;
    if (prof.specializations.length >= 3) score += 10;

    // Location (5 points)
    if (prof.primaryCity) score += 3;
    if (prof.serviceAreas.length >= 2) score += 2;

    // Portfolio (25 points)
    if (prof.portfolioImages.length >= 3) score += 10;
    if (prof.portfolioImages.length >= 10) score += 10;
    if (prof.portfolioImages.length >= 20) score += 5;

    // Pricing (10 points)
    if (prof.pricingDisplay.showPricing && prof.pricingDisplay.startingPrice) score += 5;
    if (prof.packages && prof.packages.length > 0) score += 5;

    // Online Presence (10 points)
    if (prof.website) score += 5;
    if (prof.instagram || prof.facebook) score += 5;

    return Math.min(score, 100);
  };

  const generateTips = (prof: VendorProfile): ProfileCompletionTip[] => {
    const allTips: ProfileCompletionTip[] = [];

    // Logo missing
    if (!prof.logo) {
      allTips.push({
        icon: BuildingOffice2Icon,
        title: 'Add your company logo',
        description: 'Profiles with logos get 3x more inquiries',
        action: 'Upload Logo',
        link: '/craftsmen/dashboard/profile/edit#basic-info',
        weight: 10
      });
    }

    // Short or missing tagline
    if (!prof.tagline || prof.tagline.length < 20) {
      allTips.push({
        icon: SparklesIcon,
        title: 'Write a compelling tagline',
        description: 'A great tagline helps clients remember you',
        action: 'Add Tagline',
        link: '/craftsmen/dashboard/profile/edit#basic-info',
        weight: 5
      });
    }

    // Short or missing bio
    if (!prof.bio || prof.bio.length < 100) {
      allTips.push({
        icon: BuildingOffice2Icon,
        title: 'Complete your company bio',
        description: 'Share your story and expertise (at least 100 characters)',
        action: 'Write Bio',
        link: '/craftsmen/dashboard/profile/edit#basic-info',
        weight: 15
      });
    }

    // Few service types
    if (prof.serviceTypes.length < 2) {
      allTips.push({
        icon: BuildingOffice2Icon,
        title: 'Add more service types',
        description: 'List all event types you handle to get more leads',
        action: 'Add Services',
        link: '/craftsmen/dashboard/profile/edit#services',
        weight: 10
      });
    }

    // Few specializations
    if (prof.specializations.length < 3) {
      allTips.push({
        icon: SparklesIcon,
        title: 'Highlight your specializations',
        description: 'Add at least 3 specializations to stand out',
        action: 'Add Specializations',
        link: '/craftsmen/dashboard/profile/edit#services',
        weight: 10
      });
    }

    // Missing service areas
    if (prof.serviceAreas.length < 2) {
      allTips.push({
        icon: MapPinIcon,
        title: 'Expand your service areas',
        description: 'List all cities you serve to reach more clients',
        action: 'Add Cities',
        link: '/craftsmen/dashboard/profile/edit#location',
        weight: 2
      });
    }

    // Few portfolio images
    if (prof.portfolioImages.length < 3) {
      allTips.push({
        icon: PhotoIcon,
        title: 'Upload portfolio images',
        description: 'Profiles with 10+ images get 5x more inquiries',
        action: 'Add Photos',
        link: '/craftsmen/dashboard/profile/edit#portfolio',
        weight: 20
      });
    } else if (prof.portfolioImages.length < 10) {
      allTips.push({
        icon: PhotoIcon,
        title: 'Add more portfolio images',
        description: `You have ${prof.portfolioImages.length} images. Aim for at least 10.`,
        action: 'Add More Photos',
        link: '/craftsmen/dashboard/profile/edit#portfolio',
        weight: 15
      });
    }

    // No pricing
    if (!prof.pricingDisplay.showPricing && (!prof.packages || prof.packages.length === 0)) {
      allTips.push({
        icon: CurrencyRupeeIcon,
        title: 'Add pricing information',
        description: 'Help clients understand your rates',
        action: 'Set Pricing',
        link: '/craftsmen/dashboard/profile/edit#pricing',
        weight: 10
      });
    }

    // No packages
    if (!prof.packages || prof.packages.length === 0) {
      allTips.push({
        icon: CurrencyRupeeIcon,
        title: 'Create service packages',
        description: 'Packages help clients choose the right option',
        action: 'Create Packages',
        link: '/craftsmen/dashboard/profile/edit#packages',
        weight: 5
      });
    }

    // No website
    if (!prof.website) {
      allTips.push({
        icon: GlobeAltIcon,
        title: 'Add your website',
        description: 'Build credibility with a website link',
        action: 'Add Website',
        link: '/craftsmen/dashboard/profile/edit#social',
        weight: 5
      });
    }

    // No social media
    if (!prof.instagram && !prof.facebook) {
      allTips.push({
        icon: GlobeAltIcon,
        title: 'Connect social media',
        description: 'Link your Instagram or Facebook to showcase your work',
        action: 'Add Social',
        link: '/craftsmen/dashboard/profile/edit#social',
        weight: 5
      });
    }

    // Profile is private
    if (!prof.isPublic) {
      allTips.push({
        icon: EyeSlashIcon,
        title: 'Make your profile public',
        description: 'Your profile is private - clients cannot discover you',
        action: 'Make Public',
        link: '/craftsmen/dashboard/profile/preview',
        weight: 100
      });
    }

    // Sort by weight (highest first) and return top 3
    return allTips.sort((a, b) => b.weight - a.weight).slice(0, 3);
  };

  if (!profile) return null;

  const isComplete = completionScore === 100;
  const scoreColor =
    completionScore >= 80
      ? 'text-green-500'
      : completionScore >= 50
      ? 'text-yellow-500'
      : 'text-red-500';

  const scoreRingColor =
    completionScore >= 80
      ? 'text-green-500'
      : completionScore >= 50
      ? 'text-yellow-500'
      : 'text-red-500';

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-b border-orange-500/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <SparklesIcon className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Profile Strength</h3>
              <p className="text-sm text-slate-400">Optimize your profile to get more leads</p>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Score */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          {/* Circular Progress */}
          <div className="relative">
            <svg className="w-24 h-24 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-slate-700"
              />
              {/* Progress circle */}
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - completionScore / 100)}`}
                className={`${scoreRingColor} transition-all duration-1000`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${scoreColor}`}>{completionScore}%</span>
            </div>
          </div>

          {/* Status Message */}
          <div className="flex-1 ml-6">
            {isComplete ? (
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold">Profile Complete! 🎉</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Your profile is optimized and ready to attract clients
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-3">
                <ExclamationCircleIcon className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold">Almost there!</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {100 - completionScore}% more to reach 100% completion
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                completionScore >= 80
                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                  : completionScore >= 50
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                  : 'bg-gradient-to-r from-red-500 to-red-600'
              }`}
              style={{ width: `${completionScore}%` }}
            />
          </div>
        </div>

        {/* Tips */}
        {tips.length > 0 && !isComplete && (
          <div className="space-y-3 mb-6">
            <p className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Quick Wins
            </p>
            {tips.map((tip, idx) => {
              const Icon = tip.icon;
              return (
                <Link
                  key={idx}
                  href={tip.link}
                  className="block p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-orange-500/50 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors duration-200">
                      <Icon className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm group-hover:text-orange-400 transition-colors duration-200">
                        {tip.title}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">{tip.description}</p>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-slate-500 group-hover:text-orange-400 transition-colors duration-200 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/craftsmen/dashboard/profile/edit"
            className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold rounded-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-105 text-center"
          >
            {isComplete ? 'Edit Profile' : 'Complete Profile'}
          </Link>
          <Link
            href="/craftsmen/dashboard/profile/preview"
            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg border border-slate-600 hover:border-slate-500 transition-all duration-200 text-center"
          >
            Preview Profile
          </Link>
        </div>
      </div>

      {/* Footer Tip */}
      {!isComplete && (
        <div className="bg-blue-500/10 border-t border-blue-500/20 px-6 py-4">
          <p className="text-blue-300 text-xs text-center">
            💡 <strong>Pro tip:</strong> Complete profiles get 10x more client inquiries
          </p>
        </div>
      )}
    </div>
  );
}
