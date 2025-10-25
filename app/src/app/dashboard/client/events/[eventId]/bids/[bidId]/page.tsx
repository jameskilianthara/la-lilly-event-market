'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeftIcon,
  StarIcon,
  XMarkIcon,
  CheckCircleIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  CalendarIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon
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

interface CategoryPricing {
  lineItems: LineItem[];
  notes: string;
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

// Helper function to normalize pricing data
function normalizeItemizedPricing(bid: Bid): LineItem[] {
  // If new format exists, use it
  if (bid.itemizedPricing && bid.itemizedPricing.length > 0) {
    return bid.itemizedPricing;
  }

  // Convert old format to new
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

// Group line items by category
function groupByCategory(items: LineItem[]): Record<string, LineItem[]> {
  const grouped: Record<string, LineItem[]> = {};

  items.forEach(item => {
    // Extract category from description or ID
    const category = extractCategory(item.description) || 'Other Services';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item);
  });

  return grouped;
}

function extractCategory(description: string): string | null {
  const categories = ['Catering', 'Decoration', 'Entertainment', 'Photography', 'Videography', 'Logistics', 'Planning', 'Venue', 'Makeup & Beauty', 'Transportation'];
  const lowerDesc = description.toLowerCase();

  for (const cat of categories) {
    if (lowerDesc.includes(cat.toLowerCase())) {
      return cat;
    }
  }

  return null;
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

function getCategoryTotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
}

function getTotalLineItems(bid: Bid): number {
  return normalizeItemizedPricing(bid).length;
}

export default function BidDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  const bidId = params.bidId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [bid, setBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBid();
  }, [eventId, bidId]);

  const loadBid = () => {
    try {
      const postedEvents = JSON.parse(localStorage.getItem('posted_events') || '[]');
      const foundEvent = postedEvents.find((e: Event) => e.eventId === eventId);

      if (foundEvent) {
        const foundBid = foundEvent.bids?.find((b: Bid) => b.bidId === bidId);
        if (foundBid) {
          setEvent(foundEvent);
          setBid(foundBid);
          // Auto-expand all categories on load
          const items = normalizeItemizedPricing(foundBid);
          const grouped = groupByCategory(items);
          setExpandedCategories(new Set(Object.keys(grouped)));
        }
      }
    } catch (error) {
      console.error('Error loading bid:', error);
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

        // Update local bid state
        const updatedBid = updatedEvent.bids.find((b: Bid) => b.bidId === bidId);
        if (updatedBid) setBid(updatedBid);
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

  const handleShortlist = () => {
    if (!event || !bid) return;

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

  const handleReject = () => {
    setConfirmAction('reject');
    setShowConfirmModal(true);
  };

  const handleSelectWinner = () => {
    setConfirmAction('select');
    setShowConfirmModal(true);
  };

  const confirmActionHandler = () => {
    if (!event || !confirmAction) return;

    if (confirmAction === 'reject') {
      const updatedBids = event.bids.map(b =>
        b.bidId === bidId
          ? { ...b, status: 'rejected' as const, rejectedAt: new Date().toISOString() }
          : b
      );
      saveEvent({ ...event, bids: updatedBids });
      showToast('Proposal rejected', 'success');
      setTimeout(() => router.push(`/dashboard/client/events/${eventId}/bids`), 1500);
    } else if (confirmAction === 'select') {
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

  const formatCategoryName = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getLowestBid = () => {
    if (!event?.bids || event.bids.length === 0) return 0;
    return Math.min(...event.bids.map(b => b.grandTotal || b.total));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (!event || !bid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Proposal Not Found</h1>
          <Link href="/dashboard/client" className="text-orange-400 hover:text-orange-300">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const lowestBid = getLowestBid();
  const bidTotal = bid.grandTotal || bid.total;
  const bidSubtotal = bid.subtotal || bid.total;
  const bidGST = bid.gst || 0;
  const percentAbove = lowestBid > 0 ? (((bidTotal - lowestBid) / lowestBid) * 100) : 0;
  const isLowest = bidTotal === lowestBid;
  const isShortlisted = bid.status === 'shortlisted';
  const isSelected = bid.status === 'selected';
  const isRejected = bid.status === 'rejected';
  const hasWinner = event.bids.some(b => b.status === 'selected');

  const itemizedPricing = normalizeItemizedPricing(bid);
  const groupedCategories = groupByCategory(itemizedPricing);
  const totalLineItems = getTotalLineItems(bid);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link
          href={`/dashboard/client/events/${eventId}/bids`}
          className="inline-flex items-center space-x-2 text-slate-300 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back to All Proposals</span>
        </Link>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left: Vendor Info */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">Proposal from {bid.vendorName}</h1>
                <div className="flex items-center space-x-2 text-slate-400 mb-2">
                  <EnvelopeIcon className="w-5 h-5" />
                  <span>{bid.vendorEmail}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <ClockIcon className="w-4 h-4" />
                  <span>Submitted {formatRelativeTime(bid.submittedAt)}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {isSelected && (
                  <span className="px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-sm font-semibold flex items-center space-x-1">
                    <span>✅ Winner</span>
                  </span>
                )}
                {isShortlisted && !isSelected && (
                  <span className="px-4 py-2 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-sm font-semibold flex items-center space-x-1">
                    <span>⭐ Shortlisted</span>
                  </span>
                )}
                {bid.status === 'pending' && (
                  <span className="px-4 py-2 bg-slate-500/20 text-slate-300 border border-slate-500/30 rounded-full text-sm font-semibold">
                    ⏳ Pending Review
                  </span>
                )}
                {isRejected && (
                  <span className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-sm font-semibold">
                    ❌ Not Selected
                  </span>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
              <div>
                <p className="text-xs text-slate-400 mb-1">Timeline Commitment</p>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-semibold text-white">
                    {new Date(bid.timeline).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Advance Payment</p>
                <span className="text-sm font-semibold text-white">{bid.advancePayment}%</span>
              </div>
            </div>
          </div>

          {/* Right: Price Summary Card */}
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-2 border-orange-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="text-center mb-4">
              <p className="text-sm text-slate-400 mb-2">Total Quote</p>
              <div className="flex items-baseline justify-center space-x-2">
                <CurrencyRupeeIcon className="w-8 h-8 text-orange-400 mt-1" />
                <span className="text-4xl font-bold text-white">
                  {bidTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Price Comparison */}
            <div className="text-center mb-6">
              {isLowest ? (
                <span className="inline-flex items-center px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-sm font-semibold">
                  🏆 Lowest Price
                </span>
              ) : (
                <div>
                  <span className="inline-flex items-center px-4 py-2 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-full text-sm font-semibold">
                    +{percentAbove.toFixed(0)}% above lowest
                  </span>
                  <p className="text-xs text-slate-400 mt-2">
                    Lowest bid: ₹{lowestBid.toLocaleString('en-IN')}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!hasWinner && !isRejected && (
              <div className="space-y-2">
                <button
                  onClick={handleShortlist}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                    isShortlisted
                      ? 'bg-yellow-500/20 text-yellow-300 border-2 border-yellow-500/50 hover:bg-yellow-500/30'
                      : 'bg-slate-700/50 text-slate-300 border-2 border-slate-600 hover:bg-slate-700'
                  }`}
                >
                  {isShortlisted ? (
                    <StarSolidIcon className="w-5 h-5" />
                  ) : (
                    <StarIcon className="w-5 h-5" />
                  )}
                  <span>{isShortlisted ? 'Shortlisted' : 'Add to Shortlist'}</span>
                </button>

                {isShortlisted && (
                  <button
                    onClick={handleSelectWinner}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold transition-all shadow-lg"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>✅ Select as Winner</span>
                  </button>
                )}

                <button
                  onClick={handleReject}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 rounded-xl font-semibold transition-all text-sm"
                >
                  <XMarkIcon className="w-5 h-5" />
                  <span>Reject Proposal</span>
                </button>
              </div>
            )}

            {!isShortlisted && !hasWinner && !isRejected && (
              <p className="text-center text-xs text-slate-400 mt-3">
                Shortlist to select as winner
              </p>
            )}
          </div>
        </div>

        {/* Itemized Pricing Breakdown */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 sm:p-8 mb-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <CurrencyRupeeIcon className="w-6 h-6 text-orange-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">📊 Detailed Cost Breakdown</h2>
                <p className="text-sm text-slate-400 mt-1">
                  {Object.keys(groupedCategories).length} categories • {totalLineItems} line items
                </p>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            {Object.entries(groupedCategories).map(([category, items]) => {
              const isExpanded = expandedCategories.has(category);
              const categoryTotal = getCategoryTotal(items);

              return (
                <div
                  key={category}
                  className="bg-slate-700/20 backdrop-blur-sm rounded-xl border border-slate-600/30 overflow-hidden"
                >
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCategoryIcon(category)}</span>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-white">{category}</h3>
                        <p className="text-xs text-slate-400">{items.length} line items</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-xl font-bold text-orange-400">
                        ₹{categoryTotal.toLocaleString('en-IN')}
                      </span>
                      {isExpanded ? (
                        <ChevronUpIcon className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Line Items */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-600/30">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-600/30">
                            <th className="text-left py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="text-right py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="text-right py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Unit Price
                            </th>
                            <th className="text-right py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-600/20">
                              <td className="py-3">
                                <div className="text-sm font-medium text-white">{item.description}</div>
                                {item.notes && (
                                  <div className="text-xs text-slate-400 mt-1">{item.notes}</div>
                                )}
                              </td>
                              <td className="text-right py-3 text-sm text-slate-300">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="text-right py-3 text-sm text-slate-300">
                                ₹{item.unitPrice.toLocaleString('en-IN')}
                              </td>
                              <td className="text-right py-3 text-base font-semibold text-white">
                                ₹{item.lineTotal.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-slate-600/50">
                            <td colSpan={3} className="py-3 text-sm font-semibold text-slate-300 text-right">
                              Category Subtotal
                            </td>
                            <td className="text-right py-3 text-lg font-bold text-orange-400">
                              ₹{categoryTotal.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grand Total Card */}
          <div className="mt-6 bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-2 border-orange-500/50 rounded-xl p-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-slate-300">
                <span>Subtotal</span>
                <span className="font-semibold">₹{bidSubtotal.toLocaleString('en-IN')}</span>
              </div>
              {bidGST > 0 && (
                <div className="flex justify-between items-center text-slate-300">
                  <span>GST (18%)</span>
                  <span className="font-semibold">₹{bidGST.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-orange-500/30">
                <span className="text-xl font-bold text-white">Grand Total</span>
                <span className="text-3xl font-bold text-orange-400">
                  ₹{bidTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cover Letter */}
        {bid.coverLetter && (
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 sm:p-8 mb-6 shadow-2xl">
            <div className="flex items-center space-x-2 mb-4">
              <DocumentTextIcon className="w-6 h-6 text-orange-400" />
              <h2 className="text-2xl font-bold text-white">Cover Letter</h2>
            </div>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{bid.coverLetter}</p>
          </div>
        )}

        {/* Why Perfect */}
        {bid.whyPerfect && (
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 sm:p-8 mb-6 shadow-2xl">
            <div className="flex items-center space-x-2 mb-4">
              <SparklesIcon className="w-6 h-6 text-orange-400" />
              <h2 className="text-2xl font-bold text-white">Why We're Perfect for This Event</h2>
            </div>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{bid.whyPerfect}</p>
          </div>
        )}

        {/* Portfolio */}
        {bid.portfolio && bid.portfolio.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 sm:p-8 mb-6 shadow-2xl">
            <div className="flex items-center space-x-2 mb-6">
              <PhotoIcon className="w-6 h-6 text-orange-400" />
              <h2 className="text-2xl font-bold text-white">Portfolio</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {bid.portfolio.map((imageUrl, index) => (
                <div
                  key={index}
                  onClick={() => setLightboxImage(imageUrl)}
                  className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group bg-slate-700/20"
                >
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-medium">View Full Size</span>
                  </div>
                  {/* Placeholder for image */}
                  <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                    <PhotoIcon className="w-12 h-12 text-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Winner/Rejected Status Cards */}
        {isSelected && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6 text-center">
            <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-green-300 mb-2">This vendor has been selected as winner! 🎉</h3>
            <p className="text-slate-300">We've notified them and they'll be in touch soon.</p>
          </div>
        )}

        {isRejected && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <XMarkIcon className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-red-300 mb-2">This proposal has been rejected</h3>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
        >
          <div className="relative max-w-6xl w-full">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 w-12 h-12 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-white" />
            </button>
            <div className="bg-slate-800 rounded-2xl p-2">
              <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center">
                <PhotoIcon className="w-24 h-24 text-slate-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-md w-full border border-slate-700 shadow-2xl">
            {confirmAction === 'select' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-10 h-10 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white text-center mb-3">Select Winner?</h2>
                <p className="text-slate-300 text-center mb-6">
                  This will select <span className="font-semibold text-white">{bid.vendorName}</span> as your event partner and automatically reject all other proposals. This action cannot be undone.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <XMarkIcon className="w-10 h-10 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-white text-center mb-3">Reject Proposal?</h2>
                <p className="text-slate-300 text-center mb-6">
                  Are you sure you want to reject this proposal from <span className="font-semibold text-white">{bid.vendorName}</span>?
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
                  confirmAction === 'select'
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
