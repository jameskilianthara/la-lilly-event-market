'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  StarIcon,
  XMarkIcon,
  CheckCircleIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  DocumentTextIcon,
  SparklesIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  notes?: string;
}

interface Bid {
  bidId: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  pricing: Record<string, { amount: number; notes: string }>;
  subtotals: Record<string, number>;
  total: number;
  coverLetter: string;
  whyPerfect: string;
  timeline: string;
  advancePayment: number;
  portfolio: string[];
  submittedAt: string;
  status: 'pending' | 'shortlisted' | 'selected' | 'rejected';
  shortlistedAt?: string;
  selectedAt?: string;
  rejectedAt?: string;
  // New format support
  itemizedPricing?: LineItem[];
  grandTotal?: number;
  gst?: number;
  subtotal?: number;
  vendorRating?: number;
  vendorStats?: {
    eventsCompleted: number;
  };
}

interface Event {
  eventId: string;
  eventMemory: {
    event_type: string;
    date: string;
    location: string;
    guest_count: string;
    venue_status: string;
  };
  checklistData: any;
  postedAt: string;
  status: string;
  bids: Bid[];
}

type FilterType = 'all' | 'pending' | 'shortlisted' | 'rejected';
type SortType = 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc';
type ViewMode = 'list' | 'comparison';

// Helper functions
function normalizeItemizedPricing(bid: Bid): LineItem[] {
  if (bid.itemizedPricing && bid.itemizedPricing.length > 0) {
    return bid.itemizedPricing;
  }

  const items: LineItem[] = [];
  Object.entries(bid.pricing || {}).forEach(([category, data]) => {
    items.push({
      id: `${category}_1`,
      description: data.notes || category,
      quantity: 1,
      unit: 'service',
      unitPrice: data.amount,
      lineTotal: data.amount,
      notes: data.notes
    });
  });

  return items;
}

function extractCategory(description: string): string {
  const categories = ['Catering', 'Decoration', 'Entertainment', 'Photography', 'Videography', 'Logistics', 'Planning', 'Venue', 'Makeup & Beauty', 'Transportation'];
  const lowerDesc = description.toLowerCase();

  for (const cat of categories) {
    if (lowerDesc.includes(cat.toLowerCase())) {
      return cat;
    }
  }

  return 'Other Services';
}

function getAllCategories(bids: Bid[]): string[] {
  const categories = new Set<string>();
  bids.forEach(bid => {
    const normalized = normalizeItemizedPricing(bid);
    normalized.forEach(item => {
      const category = extractCategory(item.description);
      categories.add(category);
    });
  });
  return Array.from(categories).sort();
}

function getCategoryTotalForBid(bid: Bid, category: string): number {
  const normalized = normalizeItemizedPricing(bid);
  return normalized
    .filter(item => extractCategory(item.description) === category)
    .reduce((sum, item) => sum + (item.lineTotal || 0), 0);
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Catering': '🍽️',
    'Decoration': '🎨',
    'Entertainment': '🎵',
    'Photography': '📸',
    'Videography': '🎥',
    'Logistics': '🚗',
    'Planning': '📋',
    'Venue': '🏢',
    'Makeup & Beauty': '💄',
    'Transportation': '🚗',
    'Other Services': '📦',
    'Other': '📦'
  };
  return icons[category] || '📦';
}

