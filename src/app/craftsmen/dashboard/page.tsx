'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FolderOpenIcon,
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  ArrowRightIcon,
  SparklesIcon,
  TrophyIcon,
  ExclamationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../contexts/AuthContext';
import { getOpenEvents, getVendorByUserId, getBidsByVendorId } from '../../../lib/database';
import type { Event, Vendor, Bid } from '../../../types/database';

export default function VendorDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, isVendor } = useAuth();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    openEvents: 0,
    newEvents: 0,
    activeBids: 0,
    shortlisted: 0,
    totalBids: 0
  });

  const loadDashboardData = useCallback(async () => {
    console.log('[Vendor Dashboard] loadDashboardData called', { authLoading, isAuthenticated, isVendor, userId: user?.userId });

    if (authLoading) {
      console.log('[Vendor Dashboard] Auth still loading, skipping...');
      return;
    }

    // Check authentication
    if (!isAuthenticated || !user) {
      console.log('[Vendor Dashboard] Not authenticated, redirecting to login');
      router.push('/craftsmen/login');
      return;
    }

    // Check if user is vendor
    if (!isVendor) {
      console.log('[Vendor Dashboard] User is not a vendor');
      setError('Access denied. Vendor account required.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('[Vendor Dashboard] Loading vendor profile for userId:', user.userId);

      // Load vendor profile
      const { data: vendorData, error: vendorError } = await getVendorByUserId(user.userId);

      console.log('[Vendor Dashboard] Vendor profile result:', { vendorData, vendorError });

      if (vendorError || !vendorData) {
        console.error('[Vendor Dashboard] Vendor profile not found:', vendorError);
        setError('Vendor profile not found. Please complete your registration at /craftsmen/signup');
        setIsLoading(false);
        return;
      }

      setVendor(vendorData);

      // Check if vendor is verified
      if (!vendorData.verified) {
        setError('Your account is pending verification. You\'ll be able to bid once approved.');
      }

      // Load open events
      const { data: eventsData, error: eventsError } = await getOpenEvents();

      if (eventsError) {
        console.error('Error loading events:', eventsError);
      } else {
        setEvents(eventsData || []);
      }

      // Load vendor's bids
      const { data: bidsData, error: bidsError } = await getBidsByVendorId(vendorData.id);

      if (bidsError) {
        console.error('Error loading bids:', bidsError);
      } else {
        setMyBids(bidsData || []);
      }

      // Calculate stats
      const now = new Date();
      const openEventsCount = eventsData?.length || 0;
      const newEventsCount = eventsData?.filter(e => {
        const hoursSinceCreation = (now.getTime() - new Date(e.created_at).getTime()) / (1000 * 60 * 60);
        return hoursSinceCreation <= 24;
      }).length || 0;
      const activeBidsCount = bidsData?.filter(b => b.status === 'SUBMITTED').length || 0;
      const shortlistedCount = bidsData?.filter(b => b.status === 'SHORTLISTED').length || 0;
      const totalBidsCount = bidsData?.length || 0;

      setStats({
        openEvents: openEventsCount,
        newEvents: newEventsCount,
        activeBids: activeBidsCount,
        shortlisted: shortlistedCount,
        totalBids: totalBidsCount
      });

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data');
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, isVendor, user?.userId, router]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatTimeRemaining = (closesAt: string | null) => {
    if (!closesAt) return 'No deadline';

    const now = new Date();
    const deadline = new Date(closesAt);
    const diff = deadline.getTime() - now.getTime();

    if (diff < 0) return 'Closed';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Closing soon';
  };

  const hasBidOnEvent = (eventId: string) => {
    return myBids.some(bid => bid.event_id === eventId);
  };

  // Check if event is new (created in last 24 hours)
  const isNewEvent = (createdAt: string) => {
    const now = new Date();
    const eventCreated = new Date(createdAt);
    const hoursSinceCreation = (now.getTime() - eventCreated.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation <= 24;
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-lg rounded-2xl border border-slate-700 p-8 text-center">
          <ExclamationCircleIcon className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Setup Required</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <Link
            href="/craftsmen/signup"
            className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition"
          >
            Complete Registration
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Welcome back, {vendor?.company_name}
              </h1>
              <p className="text-slate-400 mt-1">
                {vendor?.verified ? 'Verified Vendor' : 'Pending Verification'} • {vendor?.city || 'Kerala'}
              </p>
            </div>
            <Link
              href="/craftsmen/profile"
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Verification Alert */}
        {error && vendor && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <ExclamationCircleIcon className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-orange-300 font-semibold mb-1">Verification Pending</h3>
                <p className="text-orange-200 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <FolderOpenIcon className="w-8 h-8 text-blue-400" />
              <span className="text-3xl font-bold text-white">{stats.openEvents}</span>
            </div>
            <p className="text-slate-400 text-sm">Open Events</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-lg rounded-xl border-2 border-orange-500/50 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between mb-2 relative">
              <SparklesIcon className="w-8 h-8 text-orange-400 animate-pulse" />
              <span className="text-3xl font-bold text-white">{stats.newEvents}</span>
            </div>
            <p className="text-orange-200 text-sm font-medium">New Events (24h)</p>
          </div>

          <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <TrophyIcon className="w-8 h-8 text-blue-400" />
              <span className="text-3xl font-bold text-white">{stats.activeBids}</span>
            </div>
            <p className="text-slate-400 text-sm">Active Bids</p>
          </div>

          <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <TrophyIcon className="w-8 h-8 text-green-400" />
              <span className="text-3xl font-bold text-white">{stats.shortlisted}</span>
            </div>
            <p className="text-slate-400 text-sm">Shortlisted</p>
          </div>

          <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <TrophyIcon className="w-8 h-8 text-purple-400" />
              <span className="text-3xl font-bold text-white">{stats.totalBids}</span>
            </div>
            <p className="text-slate-400 text-sm">Total Bids</p>
          </div>
        </div>

        {/* Open Events Section */}
        <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl border border-slate-700 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Open Events</h2>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpenIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">No open events available</p>
              <p className="text-slate-500 text-sm">New opportunities will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const alreadyBid = hasBidOnEvent(event.id);
                const isNew = isNewEvent(event.created_at);

                return (
                  <div
                    key={event.id}
                    className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 hover:border-orange-500/50 transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{event.title}</h3>
                          {isNew && (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full text-white text-xs font-bold shadow-lg animate-pulse">
                              <SparklesIcon className="w-3.5 h-3.5" />
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="w-4 h-4 text-slate-400" />
                            <span>{event.date || 'Date TBD'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPinIcon className="w-4 h-4 text-slate-400" />
                            <span>{event.city || 'Location TBD'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <UsersIcon className="w-4 h-4 text-slate-400" />
                            <span>{event.guest_count || 'TBD'} guests</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        {event.bidding_closes_at && (
                          <div className="flex items-center space-x-2 text-sm text-orange-400">
                            <ClockIcon className="w-4 h-4" />
                            <span>{formatTimeRemaining(event.bidding_closes_at)}</span>
                          </div>
                        )}
                        <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-xs font-medium">
                          {event.forge_status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                      <span className="text-sm text-slate-400">
                        Event Type: <span className="text-slate-300 font-medium">{event.event_type}</span>
                      </span>

                      {alreadyBid ? (
                        <div className="flex items-center space-x-2 text-blue-400">
                          <span className="text-sm font-medium">Bid Submitted</span>
                          <Link
                            href={`/craftsmen/events/${event.id}/bid`}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition"
                          >
                            View Bid
                          </Link>
                        </div>
                      ) : (
                        <Link
                          href={`/craftsmen/events/${event.id}/bid`}
                          className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition transform hover:scale-105"
                        >
                          <span>Submit Bid</span>
                          <ArrowRightIcon className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Bids Section */}
        {myBids.length > 0 && (
          <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl border border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">My Recent Bids</h2>
            <div className="space-y-4">
              {myBids.slice(0, 5).map((bid) => (
                <div
                  key={bid.id}
                  className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white font-medium mb-1">Bid #{bid.id.substring(0, 8)}</p>
                    <p className="text-sm text-slate-400">
                      Amount: <span className="text-orange-400 font-semibold">₹{bid.total_forge_cost.toLocaleString()}</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      bid.status === 'ACCEPTED' ? 'bg-green-500/10 border border-green-500/30 text-green-400' :
                      bid.status === 'SHORTLISTED' ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400' :
                      bid.status === 'SUBMITTED' ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400' :
                      'bg-slate-500/10 border border-slate-500/30 text-slate-400'
                    }`}>
                      {bid.status}
                    </span>
                    <Link
                      href={`/craftsmen/events/${bid.event_id}/bid`}
                      className="text-orange-400 hover:text-orange-300 text-sm font-medium"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
