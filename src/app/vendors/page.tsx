'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  HeartIcon,
  MapPinIcon,
  StarIcon,
  CheckBadgeIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface VendorProfile {
  slug: string;
  logo: string;
  tagline: string;
  bio: string;
  serviceTypes: string[];
  specializations: string[];
  primaryCity: string;
  serviceAreas: string[];
  portfolioImages: { id: string; url: string; title: string; eventType: string }[];
  pricingDisplay: { showPricing: boolean; startingPrice: number };
  stats: { eventsCompleted: number; avgRating: number; totalReviews: number };
  isPublic: boolean;
  isVerified: boolean;
  isPremium: boolean;
}

interface Vendor {
  id: string;
  businessName: string;
  serviceType: string;
  profile: VendorProfile;
  createdAt: string;
}

// Image Carousel Component for each vendor card
function ImageCarousel({ images, vendorName }: { images: any[]; vendorName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-700/50">
        <SparklesIcon className="w-16 h-16 text-slate-600" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group">
      <img
        src={images[currentIndex].url}
        alt={images[currentIndex].title || vendorName}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeftIcon className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRightIcon className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-orange-500 w-4'
                  : 'bg-white/60 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function VendorDirectoryPage() {
  const router = useRouter();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sortBy, setSortBy] = useState('recommended');
  const [cityFilter, setCityFilter] = useState('all');

  useEffect(() => {
    loadVendors();
    loadWishlist();
  }, []);

  const loadVendors = async () => {
    try {
      // Load vendors from database via API
      const response = await fetch('/api/vendors');

      if (!response.ok) {
        console.warn('Vendors API not available, showing empty state');
        setVendors([]);
        return;
      }

      const data = await response.json();
      const vendors = data.vendors || [];
      setVendors(vendors);
      localStorage.setItem('active_vendors', JSON.stringify(vendors));
    } catch (error) {
      console.error('Error loading vendors:', error);
      setVendors([]);
    }
  };

  const loadWishlist = () => {
    try {
      const savedWishlist = JSON.parse(localStorage.getItem('client_wishlist') || '[]');
      setWishlist(savedWishlist);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  };

  const toggleWishlist = (vendorId: string) => {
    let newWishlist;
    if (wishlist.includes(vendorId)) {
      newWishlist = wishlist.filter(id => id !== vendorId);
      showToast('Removed from wishlist', 'success');
    } else {
      newWishlist = [...wishlist, vendorId];
      showToast('Added to wishlist ❤️', 'success');
    }

    setWishlist(newWishlist);
    localStorage.setItem('client_wishlist', JSON.stringify(newWishlist));
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = !searchQuery.trim() ||
      v.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.profile.primaryCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.profile.specializations.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCity = cityFilter === 'all' || v.profile.primaryCity === cityFilter;

    return matchesSearch && matchesCity;
  });

  const sortedVendors = [...filteredVendors].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.profile.stats?.avgRating || 0) - (a.profile.stats?.avgRating || 0);
      case 'price-asc':
        return (a.profile.pricingDisplay?.startingPrice || 0) - (b.profile.pricingDisplay?.startingPrice || 0);
      case 'price-desc':
        return (b.profile.pricingDisplay?.startingPrice || 0) - (a.profile.pricingDisplay?.startingPrice || 0);
      default: // recommended
        if (a.profile.isPremium && !b.profile.isPremium) return -1;
        if (!a.profile.isPremium && b.profile.isPremium) return 1;
        if (a.profile.isVerified && !b.profile.isVerified) return -1;
        if (!a.profile.isVerified && b.profile.isVerified) return 1;
        return (b.profile.stats?.avgRating || 0) - (a.profile.stats?.avgRating || 0);
    }
  });

  const cities = ['all', ...Array.from(new Set(vendors.map(v => v.profile.primaryCity)))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Discover Master Event Craftsmen
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Browse India's top event management companies with stunning portfolios
          </p>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by service, name, or city..."
                className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-600 rounded-2xl text-white text-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap justify-center gap-3">
            {['Wedding Planning', 'Corporate Events', 'Luxury Events', 'Cultural Events'].map((specialization) => (
              <button
                key={specialization}
                onClick={() => setSearchQuery(specialization)}
                className="px-6 py-2 bg-slate-700/50 hover:bg-orange-500 text-white rounded-full transition-all"
              >
                {specialization}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Bar */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-slate-300">
                <span className="font-semibold text-white">{sortedVendors.length}</span> vendors
              </span>

              {/* City Filter */}
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city === 'all' ? 'All Cities' : city}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="recommended">Recommended</option>
              <option value="rating">Highest Rated</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Vendor Grid with Image Carousels */}
        {sortedVendors.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center">
            <MagnifyingGlassIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No vendors found</h3>
            <p className="text-slate-400 mb-6">Try adjusting your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedVendors.map((vendor) => {
              const isWishlisted = wishlist.includes(vendor.id);

              return (
                <div
                  key={vendor.id}
                  className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20"
                >
                  {/* Image Carousel - Larger Height */}
                  <div className="relative h-72 bg-slate-700/50">
                    <ImageCarousel
                      images={vendor.profile.portfolioImages}
                      vendorName={vendor.businessName}
                    />

                    {/* Wishlist Heart */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(vendor.id);
                      }}
                      className="absolute top-3 right-3 w-10 h-10 bg-slate-900/80 backdrop-blur-sm hover:bg-slate-800 rounded-full flex items-center justify-center transition-all z-10"
                    >
                      {isWishlisted ? (
                        <HeartSolidIcon className="w-6 h-6 text-red-500" />
                      ) : (
                        <HeartIcon className="w-6 h-6 text-white" />
                      )}
                    </button>

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col space-y-2 z-10">
                      {vendor.profile.isPremium && (
                        <span className="px-2 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold rounded-full">
                          Premium
                        </span>
                      )}
                      {vendor.profile.isVerified && (
                        <span className="px-2 py-1 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full flex items-center space-x-1">
                          <CheckBadgeIcon className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5">
                    <Link href={`/vendor/${vendor.profile.slug}`}>
                      <h3 className="text-xl font-bold text-white mb-2 hover:text-orange-400 transition-colors">
                        {vendor.businessName}
                      </h3>
                    </Link>

                    {vendor.profile.tagline && (
                      <p className="text-sm text-slate-400 mb-3 line-clamp-2">{vendor.profile.tagline}</p>
                    )}

                    {/* Specializations */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {vendor.profile.specializations.slice(0, 2).map((spec) => (
                        <span
                          key={spec}
                          className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>

                    {/* Location */}
                    <div className="flex items-center space-x-2 text-sm text-slate-400 mb-3">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{vendor.profile.primaryCity}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-sm text-slate-400 mb-4">
                      {vendor.profile.stats?.avgRating > 0 && (
                        <div className="flex items-center space-x-1">
                          <StarIcon className="w-4 h-4 text-orange-400 fill-orange-400" />
                          <span className="text-white font-semibold">{vendor.profile.stats.avgRating.toFixed(1)}</span>
                          <span>({vendor.profile.stats.totalReviews})</span>
                        </div>
                      )}
                      {vendor.profile.stats?.eventsCompleted > 0 && (
                        <span>· {vendor.profile.stats.eventsCompleted} events</span>
                      )}
                    </div>

                    {/* Pricing */}
                    {vendor.profile.pricingDisplay?.showPricing && (
                      <p className="text-sm text-slate-300 mb-4">
                        From <span className="text-lg font-bold text-orange-400">₹{vendor.profile.pricingDisplay.startingPrice.toLocaleString('en-IN')}</span>
                      </p>
                    )}

                    {/* CTA */}
                    <Link
                      href={`/vendor/${vendor.profile.slug}`}
                      className="block w-full text-center px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all"
                    >
                      View Portfolio
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
