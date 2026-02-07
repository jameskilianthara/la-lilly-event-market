'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  StarIcon,
  MapPinIcon,
  CheckBadgeIcon,
  CalendarIcon,
  UserGroupIcon,
  PhotoIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

interface VendorProfile {
  vendorId: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  specialties: string[];
  rating: number;
  totalReviews: number;
  completedEvents: number;
  yearsInBusiness: number;
  description: string;
  certifications: string[];
  services: string[];
  verified: boolean;
}

interface Review {
  id: string;
  clientName: string;
  eventType: string;
  rating: number;
  comment: string;
  date: string;
}

export default function VendorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.vendorId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    loadVendorProfile();
  }, [vendorId]);

  const loadVendorProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/vendors/${vendorId}/profile`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load vendor profile');
      }

      const data = await response.json();
      setProfile(data.profile);
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Error loading vendor profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load vendor profile');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {star <= Math.round(rating) ? (
              <StarIconSolid className="w-5 h-5 text-yellow-400" />
            ) : (
              <StarIcon className="w-5 h-5 text-slate-400" />
            )}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-6">
        <div className="bg-red-900/20 border-2 border-red-500/50 rounded-xl p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">Profile Not Found</h2>
          <p className="text-slate-300">{error || 'Vendor profile could not be loaded'}</p>
          <button
            onClick={() => window.close()}
            className="mt-4 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            {/* Business Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-white">{profile.businessName}</h1>
                {profile.verified && (
                  <CheckBadgeIcon className="w-8 h-8 text-blue-400" title="Verified Vendor" />
                )}
              </div>
              <p className="text-slate-300 mb-4">{profile.ownerName}</p>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-4">
                {renderStars(profile.rating)}
                <span className="text-white font-semibold text-lg">{profile.rating.toFixed(1)}</span>
                <span className="text-slate-400">({profile.totalReviews} reviews)</span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-slate-300 mb-4">
                <MapPinIcon className="w-5 h-5 text-orange-400" />
                <span>{profile.city}, {profile.state}</span>
              </div>

              {/* Specialties */}
              <div className="flex flex-wrap gap-2">
                {profile.specialties.map((specialty, idx) => (
                  <span
                    key={idx}
                    className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30 text-orange-300 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-slate-700/30 rounded-lg p-6 md:min-w-[250px]">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-6 h-6 text-orange-400" />
                  <div>
                    <p className="text-slate-400 text-sm">Years in Business</p>
                    <p className="text-white font-bold text-xl">{profile.yearsInBusiness}+</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UserGroupIcon className="w-6 h-6 text-orange-400" />
                  <div>
                    <p className="text-slate-400 text-sm">Events Completed</p>
                    <p className="text-white font-bold text-xl">{profile.completedEvents}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">About</h2>
          <p className="text-slate-300 leading-relaxed whitespace-pre-line">{profile.description}</p>
        </div>

        {/* Services & Certifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Services */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Services Offered</h3>
            <ul className="space-y-2">
              {profile.services.map((service, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-orange-400 mt-1">✓</span>
                  <span>{service}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Certifications */}
          {profile.certifications.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Certifications & Awards</h3>
              <ul className="space-y-2">
                {profile.certifications.map((cert, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    <CheckBadgeIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>{cert}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Portfolio Link */}
        <div className="bg-gradient-to-r from-orange-900/40 to-pink-900/40 border-2 border-orange-500/30 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <PhotoIcon className="w-6 h-6 text-orange-400" />
                View Our Work
              </h3>
              <p className="text-slate-300">See photos from our past events and client testimonials</p>
            </div>
            <button
              onClick={() => router.push(`/vendors/${vendorId}/portfolio`)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 flex items-center gap-2 justify-center"
            >
              View Portfolio
              <ArrowTopRightOnSquareIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Client Reviews</h2>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-slate-700/30 rounded-lg p-5 border border-slate-600/50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold">{review.clientName}</p>
                      <p className="text-slate-400 text-sm">{review.eventType}</p>
                    </div>
                    <div className="text-right">
                      {renderStars(review.rating)}
                      <p className="text-slate-400 text-xs mt-1">
                        {new Date(review.date).toLocaleDateString('en-IN', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Section */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 mt-6">
          <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">Email</p>
              <a href={`mailto:${profile.email}`} className="text-orange-400 hover:text-orange-300 transition-colors">
                {profile.email}
              </a>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Phone</p>
              <a href={`tel:${profile.phone}`} className="text-orange-400 hover:text-orange-300 transition-colors">
                {profile.phone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
