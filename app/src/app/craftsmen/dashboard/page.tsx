'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FolderOpenIcon,
  DocumentTextIcon,
  StarIcon,
  TrophyIcon,
  InboxIcon,
  SparklesIcon,
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  CurrencyRupeeIcon,
  BuildingOffice2Icon,
  ArrowRightIcon,
  FunnelIcon,
  XMarkIcon,
  HeartIcon,
  BriefcaseIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import ProfileCompletionWidget from '@/components/vendor/ProfileCompletionWidget';

interface VendorSession {
  vendorId: string;
  email: string;
  companyName: string;
  loginTime: string;
}

interface Event {
  id: string;
  title: string;
  eventType: string;
  date: string;
  location: string;
  city: string;
  guestCount: number;
  budgetRange?: string;
  status: string;
  postedAt: string;
  bidsCount: number;
  description?: string;
}

export default function VendorDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<VendorSession | null>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);

  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('Upcoming');
  const [locationFilter, setLocationFilter] = useState('All Kerala');
  const [guestCountFilter, setGuestCountFilter] = useState(1000);

  // Stats
  const [stats, setStats] = useState({
    openEvents: 0,
    activeBids: 0,
    shortlisted: 0,
    wonThisMonth: 0
  });

  useEffect(() => {
    // Check authentication
    const sessionData = localStorage.getItem('vendor_session');
    if (!sessionData) {
      router.push('/craftsmen/login');
      return;
    }

    const parsedSession: VendorSession = JSON.parse(sessionData);
    setSession(parsedSession);

    // Load vendor details
    const activeVendors = JSON.parse(localStorage.getItem('active_vendors') || '[]');
    const vendorData = activeVendors.find((v: any) => v.id === parsedSession.vendorId);
    if (vendorData) {
      setVendor(vendorData);
    }

    // Load events
    loadEvents();

    // Load vendor's bids
    const allBids = JSON.parse(localStorage.getItem('vendor_bids') || '[]');
    const vendorBids = allBids.filter((bid: any) => bid.vendorId === parsedSession.vendorId);
    setMyBids(vendorBids);

    // Calculate stats
    calculateStats(vendorBids);
  }, [router]);

  const loadEvents = () => {
    console.log('Dashboard mounted - loading events');

    // Load real posted events from localStorage
    let postedEvents = JSON.parse(localStorage.getItem('posted_events') || '[]');
    console.log('Posted events from localStorage:', postedEvents);

    // Transform real events to match dashboard schema
    const transformedEvents = postedEvents.map((e: any) => ({
      id: e.eventId,
      title: `${e.eventMemory?.event_type || 'Event'} - ${e.eventMemory?.location || 'Location'}`,
      eventType: e.eventMemory?.event_type || 'Event',
      date: e.eventMemory?.date || new Date().toISOString(),
      location: e.eventMemory?.location || 'India',
      city: e.eventMemory?.location?.split(',')[0] || e.eventMemory?.location || 'India',
      guestCount: parseInt(e.eventMemory?.guest_count) || 0,
      budgetRange: 'Contact for quote',
      status: e.status || 'open',
      postedAt: e.postedAt || new Date().toISOString(),
      bidsCount: e.bids?.length || 0,
      description: `${e.eventMemory?.event_type} for ${e.eventMemory?.guest_count} guests`
    }));

    console.log('Transformed events:', transformedEvents);

    // If no real events, create sample events for demo
    if (transformedEvents.length === 0) {
      console.log('No real events found - creating sample events');
      postedEvents = [
        {
          id: 'evt_001',
          title: 'Destination Wedding in Kochi',
          eventType: 'Destination Wedding',
          date: '2025-06-15',
          location: 'Kochi, Kerala',
          city: 'Kochi',
          guestCount: 250,
          budgetRange: '₹8-12L',
          status: 'open',
          postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          bidsCount: 5,
          description: 'Looking for full-service event management for a 3-day destination wedding'
        },
        {
          id: 'evt_002',
          title: 'Corporate Annual Conference',
          eventType: 'Corporate Event',
          date: '2025-07-20',
          location: 'Thiruvananthapuram, Kerala',
          city: 'Thiruvananthapuram',
          guestCount: 400,
          budgetRange: '₹15-20L',
          status: 'open',
          postedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          bidsCount: 8,
          description: '2-day corporate conference with accommodation and entertainment'
        },
        {
          id: 'evt_003',
          title: 'Traditional Kerala Wedding',
          eventType: 'Traditional Wedding',
          date: '2025-08-10',
          location: 'Thrissur, Kerala',
          city: 'Thrissur',
          guestCount: 600,
          budgetRange: '₹10-15L',
          status: 'open',
          postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          bidsCount: 12,
          description: 'Traditional wedding ceremony with cultural performances'
        },
        {
          id: 'evt_004',
          title: 'Product Launch Event',
          eventType: 'Product Launch',
          date: '2025-06-25',
          location: 'Kochi, Kerala',
          city: 'Kochi',
          guestCount: 150,
          budgetRange: '₹5-8L',
          status: 'open',
          postedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          bidsCount: 3,
          description: 'Tech product launch with media coverage and influencer management'
        },
        {
          id: 'evt_005',
          title: 'Cultural Festival Celebration',
          eventType: 'Cultural Event',
          date: '2025-09-05',
          location: 'Kozhikode, Kerala',
          city: 'Kozhikode',
          guestCount: 800,
          budgetRange: '₹12-18L',
          status: 'open',
          postedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          bidsCount: 7,
          description: 'Multi-day cultural festival with traditional performances'
        }
      ];
      // Set sample events without saving to localStorage
      setEvents(postedEvents.filter((e: Event) => e.status === 'open'));
      setFilteredEvents(postedEvents.filter((e: Event) => e.status === 'open'));
    } else {
      // Use transformed real events
      const openEvents = transformedEvents.filter((e: Event) => e.status === 'open');
      console.log('Open events after filtering:', openEvents);
      setEvents(openEvents);
      setFilteredEvents(openEvents);
    }
  };

  const calculateStats = (vendorBids: any[]) => {
    const openEventsCount = events.filter(e => e.status === 'open').length;
    const activeBidsCount = vendorBids.filter(b =>
      b.status !== 'rejected' && b.status !== 'selected_other'
    ).length;
    const shortlistedCount = vendorBids.filter(b => b.status === 'shortlisted').length;

    // Calculate won this month
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const wonThisMonth = vendorBids
      .filter(b => {
        if (b.status !== 'won') return false;
        const wonDate = new Date(b.wonAt || b.updatedAt);
        return wonDate.getMonth() === thisMonth && wonDate.getFullYear() === thisYear;
      })
      .reduce((sum, b) => sum + (b.bidAmount || 0), 0);

    setStats({
      openEvents: openEventsCount,
      activeBids: activeBidsCount,
      shortlisted: shortlistedCount,
      wonThisMonth: wonThisMonth
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('vendor_session');
    router.push('/craftsmen/login');
  };

  const applyFilters = () => {
    console.log('Applying filters...');
    console.log('All events:', events);
    let filtered = [...events];

    // Event type filter
    if (eventTypeFilter !== 'All') {
      filtered = filtered.filter(e => e.eventType === eventTypeFilter);
      console.log('After event type filter:', filtered);
    }

    // TEMPORARILY REMOVED: Location filter (show all locations for testing)
    // if (locationFilter !== 'All Kerala') {
    //   filtered = filtered.filter(e => e.city === locationFilter);
    // }

    // Guest count filter
    filtered = filtered.filter(e => e.guestCount <= guestCountFilter);
    console.log('After guest count filter:', filtered);

    // Date range filter
    const now = new Date();
    if (dateRangeFilter === 'This Month') {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filtered = filtered.filter(e => new Date(e.date) <= endOfMonth);
    } else if (dateRangeFilter === 'Next 3 Months') {
      const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(e => new Date(e.date) <= threeMonthsLater);
    } else if (dateRangeFilter === 'Upcoming') {
      filtered = filtered.filter(e => new Date(e.date) >= now);
    }

    console.log('Filtered events (final):', filtered);
    setFilteredEvents(filtered);
  };

  const clearFilters = () => {
    setEventTypeFilter('All');
    setDateRangeFilter('Upcoming');
    setLocationFilter('All Kerala');
    setGuestCountFilter(1000);
    setFilteredEvents(events);
  };

  useEffect(() => {
    if (events.length > 0) {
      applyFilters();
    }
  }, [eventTypeFilter, dateRangeFilter, locationFilter, guestCountFilter, events]);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'Destination Wedding':
      case 'Traditional Wedding':
        return HeartIcon;
      case 'Corporate Event':
        return BriefcaseIcon;
      case 'Cultural Event':
        return GlobeAltIcon;
      case 'Product Launch':
        return SparklesIcon;
      default:
        return CalendarIcon;
    }
  };

  const getEventBadgeColor = (eventType: string) => {
    switch (eventType) {
      case 'Destination Wedding':
      case 'Traditional Wedding':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'Corporate Event':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Cultural Event':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Product Launch':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const posted = new Date(timestamp).getTime();
    const diffMs = now - posted;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const hasVendorBid = (eventId: string) => {
    return myBids.some(bid => bid.eventId === eventId);
  };

  if (!session || !vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Top Navigation */}
      <nav className="bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/craftsmen/dashboard" className="flex items-center space-x-2">
              <BuildingOffice2Icon className="w-8 h-8 text-orange-500" />
              <span className="text-xl font-bold text-white hidden sm:block">EventFoundry</span>
            </Link>

            {/* Company Name */}
            <div className="text-center flex-1 px-4">
              <p className="text-sm text-slate-400">Welcome back,</p>
              <p className="text-lg font-semibold text-white">{session.companyName}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <Link
                href="/craftsmen/my-bids"
                className="hidden sm:block px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                My Bids
              </Link>
              <Link
                href="/craftsmen/dashboard/profile/edit"
                className="hidden sm:block px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Profile
              </Link>
              <Link
                href="/vendors"
                className="hidden lg:block px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Browse Vendors
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Open Events */}
          <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <FolderOpenIcon className="w-8 h-8 text-blue-400" />
              <span className="text-3xl font-bold text-white">{stats.openEvents}</span>
            </div>
            <p className="text-sm text-slate-400">Open Events</p>
          </div>

          {/* My Active Bids */}
          <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <DocumentTextIcon className="w-8 h-8 text-orange-400" />
              <span className="text-3xl font-bold text-white">{stats.activeBids}</span>
            </div>
            <p className="text-sm text-slate-400">My Active Bids</p>
          </div>

          {/* Shortlisted */}
          <div className={`backdrop-blur-lg rounded-xl border p-6 ${
            stats.shortlisted > 0
              ? 'bg-yellow-500/10 border-yellow-500/30'
              : 'bg-slate-800/90 border-slate-700'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <StarIcon className={`w-8 h-8 ${stats.shortlisted > 0 ? 'text-yellow-400' : 'text-slate-400'}`} />
              <span className={`text-3xl font-bold ${stats.shortlisted > 0 ? 'text-yellow-400' : 'text-white'}`}>
                {stats.shortlisted}
              </span>
            </div>
            <p className="text-sm text-slate-400">Shortlisted</p>
          </div>

          {/* Won This Month */}
          <div className={`backdrop-blur-lg rounded-xl border p-6 ${
            stats.wonThisMonth > 0
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-slate-800/90 border-slate-700'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <TrophyIcon className={`w-8 h-8 ${stats.wonThisMonth > 0 ? 'text-green-400' : 'text-slate-400'}`} />
              <span className={`text-2xl font-bold ${stats.wonThisMonth > 0 ? 'text-green-400' : 'text-white'}`}>
                ₹{(stats.wonThisMonth / 100000).toFixed(1)}L
              </span>
            </div>
            <p className="text-sm text-slate-400">Won This Month</p>
          </div>
        </div>

        {/* Profile Completion Widget */}
        <div className="mb-8">
          <ProfileCompletionWidget />
        </div>

        {/* Filters Bar */}
        <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl border border-slate-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-semibold text-white">Filter Events</h3>
            </div>
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              <span>Clear Filters</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Event Type</label>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option>All</option>
                <option>Wedding</option>
                <option>Corporate Event</option>
                <option>Birthday Party</option>
                <option>Product Launch</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Date Range</label>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option>Upcoming</option>
                <option>This Month</option>
                <option>Next 3 Months</option>
                <option>All</option>
              </select>
            </div>

            {/* Guest Count */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Max Guest Count: {guestCountFilter === 1000 ? '1000+' : guestCountFilter}
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={guestCountFilter}
                onChange={(e) => setGuestCountFilter(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Events Feed Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            Available Events ({filteredEvents.length})
          </h2>
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredEvents.map((event) => {
              const EventIcon = getEventIcon(event.eventType);
              const badgeColor = getEventBadgeColor(event.eventType);
              const alreadyBid = hasVendorBid(event.id);

              return (
                <div
                  key={event.id}
                  className="bg-slate-800/90 backdrop-blur-lg rounded-xl border border-slate-700 p-6 hover:border-orange-500/30 hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                >
                  {/* Event Type Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center space-x-2 px-3 py-1 border rounded-full ${badgeColor}`}>
                      <EventIcon className="w-4 h-4" />
                      <span className="text-xs font-semibold">{event.eventType}</span>
                    </div>
                    <span className="text-xs text-slate-500">{getTimeAgo(event.postedAt)}</span>
                  </div>

                  {/* Event Title */}
                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-orange-400 transition-colors">
                    {event.title}
                  </h3>

                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-slate-300">
                      <CalendarIcon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm">{new Date(event.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-300">
                      <MapPinIcon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm">{event.location}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-300">
                      <UsersIcon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm">{event.guestCount} guests</span>
                    </div>

                    {event.budgetRange && (
                      <div className="flex items-center space-x-2 text-slate-300">
                        <CurrencyRupeeIcon className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium">{event.budgetRange}</span>
                      </div>
                    )}
                  </div>

                  {/* Bids Count */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700">
                    <span className="text-xs text-slate-400">
                      {event.bidsCount} proposal{event.bidsCount !== 1 ? 's' : ''} submitted
                    </span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                      Open
                    </span>
                  </div>

                  {/* Action Button */}
                  {alreadyBid ? (
                    <Link
                      href={`/craftsmen/events/${event.id}`}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 font-semibold rounded-lg transition-all duration-300"
                    >
                      <span>View Your Bid</span>
                      <ArrowRightIcon className="w-5 h-5" />
                    </Link>
                  ) : (
                    <Link
                      href={`/craftsmen/events/${event.id}`}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-300 transform group-hover:scale-105"
                    >
                      <span>View Details & Bid</span>
                      <ArrowRightIcon className="w-5 h-5" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl border border-slate-700 p-12 text-center">
            <InboxIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No events match your filters</h3>
            <p className="text-slate-400 mb-6">Try adjusting your filters to see more opportunities</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-300"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
