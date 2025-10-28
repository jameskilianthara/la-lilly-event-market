'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  HeartIcon,
  MapPinIcon,
  StarIcon,
  ChevronDownIcon,
  XMarkIcon,
  CheckBadgeIcon,
  SparklesIcon
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
  portfolioImages: any[];
  pricingDisplay: {
    showPricing: boolean;
    startingPrice: number;
  };
  stats: {
    eventsCompleted: number;
    avgRating: number;
    totalReviews: number;
  };
  isPublic: boolean;
  isVerified: boolean;
  isPremium: boolean;
}

interface Vendor {
  id: string;
  businessName?: string;
  companyInfo?: { businessName: string };
  serviceType: string;
  profile: VendorProfile;
  createdAt: string;
}

const SERVICE_TYPES = [
  'Event Management'
];

const SPECIALIZATIONS = [
  'Wedding Planning',
  'Corporate Events',
  'Social Celebrations',
  'Destination Events',
  'Luxury Events',
  'Budget-Friendly Events',
  'Cultural Events',
  'Theme-Based Events'
];

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
];

export default function VendorDirectoryPage() {
  const router = useRouter();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recommended');
  const [currentPage, setCurrentPage] = useState(1);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [filters, setFilters] = useState({
    serviceTypes: [] as string[],
    city: 'all',
    priceRange: '',
    minRating: 0,
    verifiedOnly: false,
    premiumOnly: false,
    hasPortfolio: false,
    showPricing: false
  });

  const ITEMS_PER_PAGE = 30;

  useEffect(() => {
    loadVendors();
    loadWishlist();
  }, []);

  const loadVendors = () => {
    try {
      const activeVendors = JSON.parse(localStorage.getItem('active_vendors') || '[]');
      const publicVendors = activeVendors.filter((v: Vendor) => v.profile?.isPublic);
      setVendors(publicVendors);
    } catch (error) {
      console.error('Error loading vendors:', error);
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

  const filteredVendors = useMemo(() => {
    let result = vendors;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(v => {
        const companyName = (v.businessName || v.companyInfo?.businessName || '').toLowerCase();
        const serviceTypes = v.profile.serviceTypes.join(' ').toLowerCase();
        const specializations = v.profile.specializations.join(' ').toLowerCase();
        const city = v.profile.primaryCity.toLowerCase();
        const bio = v.profile.bio.toLowerCase();

        return (
          companyName.includes(query) ||
          serviceTypes.includes(query) ||
          specializations.includes(query) ||
          city.includes(query) ||
          bio.includes(query)
        );
      });
    }

    // Service type filter
    if (filters.serviceTypes.length > 0) {
      result = result.filter(v =>
        filters.serviceTypes.some(s => v.profile.serviceTypes.includes(s))
      );
    }

    // City filter
    if (filters.city && filters.city !== 'all') {
      result = result.filter(v => v.profile.primaryCity === filters.city);
    }

    // Price range filter
    if (filters.priceRange) {
      result = result.filter(v => {
        const price = v.profile.pricingDisplay?.startingPrice || 0;
        if (filters.priceRange === 'budget') return price < 50000;
        if (filters.priceRange === 'mid') return price >= 50000 && price <= 200000;
        if (filters.priceRange === 'premium') return price > 200000;
        return true;
      });
    }

    // Rating filter
    if (filters.minRating > 0) {
      result = result.filter(v => (v.profile.stats?.avgRating || 0) >= filters.minRating);
    }

    // Feature filters
    if (filters.verifiedOnly) {
      result = result.filter(v => v.profile.isVerified);
    }

    if (filters.premiumOnly) {
      result = result.filter(v => v.profile.isPremium);
    }

    if (filters.hasPortfolio) {
      result = result.filter(v => v.profile.portfolioImages?.length >= 3);
    }

    if (filters.showPricing) {
      result = result.filter(v => v.profile.pricingDisplay?.showPricing);
    }

    return result;
  }, [vendors, searchQuery, filters]);

  const sortedVendors = useMemo(() => {
    const sorted = [...filteredVendors];

    switch (sortBy) {
      case 'popular':
        return sorted.sort((a, b) => {
          const aWishlist = wishlist.filter(id => id === a.id).length;
          const bWishlist = wishlist.filter(id => id === b.id).length;
          return bWishlist - aWishlist;
        });
      case 'rating':
        return sorted.sort((a, b) =>
          (b.profile.stats?.avgRating || 0) - (a.profile.stats?.avgRating || 0)
        );
      case 'price-asc':
        return sorted.sort((a, b) =>
          (a.profile.pricingDisplay?.startingPrice || 0) -
          (b.profile.pricingDisplay?.startingPrice || 0)
        );
      case 'price-desc':
        return sorted.sort((a, b) =>
          (b.profile.pricingDisplay?.startingPrice || 0) -
          (a.profile.pricingDisplay?.startingPrice || 0)
        );
      case 'recent':
        return sorted.sort((a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      default: // recommended
        return sorted.sort((a, b) => {
          // Premium and verified first
          if (a.profile.isPremium && !b.profile.isPremium) return -1;
          if (!a.profile.isPremium && b.profile.isPremium) return 1;
          if (a.profile.isVerified && !b.profile.isVerified) return -1;
          if (!a.profile.isVerified && b.profile.isVerified) return 1;
          return (b.profile.stats?.avgRating || 0) - (a.profile.stats?.avgRating || 0);
        });
    }
  }, [filteredVendors, sortBy, wishlist]);

  const paginatedVendors = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return sortedVendors.slice(start, end);
  }, [sortedVendors, currentPage]);

  const totalPages = Math.ceil(sortedVendors.length / ITEMS_PER_PAGE);

  const toggleServiceType = (service: string) => {
    if (filters.serviceTypes.includes(service)) {
      setFilters(prev => ({
        ...prev,
        serviceTypes: prev.serviceTypes.filter(s => s !== service)
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        serviceTypes: [...prev.serviceTypes, service]
      }));
    }
  };

  const resetFilters = () => {
    setFilters({
      serviceTypes: [],
      city: 'all',
      priceRange: '',
      minRating: 0,
      verifiedOnly: false,
      premiumOnly: false,
      hasPortfolio: false,
      showPricing: false
    });
    setSearchQuery('');
  };

  const activeFilterCount =
    filters.serviceTypes.length +
    (filters.city !== 'all' ? 1 : 0) +
    (filters.priceRange ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.premiumOnly ? 1 : 0) +
    (filters.hasPortfolio ? 1 : 0) +
    (filters.showPricing ? 1 : 0);

  const getServiceCount = (service: string) => {
    return vendors.filter(v => v.profile.serviceTypes.includes(service)).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Find Your Event Management Company
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Browse India's top {vendors.length}+ full-service event management companies
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

          {/* Quick Filter Pills - Specializations */}
          <div className="flex flex-wrap justify-center gap-3">
            {['Wedding Planning', 'Corporate Events', 'Destination Events', 'Luxury Events', 'Cultural Events'].map((specialization) => (
              <button
                key={specialization}
                onClick={() => {
                  setSearchQuery(specialization);
                }}
                className="px-6 py-2 bg-slate-700/50 hover:bg-orange-500 text-white rounded-full transition-all"
              >
                {specialization}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Sidebar (Desktop) */}
          <div className="hidden lg:block lg:w-80">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Filters</h2>
                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-sm text-orange-400 hover:text-orange-300"
                  >
                    Reset All
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Service Type - Hidden since all are Event Management */}
                <div className="pb-4 border-b border-slate-700/50">
                  <div className="flex items-center space-x-2">
                    <CheckBadgeIcon className="w-5 h-5 text-orange-400" />
                    <span className="text-sm font-semibold text-white">Full-Service Event Management</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">All companies provide comprehensive event management services</p>
                </div>

                {/* Location */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Location</h3>
                  <select
                    value={filters.city}
                    onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Cities</option>
                    {INDIAN_CITIES.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Price Range</h3>
                  <div className="space-y-2">
                    {[
                      { value: '', label: 'Any Price' },
                      { value: 'budget', label: 'Budget (₹) - Under ₹50K' },
                      { value: 'mid', label: 'Mid-Range (₹₹) - ₹50K-₹2L' },
                      { value: 'premium', label: 'Premium (₹₹₹) - Above ₹2L' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={filters.priceRange === option.value}
                          onChange={() => setFilters(prev => ({ ...prev, priceRange: option.value }))}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-slate-300">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Rating</h3>
                  <div className="space-y-2">
                    {[
                      { value: 0, label: 'Any rating' },
                      { value: 5, label: '5 stars only' },
                      { value: 4, label: '4 stars & up' },
                      { value: 3, label: '3 stars & up' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={filters.minRating === option.value}
                          onChange={() => setFilters(prev => ({ ...prev, minRating: option.value }))}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-slate-300">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Features</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.verifiedOnly}
                        onChange={(e) => setFilters(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-300">Verified Vendors Only</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.premiumOnly}
                        onChange={(e) => setFilters(prev => ({ ...prev, premiumOnly: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-300">Premium Vendors</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.hasPortfolio}
                        onChange={(e) => setFilters(prev => ({ ...prev, hasPortfolio: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-300">Has Portfolio (3+ images)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.showPricing}
                        onChange={(e) => setFilters(prev => ({ ...prev, showPricing: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-300">Shows Pricing</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <span className="text-slate-300">
                    Showing <span className="font-semibold text-white">{sortedVendors.length}</span> vendors
                  </span>

                  {/* Mobile Filter Button */}
                  <button
                    onClick={() => setShowFilters(true)}
                    className="lg:hidden flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                  >
                    <FunnelIcon className="w-5 h-5" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  {/* View Toggle */}
                  <div className="flex items-center space-x-1 bg-slate-700/50 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      <Squares2X2Icon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      <ListBulletIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="popular">Most Popular</option>
                    <option value="rating">Highest Rated</option>
                    <option value="recent">Recently Joined</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Pills */}
              {(filters.serviceTypes.length > 0 || filters.city !== 'all') && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {filters.serviceTypes.map((service) => (
                    <button
                      key={service}
                      onClick={() => toggleServiceType(service)}
                      className="inline-flex items-center space-x-2 px-3 py-1 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-full text-sm"
                    >
                      <span>{service}</span>
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  ))}
                  {filters.city !== 'all' && (
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, city: 'all' }))}
                      className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-sm"
                    >
                      <span>{filters.city}</span>
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Vendor Grid/List */}
            {paginatedVendors.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center">
                <MagnifyingGlassIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">No vendors found</h3>
                <p className="text-slate-400 mb-6">Try adjusting your filters or search query</p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-4'
                }>
                  {paginatedVendors.map((vendor) => {
                    const companyName = vendor.businessName || vendor.companyInfo?.businessName || 'Vendor';
                    const isWishlisted = wishlist.includes(vendor.id);
                    const headerImage = vendor.profile.logo || vendor.profile.portfolioImages?.[0]?.url;

                    return (
                      <div
                        key={vendor.id}
                        className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20"
                      >
                        {/* Header Image */}
                        <div className="relative h-48 bg-slate-700/50">
                          {headerImage ? (
                            <img
                              src={headerImage}
                              alt={companyName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <SparklesIcon className="w-16 h-16 text-slate-600" />
                            </div>
                          )}

                          {/* Wishlist Heart */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(vendor.id);
                            }}
                            className="absolute top-3 right-3 w-10 h-10 bg-slate-900/80 backdrop-blur-sm hover:bg-slate-800 rounded-full flex items-center justify-center transition-all"
                          >
                            {isWishlisted ? (
                              <HeartSolidIcon className="w-6 h-6 text-red-500" />
                            ) : (
                              <HeartIcon className="w-6 h-6 text-white" />
                            )}
                          </button>

                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex flex-col space-y-2">
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
                              {companyName}
                            </h3>
                          </Link>

                          {vendor.profile.tagline && (
                            <p className="text-sm text-slate-400 mb-3 line-clamp-2">{vendor.profile.tagline}</p>
                          )}

                          {/* Service Badges */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {vendor.profile.serviceTypes.slice(0, 2).map((service) => (
                              <span
                                key={service}
                                className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full"
                              >
                                {service}
                              </span>
                            ))}
                            {vendor.profile.serviceTypes.length > 2 && (
                              <span className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full">
                                +{vendor.profile.serviceTypes.length - 2}
                              </span>
                            )}
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
                                <StarIcon className="w-4 h-4 text-orange-400" />
                                <span className="text-white font-semibold">{vendor.profile.stats.avgRating.toFixed(1)}</span>
                                <span>({vendor.profile.stats.totalReviews})</span>
                              </div>
                            )}
                            {vendor.profile.stats?.eventsCompleted > 0 && (
                              <span>· {vendor.profile.stats.eventsCompleted} events</span>
                            )}
                          </div>

                          {/* Pricing */}
                          {vendor.profile.pricingDisplay?.showPricing && vendor.profile.pricingDisplay.startingPrice > 0 && (
                            <p className="text-sm text-slate-300 mb-4">
                              From <span className="text-lg font-bold text-orange-400">₹{vendor.profile.pricingDisplay.startingPrice.toLocaleString('en-IN')}</span>
                            </p>
                          )}

                          {/* CTA */}
                          <Link
                            href={`/vendor/${vendor.profile.slug}`}
                            className="block w-full text-center px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all"
                          >
                            View Profile
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      « Previous
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next »
                    </button>
                  </div>
                )}

                <p className="text-center text-sm text-slate-400 mt-4">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, sortedVendors.length)} of {sortedVendors.length} vendors
                </p>
              </>
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
