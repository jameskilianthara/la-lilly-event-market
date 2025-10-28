'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  HeartIcon,
  TrashIcon,
  PencilIcon,
  ShareIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  StarIcon,
  MapPinIcon,
  SparklesIcon,
  CheckIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface WishlistVendor {
  vendorId: string;
  vendorName: string;
  vendorService: string;
  vendorCity: string;
  vendorLogo: string;
  vendorRating: number;
  vendorPrice?: number;
  vendorSlug: string;
  addedAt: string;
  notes: string;
  tags: string[];
}

interface Wishlist {
  clientId: string;
  wishlists: Record<string, WishlistVendor[]>;
  metadata: {
    totalVendors: number;
    lastUpdated: string;
    preferences: {
      notifyOnNewVendors: boolean;
      autoInviteWishlisted: boolean;
    };
  };
}

export default function ClientWishlistPage() {
  const router = useRouter();

  const [wishlist, setWishlist] = useState<Wishlist>({
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
  });

  const [viewMode, setViewMode] = useState<'service' | 'all' | 'recent'>('service');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<{ id: string; service: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = () => {
    try {
      // Load wishlist from localStorage
      const savedWishlist = localStorage.getItem('client_wishlist');
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist);

        // If it's the old array format, migrate to new structure
        if (Array.isArray(parsed)) {
          migrateWishlist(parsed);
        } else {
          setWishlist(parsed);
          // Expand all sections by default
          setExpandedSections(new Set(Object.keys(parsed.wishlists)));
        }
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  };

  const migrateWishlist = (oldWishlist: string[]) => {
    // Migrate old wishlist format to new structure
    const activeVendors = JSON.parse(localStorage.getItem('active_vendors') || '[]');
    const newWishlist: Wishlist = {
      clientId: 'client-current',
      wishlists: {},
      metadata: {
        totalVendors: oldWishlist.length,
        lastUpdated: new Date().toISOString(),
        preferences: {
          notifyOnNewVendors: true,
          autoInviteWishlisted: true
        }
      }
    };

    oldWishlist.forEach(vendorId => {
      const vendor = activeVendors.find((v: any) => v.id === vendorId);
      if (vendor && vendor.profile) {
        const serviceType = vendor.profile.serviceTypes?.[0] || 'Other';

        if (!newWishlist.wishlists[serviceType]) {
          newWishlist.wishlists[serviceType] = [];
        }

        newWishlist.wishlists[serviceType].push({
          vendorId: vendor.id,
          vendorName: vendor.businessName || vendor.companyInfo?.businessName || 'Vendor',
          vendorService: serviceType,
          vendorCity: vendor.profile.primaryCity || 'India',
          vendorLogo: vendor.profile.logo || '',
          vendorRating: vendor.profile.stats?.avgRating || 0,
          vendorPrice: vendor.profile.pricingDisplay?.startingPrice,
          vendorSlug: vendor.profile.slug || '',
          addedAt: new Date().toISOString(),
          notes: '',
          tags: []
        });
      }
    });

    setWishlist(newWishlist);
    setExpandedSections(new Set(Object.keys(newWishlist.wishlists)));
    saveWishlist(newWishlist);
  };

  const saveWishlist = (updatedWishlist: Wishlist) => {
    updatedWishlist.metadata.lastUpdated = new Date().toISOString();
    localStorage.setItem('client_wishlist', JSON.stringify(updatedWishlist));
    setWishlist(updatedWishlist);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleSection = (serviceType: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(serviceType)) {
      newExpanded.delete(serviceType);
    } else {
      newExpanded.add(serviceType);
    }
    setExpandedSections(newExpanded);
  };

  const removeVendor = (vendorId: string, serviceType: string) => {
    setVendorToDelete({ id: vendorId, service: serviceType });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!vendorToDelete) return;

    const updatedWishlists = { ...wishlist.wishlists };
    updatedWishlists[vendorToDelete.service] = updatedWishlists[vendorToDelete.service].filter(
      v => v.vendorId !== vendorToDelete.id
    );

    // Remove service type if empty
    if (updatedWishlists[vendorToDelete.service].length === 0) {
      delete updatedWishlists[vendorToDelete.service];
    }

    const updatedWishlist = {
      ...wishlist,
      wishlists: updatedWishlists,
      metadata: {
        ...wishlist.metadata,
        totalVendors: wishlist.metadata.totalVendors - 1
      }
    };

    saveWishlist(updatedWishlist);
    setShowDeleteConfirm(false);
    setVendorToDelete(null);
    showToast('Removed from wishlist', 'success');
  };

  const saveNotes = (vendorId: string, serviceType: string, notes: string) => {
    const updatedWishlists = { ...wishlist.wishlists };
    const vendorIndex = updatedWishlists[serviceType].findIndex(v => v.vendorId === vendorId);

    if (vendorIndex !== -1) {
      updatedWishlists[serviceType][vendorIndex].notes = notes;
      saveWishlist({ ...wishlist, wishlists: updatedWishlists });
      setEditingNotes(null);
      showToast('Notes saved', 'success');
    }
  };

  const toggleVendorSelection = (vendorId: string) => {
    const newSelected = new Set(selectedVendors);
    if (newSelected.has(vendorId)) {
      newSelected.delete(vendorId);
    } else {
      newSelected.add(vendorId);
    }
    setSelectedVendors(newSelected);
  };

  const selectAll = () => {
    const allVendorIds = Object.values(wishlist.wishlists)
      .flat()
      .map(v => v.vendorId);
    setSelectedVendors(new Set(allVendorIds));
  };

  const deselectAll = () => {
    setSelectedVendors(new Set());
  };

  const removeSelected = () => {
    const updatedWishlists = { ...wishlist.wishlists };

    Object.keys(updatedWishlists).forEach(serviceType => {
      updatedWishlists[serviceType] = updatedWishlists[serviceType].filter(
        v => !selectedVendors.has(v.vendorId)
      );

      if (updatedWishlists[serviceType].length === 0) {
        delete updatedWishlists[serviceType];
      }
    });

    const updatedWishlist = {
      ...wishlist,
      wishlists: updatedWishlists,
      metadata: {
        ...wishlist.metadata,
        totalVendors: wishlist.metadata.totalVendors - selectedVendors.size
      }
    };

    saveWishlist(updatedWishlist);
    setSelectedVendors(new Set());
    showToast(`Removed ${selectedVendors.size} vendors`, 'success');
  };

  const clearAll = () => {
    const updatedWishlist = {
      ...wishlist,
      wishlists: {},
      metadata: {
        ...wishlist.metadata,
        totalVendors: 0
      }
    };

    saveWishlist(updatedWishlist);
    showToast('Wishlist cleared', 'success');
  };

  const copyShareLink = () => {
    const shareId = btoa(`client_${wishlist.clientId}_${Date.now()}`);
    const shareUrl = `${window.location.origin}/wishlist/shared/${shareId}`;

    navigator.clipboard.writeText(shareUrl);
    showToast('Link copied to clipboard! 📋', 'success');
    setShowShareModal(false);
  };

  const getAllVendors = () => {
    return Object.values(wishlist.wishlists).flat();
  };

  const getRecentVendors = () => {
    return getAllVendors().sort((a, b) =>
      new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );
  };

  const totalVendors = wishlist.metadata.totalVendors;
  const hasSelection = selectedVendors.size > 0;

  if (totalVendors === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-12 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500/20 to-red-500/20 flex items-center justify-center mx-auto mb-6">
              <HeartSolidIcon className="w-12 h-12 text-pink-400" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-3">Your Wishlist is Empty</h1>
            <p className="text-lg text-slate-300 mb-8">Start building your dream vendor team!</p>

            <Link
              href="/vendors"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-500/30"
            >
              <SparklesIcon className="w-6 h-6" />
              <span>Browse Vendor Directory</span>
            </Link>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-slate-700/20 rounded-xl p-6">
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-4">
                  <HeartIcon className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Click the ♡ Icon</h3>
                <p className="text-sm text-slate-400">Save vendors you like to your wishlist for easy access</p>
              </div>

              <div className="bg-slate-700/20 rounded-xl p-6">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                  <CheckIcon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Compare Vendors</h3>
                <p className="text-sm text-slate-400">Review and compare your saved vendors side-by-side</p>
              </div>

              <div className="bg-slate-700/20 rounded-xl p-6">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <StarIcon className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Priority Responses</h3>
                <p className="text-sm text-slate-400">Get faster replies from wishlisted vendors</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">My Saved Vendors</h1>
              <p className="text-slate-300">
                {totalVendors} vendor{totalVendors !== 1 ? 's' : ''} in your wishlist
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {hasSelection && (
                <button
                  onClick={() => router.push('/forge')}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all"
                >
                  <CheckIcon className="w-5 h-5" />
                  <span>Create Event with Selected</span>
                </button>
              )}

              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-colors"
              >
                <ShareIcon className="w-5 h-5" />
                <span>Share</span>
              </button>

              <button
                onClick={clearAll}
                className="flex items-center space-x-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl transition-colors"
              >
                <TrashIcon className="w-5 h-5" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex space-x-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2">
            <button
              onClick={() => setViewMode('service')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                viewMode === 'service'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              By Service Type
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                viewMode === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              All Vendors ({totalVendors})
            </button>
            <button
              onClick={() => setViewMode('recent')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                viewMode === 'recent'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              Recently Added
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {hasSelection && (
          <div className="bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-white font-semibold">{selectedVendors.size} selected</span>
                <button
                  onClick={deselectAll}
                  className="text-sm text-orange-300 hover:text-orange-200"
                >
                  Deselect All
                </button>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => router.push('/forge')}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  Create Event
                </button>
                <button
                  onClick={removeSelected}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Remove Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Service Type View */}
        {viewMode === 'service' && (
          <div className="space-y-6">
            {Object.entries(wishlist.wishlists).map(([serviceType, vendors]) => {
              const isExpanded = expandedSections.has(serviceType);

              return (
                <div
                  key={serviceType}
                  className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden"
                >
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(serviceType)}
                    className="w-full flex items-center justify-between p-6 hover:bg-slate-700/20 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {isExpanded ? (
                        <ChevronDownIcon className="w-6 h-6 text-orange-400" />
                      ) : (
                        <ChevronRightIcon className="w-6 h-6 text-slate-400" />
                      )}
                      <h2 className="text-2xl font-bold text-white">{serviceType}</h2>
                      <span className="px-3 py-1 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-full text-sm font-semibold">
                        {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {!isExpanded && vendors.length > 0 && (
                      <div className="flex -space-x-2">
                        {vendors.slice(0, 3).map((vendor) => (
                          <div
                            key={vendor.vendorId}
                            className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-900 overflow-hidden"
                          >
                            {vendor.vendorLogo ? (
                              <img src={vendor.vendorLogo} alt={vendor.vendorName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600">
                                <span className="text-xs text-white font-bold">
                                  {vendor.vendorName.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </button>

                  {/* Vendor Cards */}
                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-4">
                      {vendors.map((vendor) => (
                        <div
                          key={vendor.vendorId}
                          className="bg-slate-700/20 rounded-xl p-5 border border-slate-600/30 hover:border-orange-500/50 transition-all"
                        >
                          <div className="flex items-start space-x-4">
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={selectedVendors.has(vendor.vendorId)}
                              onChange={() => toggleVendorSelection(vendor.vendorId)}
                              className="w-5 h-5 mt-1 rounded border-slate-600"
                            />

                            {/* Logo */}
                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-700/50">
                              {vendor.vendorLogo ? (
                                <img src={vendor.vendorLogo} alt={vendor.vendorName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600">
                                  <span className="text-2xl text-white font-bold">
                                    {vendor.vendorName.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <Link href={`/vendor/${vendor.vendorSlug}`}>
                                <h3 className="text-lg font-bold text-white mb-2 hover:text-orange-400 transition-colors">
                                  {vendor.vendorName}
                                </h3>
                              </Link>

                              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-3">
                                {vendor.vendorRating > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <StarIcon className="w-4 h-4 text-orange-400" />
                                    <span className="text-white font-semibold">{vendor.vendorRating.toFixed(1)}</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-1">
                                  <MapPinIcon className="w-4 h-4" />
                                  <span>{vendor.vendorCity}</span>
                                </div>
                                {vendor.vendorPrice && (
                                  <span>From ₹{vendor.vendorPrice.toLocaleString('en-IN')}</span>
                                )}
                                <span>Added {new Date(vendor.addedAt).toLocaleDateString('en-IN')}</span>
                              </div>

                              {/* Notes */}
                              {editingNotes === vendor.vendorId ? (
                                <div className="mb-3">
                                  <textarea
                                    value={notesValue}
                                    onChange={(e) => setNotesValue(e.target.value)}
                                    placeholder="Add your private notes..."
                                    rows={2}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  />
                                  <div className="flex space-x-2 mt-2">
                                    <button
                                      onClick={() => saveNotes(vendor.vendorId, serviceType, notesValue)}
                                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded transition-colors"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingNotes(null)}
                                      className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : vendor.notes ? (
                                <div className="mb-3 p-3 bg-slate-900/50 rounded-lg">
                                  <div className="flex items-start justify-between">
                                    <p className="text-sm text-slate-300 italic">&ldquo;{vendor.notes}&rdquo;</p>
                                    <button
                                      onClick={() => {
                                        setEditingNotes(vendor.vendorId);
                                        setNotesValue(vendor.notes);
                                      }}
                                      className="text-slate-400 hover:text-white ml-2"
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingNotes(vendor.vendorId);
                                    setNotesValue('');
                                  }}
                                  className="text-sm text-slate-400 hover:text-orange-400 mb-3 flex items-center space-x-1"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                  <span>Add notes</span>
                                </button>
                              )}

                              {/* Actions */}
                              <div className="flex flex-wrap gap-2">
                                <Link
                                  href={`/vendor/${vendor.vendorSlug}`}
                                  className="px-4 py-2 bg-slate-600/50 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                                >
                                  View Profile
                                </Link>
                                <button
                                  onClick={() => router.push('/forge')}
                                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm rounded-lg transition-all"
                                >
                                  Create Event
                                </button>
                              </div>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => removeVendor(vendor.vendorId, serviceType)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <XMarkIcon className="w-6 h-6" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Select All Button */}
            <div className="text-center">
              <button
                onClick={selectAll}
                className="text-orange-400 hover:text-orange-300 text-sm font-medium"
              >
                Select All Vendors
              </button>
            </div>
          </div>
        )}

        {/* All Vendors View */}
        {viewMode === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getAllVendors().map((vendor) => (
              <div
                key={vendor.vendorId}
                className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-orange-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <input
                    type="checkbox"
                    checked={selectedVendors.has(vendor.vendorId)}
                    onChange={() => toggleVendorSelection(vendor.vendorId)}
                    className="w-5 h-5 rounded border-slate-600"
                  />
                  <button
                    onClick={() => {
                      const serviceType = Object.keys(wishlist.wishlists).find(
                        type => wishlist.wishlists[type].some(v => v.vendorId === vendor.vendorId)
                      );
                      if (serviceType) removeVendor(vendor.vendorId, serviceType);
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <HeartSolidIcon className="w-6 h-6" />
                  </button>
                </div>

                <Link href={`/vendor/${vendor.vendorSlug}`}>
                  <h3 className="text-xl font-bold text-white mb-2 hover:text-orange-400 transition-colors">
                    {vendor.vendorName}
                  </h3>
                </Link>

                <span className="inline-block px-3 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full mb-3">
                  {vendor.vendorService}
                </span>

                <div className="flex items-center space-x-4 text-sm text-slate-400 mb-4">
                  {vendor.vendorRating > 0 && (
                    <div className="flex items-center space-x-1">
                      <StarIcon className="w-4 h-4 text-orange-400" />
                      <span className="text-white font-semibold">{vendor.vendorRating.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{vendor.vendorCity}</span>
                  </div>
                </div>

                {vendor.vendorPrice && (
                  <p className="text-sm text-slate-300 mb-4">
                    From <span className="text-lg font-bold text-orange-400">₹{vendor.vendorPrice.toLocaleString('en-IN')}</span>
                  </p>
                )}

                <Link
                  href={`/vendor/${vendor.vendorSlug}`}
                  className="block w-full text-center px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all"
                >
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Recently Added View */}
        {viewMode === 'recent' && (
          <div className="space-y-8">
            {['Today', 'Yesterday', 'This Week', 'Earlier'].map((timeframe) => {
              const filteredVendors = getRecentVendors().filter((vendor) => {
                const addedDate = new Date(vendor.addedAt);
                const now = new Date();
                const daysDiff = Math.floor((now.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24));

                if (timeframe === 'Today') return daysDiff === 0;
                if (timeframe === 'Yesterday') return daysDiff === 1;
                if (timeframe === 'This Week') return daysDiff > 1 && daysDiff <= 7;
                return daysDiff > 7;
              });

              if (filteredVendors.length === 0) return null;

              return (
                <div key={timeframe}>
                  <h2 className="text-xl font-bold text-white mb-4">{timeframe}</h2>
                  <div className="space-y-4">
                    {filteredVendors.map((vendor) => (
                      <div
                        key={vendor.vendorId}
                        className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5"
                      >
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedVendors.has(vendor.vendorId)}
                            onChange={() => toggleVendorSelection(vendor.vendorId)}
                            className="w-5 h-5 rounded border-slate-600"
                          />

                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-700/50">
                            {vendor.vendorLogo ? (
                              <img src={vendor.vendorLogo} alt={vendor.vendorName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600">
                                <span className="text-xl text-white font-bold">{vendor.vendorName.charAt(0)}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <Link href={`/vendor/${vendor.vendorSlug}`}>
                              <h3 className="text-lg font-bold text-white hover:text-orange-400 transition-colors">
                                {vendor.vendorName}
                              </h3>
                            </Link>
                            <p className="text-sm text-slate-400">{vendor.vendorService} · {vendor.vendorCity}</p>
                          </div>

                          <span className="text-sm text-slate-400">
                            {new Date(vendor.addedAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-md w-full border border-slate-700 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-3">Remove from Wishlist?</h2>
            <p className="text-slate-300 text-center mb-6">
              This vendor will be removed from your saved vendors.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setVendorToDelete(null);
                }}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-md w-full border border-slate-700 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <ShareIcon className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-3">Share Your Wishlist</h2>
            <p className="text-slate-300 text-center mb-6">
              Perfect for planning with family and friends!
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={copyShareLink}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
              >
                <span>🔗</span>
                <span>Copy Link</span>
              </button>

              <button
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
              >
                <span>📱</span>
                <span>Share via WhatsApp</span>
              </button>

              <button
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
              >
                <EnvelopeIcon className="w-5 h-5" />
                <span>Share via Email</span>
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
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
