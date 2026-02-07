'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../../contexts/AuthContext';
import {
  TrophyIcon,
  CheckCircleIcon,
  UserCircleIcon,
  SparklesIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../../../../../../components/ui/LoadingSpinner';
import { useToast } from '../../../../../../components/ui/Toast';

interface BidItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ShortlistedBid {
  bidId: string;
  craftsmanId: string;
  craftsmanName: string;
  craftsmanRating: number;
  craftsmanCompletedEvents: number;
  items: BidItem[];
  subtotal: number;
  taxes: number;
  total: number;
  notes: string;
  isRevised: boolean;
  originalTotal?: number;
  isLowestBid: boolean;
  percentageAboveLowest: number;
}

interface EventData {
  eventId: string;
  eventTitle: string;
  eventType: string;
  date: string;
  city: string;
  shortlistedBids: ShortlistedBid[];
  floorPrice: number;
}

export default function WinnerSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const eventId = params.eventId as string;
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);
  const [expandedBidId, setExpandedBidId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadEventData();
  }, [isAuthenticated, eventId]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/events/${eventId}/shortlisted-bids`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load event data');
      }

      const data = await response.json();
      setEventData(data);

      // Auto-expand lowest bid
      const lowestBid = data.shortlistedBids.find((b: ShortlistedBid) => b.isLowestBid);
      if (lowestBid) {
        setExpandedBidId(lowestBid.bidId);
      }
    } catch (err) {
      console.error('Error loading event data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWinner = async () => {
    if (!selectedBidId) {
      displayToast('Please select a vendor first', 'error');
      return;
    }

    const confirmed = confirm(
      'Are you sure you want to select this vendor as the winner? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setSelecting(true);

      const response = await fetch(`/api/events/${eventId}/select-winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId: selectedBidId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to select winner');
      }

      displayToast('Winner selected successfully! Generating contract...', 'success');

      setTimeout(() => {
        router.push(`/dashboard/client/events/${eventId}`);
      }, 2000);
    } catch (err) {
      console.error('Error selecting winner:', err);
      displayToast(err instanceof Error ? err.message : 'Failed to select winner', 'error');
    } finally {
      setSelecting(false);
    }
  };

  const displayToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.showSuccess(message);
    } else {
      toast.showError(message);
    }
  };

  const viewVendorProfile = (craftsmanId: string) => {
    window.open(`/vendors/${craftsmanId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-6">
        <div className="bg-red-900/20 border-2 border-red-500/50 rounded-xl p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-slate-300">{error || 'Failed to load event data'}</p>
          <button
            onClick={() => router.push('/dashboard/client')}
            className="mt-4 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/dashboard/client/events/${eventId}/bids`)}
          className="mb-6 flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to All Bids
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-900/40 to-pink-900/40 border-2 border-orange-500/30 rounded-xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center shadow-lg">
              <TrophyIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Select Your Winner</h1>
              <p className="text-orange-300">{eventData.eventTitle}</p>
            </div>
          </div>
          <p className="text-slate-300">
            Review the final bids from your shortlisted vendors and select the best match for your event.
          </p>
        </div>

        {/* Shortlisted Bids Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {eventData.shortlistedBids.map((bid) => (
            <div
              key={bid.bidId}
              className={`bg-slate-800/50 backdrop-blur-xl border-2 rounded-xl p-6 transition-all cursor-pointer ${
                selectedBidId === bid.bidId
                  ? 'border-orange-500 shadow-lg shadow-orange-500/30'
                  : 'border-slate-700/50 hover:border-slate-600'
              } ${bid.isLowestBid ? 'ring-2 ring-emerald-500/30' : ''}`}
              onClick={() => setSelectedBidId(bid.bidId)}
            >
              {/* Lowest Bid Badge */}
              {bid.isLowestBid && (
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full">
                    <SparklesIcon className="w-4 h-4" />
                    Lowest Bid
                  </span>
                </div>
              )}

              {/* Revised Badge */}
              {bid.isRevised && (
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold px-3 py-1 rounded-full">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    Revised Bid
                    {bid.originalTotal && (
                      <span className="ml-1">
                        (was ₹{bid.originalTotal.toLocaleString('en-IN')})
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* Vendor Info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{bid.craftsmanName}</h3>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      ⭐ {bid.craftsmanRating.toFixed(1)}
                    </span>
                    <span>•</span>
                    <span>{bid.craftsmanCompletedEvents} events completed</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    viewVendorProfile(bid.craftsmanId);
                  }}
                  className="flex items-center gap-1 text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
                >
                  <UserCircleIcon className="w-5 h-5" />
                  View Profile
                </button>
              </div>

              {/* Pricing */}
              <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400">Total Bid Amount</span>
                  <span className="text-2xl font-bold text-white">
                    ₹{bid.total.toLocaleString('en-IN')}
                  </span>
                </div>
                {!bid.isLowestBid && (
                  <div className="text-right">
                    <span className="text-sm text-slate-400">
                      {bid.percentageAboveLowest}% above lowest bid
                    </span>
                  </div>
                )}
              </div>

              {/* Expand/Collapse Items */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedBidId(expandedBidId === bid.bidId ? null : bid.bidId);
                }}
                className="text-orange-400 hover:text-orange-300 text-sm font-medium mb-3 transition-colors"
              >
                {expandedBidId === bid.bidId ? '▼ Hide Details' : '▶ Show Details'}
              </button>

              {/* Bid Items (Expandable) */}
              {expandedBidId === bid.bidId && (
                <div className="space-y-2 mb-4">
                  {bid.items.map((item, idx) => (
                    <div key={idx} className="bg-slate-700/30 rounded-lg p-3">
                      <p className="text-white font-medium mb-1">{item.description}</p>
                      <div className="text-sm text-slate-400 flex justify-between">
                        <span>
                          {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="font-semibold text-white">
                          ₹{item.total.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-slate-600 pt-2 mt-3 space-y-1">
                    <div className="flex justify-between text-slate-400 text-sm">
                      <span>Subtotal:</span>
                      <span>₹{bid.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-sm">
                      <span>Taxes (18%):</span>
                      <span>₹{bid.taxes.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {bid.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <p className="text-slate-400 text-xs mb-1">Vendor Notes:</p>
                      <p className="text-slate-300 text-sm">{bid.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Selection Indicator */}
              {selectedBidId === bid.bidId && (
                <div className="flex items-center gap-2 text-orange-400 font-semibold mt-3">
                  <CheckCircleIcon className="w-5 h-5" />
                  Selected
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selection Summary & Action */}
        {selectedBidId && (
          <div className="bg-gradient-to-r from-orange-900/40 to-amber-900/40 border-2 border-orange-500/30 rounded-xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Ready to Commission?</h3>
                <p className="text-slate-300 text-sm">
                  Once you confirm, we'll notify the selected vendor and generate your contract.
                  All other vendors will be informed that the position has been filled.
                </p>
              </div>
              <button
                onClick={handleSelectWinner}
                disabled={selecting}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-4 px-8 rounded-lg transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {selecting ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner />
                    Selecting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <TrophyIcon className="w-6 h-6" />
                    Confirm & Commission Winner
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {!selectedBidId && (
          <div className="bg-blue-900/20 border-2 border-blue-500/30 rounded-xl p-6 text-center">
            <p className="text-blue-300 font-semibold">
              Select a vendor above to proceed with commissioning
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