export default function BidReviewDashboard() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('price_asc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; bidId: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = () => {
    try {
      const postedEvents = JSON.parse(localStorage.getItem('posted_events') || '[]');
      const foundEvent = postedEvents.find((e: Event) => e.eventId === eventId);

      if (foundEvent) {
        setEvent(foundEvent);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEvent = (updatedEvent: Event) => {
    try {
      const postedEvents = JSON.parse(localStorage.getItem('posted_events') || '[]');
      const eventIndex = postedEvents.findIndex((e: Event) => e.eventId === eventId);

      if (eventIndex !== -1) {
        postedEvents[eventIndex] = updatedEvent;
        localStorage.setItem('posted_events', JSON.stringify(postedEvents));
        setEvent(updatedEvent);
      }
    } catch (error) {
      console.error('Error saving event:', error);
      showToast('Error updating bid status', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleShortlist = (bidId: string) => {
    if (!event) return;

    const bid = event.bids.find(b => b.bidId === bidId);
    if (!bid) return;

    if (bid.status === 'shortlisted') {
      // Remove from shortlist
      const updatedBids = event.bids.map(b =>
        b.bidId === bidId ? { ...b, status: 'pending' as const, shortlistedAt: undefined } : b
      );
      saveEvent({ ...event, bids: updatedBids });
      showToast('Vendor removed from shortlist', 'success');
    } else {
      // Add to shortlist
      const shortlistedCount = event.bids.filter(b => b.status === 'shortlisted').length;

      if (shortlistedCount >= 5) {
        showToast('Maximum 5 vendors can be shortlisted', 'error');
        return;
      }

      const updatedBids = event.bids.map(b =>
        b.bidId === bidId
          ? { ...b, status: 'shortlisted' as const, shortlistedAt: new Date().toISOString() }
          : b
      );
      saveEvent({ ...event, bids: updatedBids });
      showToast('Vendor shortlisted! ⭐', 'success');
    }
  };

  const handleReject = (bidId: string) => {
    setConfirmAction({ type: 'reject', bidId });
    setShowConfirmModal(true);
  };

  const handleSelectWinner = (bidId: string) => {
    setConfirmAction({ type: 'select', bidId });
    setShowConfirmModal(true);
  };

  const confirmActionHandler = () => {
    if (!event || !confirmAction) return;

    const { type, bidId } = confirmAction;

    if (type === 'reject') {
      const updatedBids = event.bids.map(b =>
        b.bidId === bidId
          ? { ...b, status: 'rejected' as const, rejectedAt: new Date().toISOString() }
          : b
      );
      saveEvent({ ...event, bids: updatedBids });
      showToast('Proposal rejected', 'success');
    } else if (type === 'select') {
      // Set one as selected, reject all others
      const updatedBids = event.bids.map(b =>
        b.bidId === bidId
          ? { ...b, status: 'selected' as const, selectedAt: new Date().toISOString() }
          : { ...b, status: 'rejected' as const, rejectedAt: new Date().toISOString() }
      );
      saveEvent({ ...event, bids: updatedBids, status: 'winner_selected' });
      showToast('Winner selected! 🎉 We\'ll notify the vendor.', 'success');
    }

    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const getFilteredAndSortedBids = () => {
    if (!event?.bids) return [];

    // Filter
    let filtered = event.bids;
    if (filter !== 'all') {
      filtered = event.bids.filter(b => b.status === filter);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const aTotal = a.grandTotal || a.total;
      const bTotal = b.grandTotal || b.total;

      switch (sort) {
        case 'price_asc':
          return aTotal - bTotal;
        case 'price_desc':
          return bTotal - aTotal;
        case 'date_desc':
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        case 'date_asc':
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  };

  const getLowestBid = () => {
    if (!event?.bids || event.bids.length === 0) return 0;
    return Math.min(...event.bids.map(b => b.grandTotal || b.total));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      case 'shortlisted':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'selected':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading proposals...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Event Not Found</h1>
          <Link href="/dashboard/client" className="text-orange-400 hover:text-orange-300">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const filteredBids = getFilteredAndSortedBids();
  const lowestBid = getLowestBid();
  const shortlistedCount = event.bids.filter(b => b.status === 'shortlisted').length;
  const selectedBid = event.bids.find(b => b.status === 'selected');
  const hasWinner = !!selectedBid;
  const categories = getAllCategories(filteredBids);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/dashboard/client/events/${eventId}`}
            className="inline-flex items-center space-x-2 text-slate-300 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Event</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white capitalize mb-2">
                {event.eventMemory.event_type} Proposals
              </h1>
              <p className="text-slate-400">
                {event.bids.length} total proposal{event.bids.length !== 1 ? 's' : ''}
                {shortlistedCount > 0 && ` • ${shortlistedCount} shortlisted`}
              </p>
            </div>
          </div>
        </div>

        {/* Winner Banner */}
        {hasWinner && selectedBid && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <SparklesIcon className="w-6 h-6 text-green-400 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-300 mb-1">Winner Selected! 🎉</h3>
                <p className="text-slate-300">
                  <span className="font-semibold text-white">{selectedBid.vendorName}</span> has been selected as your event partner
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  Winning bid: ₹{(selectedBid.grandTotal || selectedBid.total).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters, Sorting, and View Toggle */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto">
              <FunnelIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
              {(['all', 'pending', 'shortlisted', 'rejected'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                    filter === f
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== 'all' && (
                    <span className="ml-1 text-xs opacity-75">
                      ({event.bids.filter(b => b.status === f).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* View Toggle and Sort */}
            <div className="flex items-center space-x-3">
              {/* View Toggle */}
              <div className="flex items-center bg-slate-700/50 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <ListBulletIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">List</span>
                </button>
                <button
                  onClick={() => setViewMode('comparison')}
                  disabled={filteredBids.length < 2}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    viewMode === 'comparison'
                      ? 'bg-orange-500 text-white'
                      : filteredBids.length < 2
                      ? 'text-slate-500 cursor-not-allowed'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Squares2X2Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Compare ({Math.min(filteredBids.length, 3)})
                  </span>
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center space-x-2">
                <ArrowsUpDownIcon className="w-5 h-5 text-slate-400" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortType)}
                  className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* List View */}
        {viewMode === 'list' && (
          <>
            {filteredBids.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center">
                <DocumentTextIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">No Proposals Found</h3>
                <p className="text-slate-400">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredBids.map((bid) => {
                  const bidTotal = bid.grandTotal || bid.total;
                  const percentAbove = lowestBid > 0 ? (((bidTotal - lowestBid) / lowestBid) * 100) : 0;
                  const isLowest = bidTotal === lowestBid;
                  const isShortlisted = bid.status === 'shortlisted';
                  const isSelected = bid.status === 'selected';
                  const isRejected = bid.status === 'rejected';

                  return (
                    <div
                      key={bid.bidId}
                      className={`bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border rounded-xl p-6 transition-all duration-300 ${
                        isSelected
                          ? 'border-green-500/50 shadow-lg shadow-green-500/20'
                          : isRejected
                          ? 'border-red-500/30 opacity-60'
                          : 'border-slate-700/50 hover:border-orange-500/50'
                      }`}
                    >
                      {/* Vendor Info */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1">{bid.vendorName}</h3>
                          <p className="text-sm text-slate-400">{bid.vendorEmail}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(bid.status)}`}>
                          {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                        </span>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        <div className="flex items-baseline space-x-2 mb-2">
                          <CurrencyRupeeIcon className="w-6 h-6 text-orange-400 mt-1" />
                          <span className="text-3xl font-bold text-white">
                            {bidTotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                        {isLowest ? (
                          <span className="inline-flex items-center px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-xs font-semibold">
                            Lowest Price 🏆
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-full text-xs font-semibold">
                            +{percentAbove.toFixed(1)}% above lowest
                          </span>
                        )}
                      </div>

                      {/* Timeline */}
                      <div className="flex items-center space-x-2 text-sm text-slate-400 mb-4">
                        <ClockIcon className="w-4 h-4" />
                        <span>Submitted {new Date(bid.submittedAt).toLocaleDateString('en-IN')}</span>
                      </div>

                      {/* Preview */}
                      <div className="bg-slate-700/20 rounded-lg p-3 mb-4">
                        <p className="text-sm text-slate-300 line-clamp-2">
                          {bid.coverLetter || bid.whyPerfect || 'No description provided'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <Link
                          href={`/dashboard/client/events/${eventId}/bids/${bid.bidId}`}
                          className="block w-full text-center px-4 py-3 bg-slate-600/30 hover:bg-slate-600/50 text-white font-medium rounded-lg transition-colors"
                        >
                          View Full Proposal
                        </Link>

                        {!hasWinner && !isRejected && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleShortlist(bid.bidId)}
                              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                                isShortlisted
                                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30'
                                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {isShortlisted ? (
                                <StarSolidIcon className="w-5 h-5" />
                              ) : (
                                <StarIcon className="w-5 h-5" />
                              )}
                              <span>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
                            </button>

                            {isShortlisted ? (
                              <button
                                onClick={() => handleSelectWinner(bid.bidId)}
                                className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all"
                              >
                                <CheckCircleIcon className="w-5 h-5" />
                                <span>Select</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReject(bid.bidId)}
                                className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 rounded-lg font-medium transition-all"
                              >
                                <XMarkIcon className="w-5 h-5" />
                                <span>Reject</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Comparison View */}
        {viewMode === 'comparison' && filteredBids.length >= 2 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 overflow-hidden">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Compare Proposals</h2>
              <p className="text-slate-400">
                Side-by-side comparison of top {Math.min(filteredBids.length, 3)} proposals
              </p>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 bg-slate-800/95 backdrop-blur-sm px-6 py-4 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider border-r-2 border-slate-700/50">
                      Category
                    </th>
                    {filteredBids.slice(0, 3).map(bid => (
                      <th key={bid.bidId} className="px-6 py-4 text-center bg-slate-700/30 min-w-[250px]">
                        <div className="space-y-2">
                          <div className="text-base font-bold text-white">{bid.vendorName}</div>
                          {bid.vendorRating && (
                            <div className="text-xs text-slate-400">⭐ {bid.vendorRating}/5</div>
                          )}
                          {bid.status === 'shortlisted' && (
                            <span className="inline-flex px-2 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-xs font-semibold">
                              ⭐ Shortlisted
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Total Row */}
                  <tr className="bg-orange-500/10 border-y border-orange-500/30">
                    <td className="sticky left-0 z-10 bg-slate-800/95 backdrop-blur-sm px-6 py-4 font-bold text-white border-r-2 border-slate-700/50">
                      TOTAL
                    </td>
                    {filteredBids.slice(0, 3).map(bid => {
                      const bidTotal = bid.grandTotal || bid.total;
                      const isLowest = bidTotal === lowestBid;
                      const percentAbove = ((bidTotal - lowestBid) / lowestBid) * 100;

                      return (
                        <td key={bid.bidId} className="px-6 py-4 text-center">
                          <div className="text-2xl font-bold text-orange-400 mb-2">
                            ₹{(bidTotal / 100000).toFixed(2)}L
                          </div>
                          {isLowest ? (
                            <span className="inline-flex px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-xs font-semibold">
                              🏆 Lowest
                            </span>
                          ) : (
                            <span className="inline-flex px-3 py-1 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-full text-xs font-semibold">
                              +{Math.round(percentAbove)}%
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Category Rows */}
                  {categories.map(category => (
                    <tr key={category} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                      <td className="sticky left-0 z-10 bg-slate-800/95 backdrop-blur-sm px-6 py-4 border-r-2 border-slate-700/50">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{getCategoryIcon(category)}</span>
                          <span className="font-medium text-white">{category}</span>
                        </div>
                      </td>
                      {filteredBids.slice(0, 3).map(bid => {
                        const categoryTotal = getCategoryTotalForBid(bid, category);
                        return (
                          <td key={bid.bidId} className="px-6 py-4 text-center">
                            {categoryTotal > 0 ? (
                              <span className="text-slate-300 font-medium">
                                ₹{(categoryTotal / 100000).toFixed(2)}L
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Stats Rows */}
                  <tr className="bg-slate-700/20 border-y border-slate-700/50">
                    <td className="sticky left-0 z-10 bg-slate-800/95 backdrop-blur-sm px-6 py-4 font-medium text-slate-300 border-r-2 border-slate-700/50">
                      Experience
                    </td>
                    {filteredBids.slice(0, 3).map(bid => (
                      <td key={bid.bidId} className="px-6 py-4 text-center text-slate-300">
                        {bid.vendorStats?.eventsCompleted || 0} events
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-slate-700/20 border-b border-slate-700/50">
                    <td className="sticky left-0 z-10 bg-slate-800/95 backdrop-blur-sm px-6 py-4 font-medium text-slate-300 border-r-2 border-slate-700/50">
                      Advance Payment
                    </td>
                    {filteredBids.slice(0, 3).map(bid => (
                      <td key={bid.bidId} className="px-6 py-4 text-center text-slate-300">
                        {bid.advancePayment || 30}%
                      </td>
                    ))}
                  </tr>

                  {/* Actions Row */}
                  <tr className="bg-slate-700/10">
                    <td className="sticky left-0 z-10 bg-slate-800/95 backdrop-blur-sm px-6 py-4 border-r-2 border-slate-700/50"></td>
                    {filteredBids.slice(0, 3).map(bid => (
                      <td key={bid.bidId} className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/client/events/${eventId}/bids/${bid.bidId}`)}
                            className="w-full px-4 py-2 bg-slate-600/50 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            View Details
                          </button>
                          {bid.status !== 'selected' && bid.status !== 'rejected' && (
                            <button
                              onClick={() => handleShortlist(bid.bidId)}
                              className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                bid.status === 'shortlisted'
                                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30'
                                  : 'bg-orange-500 hover:bg-orange-600 text-white'
                              }`}
                            >
                              {bid.status === 'shortlisted' ? '⭐ Shortlisted' : 'Shortlist'}
                            </button>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-md w-full border border-slate-700 shadow-2xl">
            {confirmAction.type === 'select' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-10 h-10 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white text-center mb-3">Select Winner?</h2>
                <p className="text-slate-300 text-center mb-6">
                  This will select this vendor as your event partner and reject all other proposals. This action cannot be undone.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <XMarkIcon className="w-10 h-10 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-white text-center mb-3">Reject Proposal?</h2>
                <p className="text-slate-300 text-center mb-6">
                  Are you sure you want to reject this proposal?
                </p>
              </>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmActionHandler}
                className={`flex-1 px-6 py-3 font-semibold rounded-xl transition-colors ${
                  confirmAction.type === 'select'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                }`}
              >
                Confirm
              </button>
            </div>
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
