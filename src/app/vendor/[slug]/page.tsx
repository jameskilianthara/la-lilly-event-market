'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  HeartIcon,
  ShareIcon,
  StarIcon,
  MapPinIcon,
  CheckCircleIcon,
  SparklesIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

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
  isVerified: boolean;
  isPremium: boolean;
  metaDescription: string;
  keywords: string;
  stats: {
    eventsCompleted: number;
    avgRating: number;
    totalReviews: number;
    avgResponseTime: string;
  };
}

interface Vendor {
  id: string;
  businessName?: string;
  companyInfo?: { businessName: string };
  email: string;
  phone: string;
  profile: VendorProfile;
  createdAt: string;
}

export default function PublicVendorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [portfolioFilter, setPortfolioFilter] = useState<string>('All');
  const [lightboxImage, setLightboxImage] = useState<PortfolioImage | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: '',
    eventDate: '',
    message: ''
  });

  useEffect(() => {
    loadVendor();
  }, [slug]);

  useEffect(() => {
    if (vendor) {
      checkWishlistStatus();
    }
  }, [vendor]);

  const loadVendor = () => {
    try {
      const activeVendors = JSON.parse(localStorage.getItem('active_vendors') || '[]');
      const foundVendor = activeVendors.find((v: Vendor) => v.profile?.slug === slug);

      if (foundVendor) {
        if (!foundVendor.profile.isPublic) {
          // Profile is private
          setVendor(null);
        } else {
          setVendor(foundVendor);
        }
      }
    } catch (error) {
      console.error('Error loading vendor:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkWishlistStatus = () => {
    if (!vendor) return;

    try {
      const wishlistData = JSON.parse(localStorage.getItem('client_wishlist') || '{}');
      if (wishlistData.wishlists) {
        const isInWishlist = Object.values(wishlistData.wishlists).some((vendors: any) =>
          vendors.some((v: any) => v.vendorId === vendor.id)
        );
        setIsWishlisted(isInWishlist);
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const toggleWishlist = () => {
    if (!vendor) return;

    try {
      let wishlistData = JSON.parse(localStorage.getItem('client_wishlist') || '{}');

      if (!wishlistData.wishlists) {
        wishlistData = {
          clientId: 'client-current',
          wishlists: {},
          metadata: {
            totalVendors: 0,
            lastUpdated: new Date().toISOString(),
            preferences: {
              notifyOnNewVendors: true,
              autoInviteWishlisted: true
            }
          }
        };
      }

      const serviceType = vendor.profile.serviceTypes[0] || 'Other';

      if (!wishlistData.wishlists[serviceType]) {
        wishlistData.wishlists[serviceType] = [];
      }

      const index = wishlistData.wishlists[serviceType].findIndex(
        (v: any) => v.vendorId === vendor.id
      );

      if (index >= 0) {
        // Remove from wishlist
        wishlistData.wishlists[serviceType].splice(index, 1);
        if (wishlistData.wishlists[serviceType].length === 0) {
          delete wishlistData.wishlists[serviceType];
        }
        wishlistData.metadata.totalVendors--;
        showToast('Removed from wishlist', 'success');
        setIsWishlisted(false);
      } else {
        // Add to wishlist
        wishlistData.wishlists[serviceType].push({
          vendorId: vendor.id,
          vendorName: vendor.businessName || vendor.companyInfo?.businessName || 'Vendor',
          vendorService: serviceType,
          vendorCity: vendor.profile.primaryCity,
          vendorLogo: vendor.profile.logo,
          vendorRating: vendor.profile.stats?.avgRating || 0,
          vendorPrice: vendor.profile.pricingDisplay?.startingPrice,
          vendorSlug: vendor.profile.slug,
          addedAt: new Date().toISOString(),
          notes: '',
          tags: []
        });
        wishlistData.metadata.totalVendors++;
        showToast('Added to wishlist ❤️', 'success');
        setIsWishlisted(true);
      }

      wishlistData.metadata.lastUpdated = new Date().toISOString();
      localStorage.setItem('client_wishlist', JSON.stringify(wishlistData));
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      showToast('Error updating wishlist', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getFilteredPortfolio = () => {
    if (!vendor?.profile.portfolioImages) return [];
    if (portfolioFilter === 'All') return vendor.profile.portfolioImages;
    return vendor.profile.portfolioImages.filter(img => img.category === portfolioFilter);
  };

  const openLightbox = (image: PortfolioImage, index: number) => {
    setLightboxImage(image);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  const nextImage = () => {
    const filtered = getFilteredPortfolio();
    const nextIndex = (lightboxIndex + 1) % filtered.length;
    setLightboxIndex(nextIndex);
    setLightboxImage(filtered[nextIndex]);
  };

  const prevImage = () => {
    const filtered = getFilteredPortfolio();
    const prevIndex = (lightboxIndex - 1 + filtered.length) % filtered.length;
    setLightboxIndex(prevIndex);
    setLightboxImage(filtered[prevIndex]);
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/vendor/${slug}`;
    navigator.clipboard.writeText(shareUrl);
    showToast('Link copied to clipboard! 📋', 'success');
  };

  const shareWhatsApp = () => {
    const shareUrl = `${window.location.origin}/vendor/${slug}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareFacebook = () => {
    const shareUrl = `${window.location.origin}/vendor/${slug}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Save inquiry to localStorage (for now)
    const inquiries = JSON.parse(localStorage.getItem('vendor_inquiries') || '[]');
    inquiries.push({
      vendorId: vendor?.id,
      vendorName: vendor?.businessName || vendor?.companyInfo?.businessName,
      ...inquiryForm,
      submittedAt: new Date().toISOString()
    });
    localStorage.setItem('vendor_inquiries', JSON.stringify(inquiries));

    showToast('Inquiry sent successfully! 📧', 'success');
    setInquiryForm({
      name: '',
      email: '',
      phone: '',
      eventType: '',
      eventDate: '',
      message: ''
    });
  };

  const scrollToContact = () => {
    document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
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

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Vendor Not Found</h1>
          <p className="text-slate-400 mb-8">
            This vendor profile doesn't exist or has been removed.
          </p>
          <Link
            href="/vendors"
            className="inline-block px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all"
          >
            Browse All Vendors
          </Link>
        </div>
      </div>
    );
  }

  const companyName = vendor.businessName || vendor.companyInfo?.businessName || 'Vendor';
  const filteredPortfolio = getFilteredPortfolio();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 py-16 px-4 sm:px-6 lg:px-8">
        {/* Premium Badge */}
        {vendor.profile.isPremium && (
          <div className="absolute top-6 left-6">
            <span className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold rounded-full shadow-lg">
              PREMIUM
            </span>
          </div>
        )}

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center mb-8">
            {/* Logo */}
            {vendor.profile.logo ? (
              <div className="w-32 h-32 rounded-full overflow-hidden mb-6 ring-4 ring-orange-500/30 shadow-2xl">
                <img src={vendor.profile.logo} alt={companyName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-6 ring-4 ring-orange-500/30 shadow-2xl">
                <span className="text-5xl text-white font-bold">{companyName.charAt(0)}</span>
              </div>
            )}

            {/* Company Name */}
            <div className="flex items-center space-x-3 mb-3">
              <h1 className="text-4xl sm:text-5xl font-bold text-white">{companyName}</h1>
              {vendor.profile.isVerified && (
                <CheckCircleIcon className="w-8 h-8 text-blue-400" title="Verified Vendor" />
              )}
            </div>

            {/* Tagline */}
            {vendor.profile.tagline && (
              <p className="text-xl text-slate-300 mb-6">{vendor.profile.tagline}</p>
            )}

            {/* Service Badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {vendor.profile.serviceTypes.map((service) => (
                <span
                  key={service}
                  className="px-4 py-2 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-full text-sm font-semibold"
                >
                  {service}
                </span>
              ))}
            </div>

            {/* Location */}
            <div className="flex items-center space-x-2 text-slate-300 mb-8">
              <MapPinIcon className="w-5 h-5" />
              <span className="text-lg">{vendor.profile.primaryCity}, India</span>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 w-full max-w-3xl">
              {vendor.profile.stats?.avgRating > 0 && (
                <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <StarIcon className="w-5 h-5 text-orange-400" />
                    <span className="text-2xl font-bold text-white">{vendor.profile.stats.avgRating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-slate-400">({vendor.profile.stats.totalReviews} reviews)</p>
                </div>
              )}

              {vendor.profile.stats?.eventsCompleted > 0 && (
                <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <CheckCircleIcon className="w-5 h-5 text-green-400" />
                    <span className="text-2xl font-bold text-white">{vendor.profile.stats.eventsCompleted}</span>
                  </div>
                  <p className="text-xs text-slate-400">Events Completed</p>
                </div>
              )}

              {vendor.profile.yearsInBusiness > 0 && (
                <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <SparklesIcon className="w-5 h-5 text-purple-400" />
                    <span className="text-2xl font-bold text-white">{vendor.profile.yearsInBusiness}</span>
                  </div>
                  <p className="text-xs text-slate-400">Years Experience</p>
                </div>
              )}

              {vendor.profile.stats?.avgResponseTime && (
                <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold text-white mb-1">⚡</div>
                  <p className="text-xs text-slate-400">{vendor.profile.stats.avgResponseTime}</p>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={scrollToContact}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all transform hover:scale-105"
              >
                Get Quote
              </button>

              <button
                onClick={toggleWishlist}
                className={`px-8 py-4 rounded-xl font-semibold transition-all ${
                  isWishlisted
                    ? 'bg-pink-500/20 text-pink-300 border-2 border-pink-500/50 hover:bg-pink-500/30'
                    : 'bg-slate-700/50 text-white border-2 border-slate-600 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {isWishlisted ? (
                    <HeartSolidIcon className="w-6 h-6" />
                  ) : (
                    <HeartIcon className="w-6 h-6" />
                  )}
                  <span>{isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
                </div>
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="px-8 py-4 bg-slate-700/50 hover:bg-slate-700 text-white border-2 border-slate-600 font-semibold rounded-xl transition-all"
              >
                <div className="flex items-center space-x-2">
                  <ShareIcon className="w-6 h-6" />
                  <span>Share</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* About Section */}
        {vendor.profile.bio && (
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">About Us</h2>
            <p className="text-slate-300 leading-relaxed mb-6 whitespace-pre-wrap">{vendor.profile.bio}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {vendor.profile.yearsInBusiness > 0 && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Years in Business</p>
                  <p className="text-lg font-semibold text-white">{vendor.profile.yearsInBusiness} years</p>
                </div>
              )}

              {vendor.profile.serviceAreas.length > 0 && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Service Areas</p>
                  <p className="text-lg font-semibold text-white">{vendor.profile.serviceAreas.join(', ')}</p>
                </div>
              )}

              {vendor.profile.specializations.length > 0 && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Specializations</p>
                  <div className="flex flex-wrap gap-2">
                    {vendor.profile.specializations.slice(0, 3).map((spec) => (
                      <span key={spec} className="text-sm text-orange-300">• {spec}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Portfolio Gallery */}
        {vendor.profile.portfolioImages && vendor.profile.portfolioImages.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">Our Work</h2>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['All', 'Wedding', 'Corporate', 'Birthday', 'Other'].map((category) => (
                <button
                  key={category}
                  onClick={() => setPortfolioFilter(category)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    portfolioFilter === category
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Image Grid */}
            {filteredPortfolio.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPortfolio.map((image, index) => (
                  <div
                    key={image.id}
                    onClick={() => openLightbox(image, index)}
                    className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group bg-slate-700/50"
                  >
                    <img
                      src={image.url}
                      alt={image.caption}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-center p-4">
                        {image.caption && (
                          <p className="text-white font-medium">{image.caption}</p>
                        )}
                        <span className="text-sm text-orange-300 mt-2 block">{image.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-12">No {portfolioFilter.toLowerCase()} images found</p>
            )}
          </div>
        )}

        {/* Pricing & Packages */}
        {vendor.profile.pricingDisplay?.showPricing && (
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">Packages & Pricing</h2>

            {vendor.profile.packages && vendor.profile.packages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vendor.profile.packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-xl p-6 hover:border-orange-500/50 transition-all"
                  >
                    <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                    <p className="text-3xl font-bold text-orange-400 mb-4">
                      ₹{pkg.price.toLocaleString('en-IN')}
                    </p>
                    {pkg.description && (
                      <p className="text-slate-300 mb-4">{pkg.description}</p>
                    )}
                    {pkg.inclusions && pkg.inclusions.length > 0 && (
                      <div className="space-y-2 mb-6">
                        {pkg.inclusions.filter(inc => inc.trim()).map((inclusion, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <CheckIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-300">{inclusion}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={scrollToContact}
                      className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all"
                    >
                      Get Quote
                    </button>
                  </div>
                ))}
              </div>
            ) : vendor.profile.pricingDisplay.startingPrice > 0 && (
              <div className="text-center py-8">
                <p className="text-slate-300 mb-4">Starting from</p>
                <p className="text-5xl font-bold text-orange-400 mb-4">
                  ₹{vendor.profile.pricingDisplay.startingPrice.toLocaleString('en-IN')}
                </p>
                {vendor.profile.pricingDisplay.pricingNote && (
                  <p className="text-slate-400 mb-6">{vendor.profile.pricingDisplay.pricingNote}</p>
                )}
                <button
                  onClick={scrollToContact}
                  className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all"
                >
                  Request Custom Quote
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reviews Section (Future) */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-6">Client Reviews</h2>
          <div className="text-center py-12">
            <StarIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-xl text-slate-300 mb-2">No reviews yet</p>
            <p className="text-slate-400">Be the first to work with us and leave a review!</p>
          </div>
        </div>

        {/* Contact Section */}
        <div id="contact-section" className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-8">Get in Touch</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div>
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={inquiryForm.name}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={inquiryForm.email}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={inquiryForm.phone}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Event Type</label>
                  <select
                    value={inquiryForm.eventType}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, eventType: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select event type</option>
                    <option value="wedding">Wedding</option>
                    <option value="corporate">Corporate Event</option>
                    <option value="birthday">Birthday</option>
                    <option value="anniversary">Anniversary</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Event Date</label>
                  <input
                    type="date"
                    value={inquiryForm.eventDate}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, eventDate: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                  <textarea
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Tell us about your event..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30"
                >
                  Send Inquiry
                </button>
              </form>
            </div>

            {/* Contact Details */}
            <div className="space-y-6">
              <div className="bg-slate-700/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>

                <div className="space-y-4">
                  {vendor.profile.showEmail && vendor.email && (
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="w-6 h-6 text-orange-400" />
                      <a href={`mailto:${vendor.email}`} className="text-slate-300 hover:text-orange-400 transition-colors">
                        {vendor.email}
                      </a>
                    </div>
                  )}

                  {vendor.profile.showPhone && vendor.phone && (
                    <div className="flex items-center space-x-3">
                      <PhoneIcon className="w-6 h-6 text-orange-400" />
                      <a href={`tel:${vendor.phone}`} className="text-slate-300 hover:text-orange-400 transition-colors">
                        {vendor.phone}
                      </a>
                    </div>
                  )}

                  {vendor.profile.whatsapp && (
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📱</span>
                      <a
                        href={`https://wa.me/${vendor.profile.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-300 hover:text-orange-400 transition-colors"
                      >
                        WhatsApp: {vendor.profile.whatsapp}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Links */}
              {(vendor.profile.website || vendor.profile.instagram || vendor.profile.facebook) && (
                <div className="bg-slate-700/30 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Follow Us</h3>
                  <div className="flex flex-wrap gap-3">
                    {vendor.profile.website && (
                      <a
                        href={vendor.profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-4 py-2 bg-slate-600/50 hover:bg-slate-600 text-white rounded-lg transition-colors"
                      >
                        <GlobeAltIcon className="w-5 h-5" />
                        <span>Website</span>
                      </a>
                    )}

                    {vendor.profile.instagram && (
                      <a
                        href={vendor.profile.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-colors"
                      >
                        <span>📷</span>
                        <span>Instagram</span>
                      </a>
                    )}

                    {vendor.profile.facebook && (
                      <a
                        href={vendor.profile.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <span>📘</span>
                        <span>Facebook</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-400 pt-8 border-t border-slate-700/50">
          <p className="mb-2">
            Joined EventFoundry: {new Date(vendor.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
          <div className="flex justify-center items-center space-x-4">
            {vendor.profile.isVerified && (
              <span className="text-blue-400">✓ Verified Vendor</span>
            )}
            {vendor.profile.isPremium && (
              <span className="text-orange-400">★ Premium Member</span>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={prevImage}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <ChevronLeftIcon className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={nextImage}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <ChevronRightIcon className="w-6 h-6 text-white" />
          </button>

          <div className="max-w-6xl w-full">
            <img
              src={lightboxImage.url}
              alt={lightboxImage.caption}
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
            />
            {lightboxImage.caption && (
              <p className="text-center text-white mt-4 text-lg">{lightboxImage.caption}</p>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-md w-full border border-slate-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Share This Profile</h2>

            <div className="space-y-3">
              <button
                onClick={copyShareLink}
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
              >
                <span className="text-2xl">🔗</span>
                <span>Copy Link</span>
              </button>

              <button
                onClick={shareWhatsApp}
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
              >
                <span className="text-2xl">📱</span>
                <span>Share via WhatsApp</span>
              </button>

              <button
                onClick={shareFacebook}
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
              >
                <span className="text-2xl">📘</span>
                <span>Share on Facebook</span>
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full mt-6 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

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
