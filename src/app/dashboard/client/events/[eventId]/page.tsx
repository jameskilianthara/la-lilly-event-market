'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  SparklesIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

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

export default function ClientEventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

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

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getLowestBid = () => {
    if (!event?.bids || event.bids.length === 0) return 0;
    return Math.min(...event.bids.map(b => b.total));
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      open: { label: 'Open for Bids', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
      pending: { label: 'Under Review', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
      selected: { label: 'Winner Selected', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
      completed: { label: 'Completed', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' }
    };
    const badge = badges[status as keyof typeof badges] || badges.open;
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading event details...</p>
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

  const lowestBid = getLowestBid();
  const shortlistedCount = event.bids?.filter(b => b.status === 'shortlisted').length || 0;
  const selectedBid = event.bids?.find(b => b.status === 'selected');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link
          href="/dashboard/client"
          className="inline-flex items-center space-x-2 text-slate-300 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 sm:p-8 mb-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white capitalize mb-2">
                {event.eventMemory.event_type}
              </h1>
              <p className="text-slate-400">Event ID: {event.eventId}</p>
            </div>
            {getStatusBadge(event.status)}
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-700/20 backdrop-blur-sm rounded-xl p-4 border border-slate-600/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Event Date</p>
                  <p className="text-sm font-semibold text-white">{formatDate(event.eventMemory.date)}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/20 backdrop-blur-sm rounded-xl p-4 border border-slate-600/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <MapPinIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Location</p>
                  <p className="text-sm font-semibold text-white">{event.eventMemory.location}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/20 backdrop-blur-sm rounded-xl p-4 border border-slate-600/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Guest Count</p>
                  <p className="text-sm font-semibold text-white">{event.eventMemory.guest_count} guests</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/20 backdrop-blur-sm rounded-xl p-4 border border-slate-600/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <BuildingOfficeIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Venue</p>
                  <p className="text-sm font-semibold text-white capitalize">{event.eventMemory.venue_status.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bids Section */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Vendor Proposals</h2>
              <p className="text-slate-400">
                {event.bids?.length || 0} proposal{event.bids?.length !== 1 ? 's' : ''} received
                {shortlistedCount > 0 && ` • ${shortlistedCount} shortlisted`}
              </p>
            </div>
            {event.bids && event.bids.length > 0 && (
              <Link
                href={`/dashboard/client/events/${eventId}/bids`}
                className="hidden sm:flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 transition-all duration-300 transform hover:scale-105"
              >
                <span>Review All Proposals</span>
                <ChevronRightIcon className="w-5 h-5" />
              </Link>
            )}
          </div>

          {selectedBid && (
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6 mb-6">
              <div className="flex items-start space-x-3">
                <SparklesIcon className="w-6 h-6 text-green-400 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-300 mb-1">Winner Selected! 🎉</h3>
                  <p className="text-slate-300">
                    You've selected <span className="font-semibold text-white">{selectedBid.vendorName}</span> as your event partner
                  </p>
                  <p className="text-sm text-slate-400 mt-2">
                    Winning bid: ₹{selectedBid.total.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!event.bids || event.bids.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-slate-700/30 flex items-center justify-center mx-auto mb-4">
                <DocumentTextIcon className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No Proposals Yet</h3>
              <p className="text-slate-400 mb-6">Vendors are reviewing your event. Check back soon!</p>
            </div>
          ) : (
            <>
              {/* Bid Summary Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {event.bids.slice(0, 4).map((bid) => {
                  const percentAbove = lowestBid > 0 ? (((bid.total - lowestBid) / lowestBid) * 100) : 0;
                  const isLowest = bid.total === lowestBid;

                  return (
                    <div
                      key={bid.bidId}
                      className="bg-slate-700/20 backdrop-blur-sm border border-slate-600/30 rounded-xl p-5 hover:border-orange-500/50 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">{bid.vendorName}</h3>
                          <p className="text-sm text-slate-400">{bid.vendorEmail}</p>
                        </div>
                        {bid.status === 'selected' && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-xs font-semibold">
                            Winner
                          </span>
                        )}
                        {bid.status === 'shortlisted' && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-xs font-semibold">
                            Shortlisted
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline space-x-2 mb-3">
                        <CurrencyRupeeIcon className="w-5 h-5 text-orange-400 mt-1" />
                        <span className="text-2xl font-bold text-white">
                          {bid.total.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {isLowest ? (
                        <span className="inline-flex items-center px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-xs font-semibold mb-3">
                          Lowest Price 🏆
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-full text-xs font-semibold mb-3">
                          +{percentAbove.toFixed(1)}% above lowest
                        </span>
                      )}

                      <div className="flex items-center space-x-2 text-xs text-slate-400 mb-4">
                        <ClockIcon className="w-4 h-4" />
                        <span>Submitted {new Date(bid.submittedAt).toLocaleDateString('en-IN')}</span>
                      </div>

                      <Link
                        href={`/dashboard/client/events/${eventId}/bids/${bid.bidId}`}
                        className="block w-full text-center px-4 py-2 bg-slate-600/30 hover:bg-slate-600/50 text-white font-medium rounded-lg transition-colors"
                      >
                        View Full Proposal
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Review All Button (Mobile) */}
              {event.bids.length > 0 && (
                <Link
                  href={`/dashboard/client/events/${eventId}/bids`}
                  className="sm:hidden flex items-center justify-center space-x-2 w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 transition-all duration-300"
                >
                  <span>Review All {event.bids.length} Proposal{event.bids.length !== 1 ? 's' : ''}</span>
                  <ChevronRightIcon className="w-5 h-5" />
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
