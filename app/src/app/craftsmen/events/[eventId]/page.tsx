'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  PhotoIcon,
  ClockIcon,
  CheckCircleIcon,
  BookmarkIcon,
  ShareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
  InboxIcon,
  XCircleIcon,
  HeartIcon,
  BriefcaseIcon,
  CakeIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

interface VendorSession {
  vendorId: string;
  email: string;
  businessName?: string;
}

interface EventData {
  eventId: string;
  eventMemory: {
    event_type: string;
    date: string;
    location: string;
    guest_count: string;
    venue_status: string;
  };
  checklistData?: {
    selections: Record<string, any>;
    notes: Record<string, string>;
    images?: Record<string, string[]>;
  };
  referenceImages?: string[];
  postedAt: string;
  status: string;
  bids: any[];
}

export default function VendorEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [session, setSession] = useState<VendorSession | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [hasExistingBid, setHasExistingBid] = useState(false);

  useEffect(() => {
    // Check authentication
    const sessionData = localStorage.getItem('vendor_session');
    if (!sessionData) {
      router.push('/craftsmen/login');
      return;
    }

    const parsedSession: VendorSession = JSON.parse(sessionData);
    setSession(parsedSession);

    // Load event
    loadEvent();

    // Check if vendor has already bid
    checkExistingBid(parsedSession.vendorId);
  }, [eventId, router]);

  const loadEvent = () => {
    setLoading(true);
    const postedEvents = JSON.parse(localStorage.getItem('posted_events') || '[]');
    const foundEvent = postedEvents.find((e: EventData) => e.eventId === eventId);

    if (!foundEvent) {
      setError('Event not found');
      setLoading(false);
      return;
    }

    setEvent(foundEvent);
    setLoading(false);

    // Check if saved
    const savedEvents = JSON.parse(localStorage.getItem('vendor_saved_events') || '[]');
    setSaved(savedEvents.includes(eventId));
  };

  const checkExistingBid = (vendorId: string) => {
    const allBids = JSON.parse(localStorage.getItem('vendor_bids') || '[]');
    const existingBid = allBids.find((bid: any) =>
      bid.vendorId === vendorId && bid.eventId === eventId
    );
    setHasExistingBid(!!existingBid);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSaveForLater = () => {
    const savedEvents = JSON.parse(localStorage.getItem('vendor_saved_events') || '[]');
    if (saved) {
      // Remove from saved
      const updated = savedEvents.filter((id: string) => id !== eventId);
      localStorage.setItem('vendor_saved_events', JSON.stringify(updated));
      setSaved(false);
    } else {
      // Add to saved
      savedEvents.push(eventId);
      localStorage.setItem('vendor_saved_events', JSON.stringify(savedEvents));
      setSaved(true);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleCopyEventId = () => {
    navigator.clipboard.writeText(eventId);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
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

  const getEventTypeIcon = (eventType: string) => {
    const type = eventType.toLowerCase();
    if (type.includes('wedding')) return HeartIcon;
    if (type.includes('corporate') || type.includes('conference')) return BriefcaseIcon;
    if (type.includes('birthday') || type.includes('party')) return CakeIcon;
    if (type.includes('launch')) return RocketLaunchIcon;
    return SparklesIcon;
  };

  const getCategoryIcon = (categoryId: string) => {
    if (categoryId.includes('venue')) return BuildingOffice2Icon;
    if (categoryId.includes('design') || categoryId.includes('decor')) return SparklesIcon;
    if (categoryId.includes('food')) return CakeIcon;
    if (categoryId.includes('photo')) return PhotoIcon;
    return DocumentTextIcon;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Event Not Found</h2>
          <p className="text-slate-400 mb-8">
            This event may have been removed or the link is incorrect.
          </p>
          <button
            onClick={() => router.push('/craftsmen/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const EventTypeIcon = getEventTypeIcon(event.eventMemory.event_type);
  const isClosed = event.status !== 'open';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/craftsmen/dashboard')}
              className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="font-medium">Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-3">
              {/* Event ID */}
              <button
                onClick={handleCopyEventId}
                className="flex items-center space-x-2 px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <DocumentDuplicateIcon className="h-4 w-4 text-slate-400" />
                <code className="text-xs font-mono text-slate-300">{eventId.slice(0, 12)}...</code>
              </button>

              {/* Status Badge */}
              <div className={`px-3 py-1.5 rounded-lg border ${
                isClosed
                  ? 'bg-slate-700/50 border-slate-600/50 text-slate-400'
                  : 'bg-green-500/20 border-green-500/30 text-green-400'
              }`}>
                <span className="text-xs font-semibold">
                  {isClosed ? 'Bidding Closed' : 'Open for Bids'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Hero Section - Event Overview */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Event Title */}
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <EventTypeIcon className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 capitalize">
                  {event.eventMemory.event_type} - {event.eventMemory.location}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-slate-400">
                  <span className="flex items-center space-x-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>Posted {getTimeAgo(event.postedAt)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <InboxIcon className="h-4 w-4" />
                    <span>{event.bids?.length || 0} proposal{event.bids?.length !== 1 ? 's' : ''} submitted</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Key Details Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-xs text-slate-400">Event Date</p>
                    <p className="text-base font-semibold text-white">
                      {new Date(event.eventMemory.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center space-x-3">
                  <MapPinIcon className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="text-base font-semibold text-white">{event.eventMemory.location}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center space-x-3">
                  <UsersIcon className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-xs text-slate-400">Guest Count</p>
                    <p className="text-base font-semibold text-white">{event.eventMemory.guest_count}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center space-x-3">
                  <BuildingOffice2Icon className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-xs text-slate-400">Venue Status</p>
                    <p className="text-base font-semibold text-white capitalize">{event.eventMemory.venue_status}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Competition Info */}
        {event.bids && event.bids.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <InboxIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-300 font-medium mb-1">
                  {event.bids.length} proposal{event.bids.length !== 1 ? 's' : ''} already submitted
                </p>
                <p className="text-sm text-blue-200/80">
                  Be competitive with your pricing and showcase your unique value proposition.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Core Requirements */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Event Requirements</h2>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-700/20 rounded-lg p-4 border border-slate-600/30">
              <p className="text-sm text-slate-400 mb-1">Event Type</p>
              <p className="text-lg font-semibold text-white capitalize">{event.eventMemory.event_type}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-700/20 rounded-lg p-4 border border-slate-600/30">
                <p className="text-sm text-slate-400 mb-1">Date</p>
                <p className="text-base font-semibold text-white">{event.eventMemory.date}</p>
              </div>

              <div className="bg-slate-700/20 rounded-lg p-4 border border-slate-600/30">
                <p className="text-sm text-slate-400 mb-1">Location</p>
                <p className="text-base font-semibold text-white">{event.eventMemory.location}</p>
              </div>

              <div className="bg-slate-700/20 rounded-lg p-4 border border-slate-600/30">
                <p className="text-sm text-slate-400 mb-1">Guest Count</p>
                <p className="text-base font-semibold text-white">{event.eventMemory.guest_count} guests</p>
              </div>

              <div className="bg-slate-700/20 rounded-lg p-4 border border-slate-600/30">
                <p className="text-sm text-slate-400 mb-1">Venue Status</p>
                <p className="text-base font-semibold text-white capitalize">{event.eventMemory.venue_status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Checklist */}
        {event.checklistData && Object.keys(event.checklistData.selections || {}).length > 0 ? (
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Detailed Checklist</h2>
            </div>

            <div className="space-y-3">
              {Object.entries(event.checklistData.notes || {}).map(([categoryId, notes]) => {
                const isExpanded = expandedCategories.has(categoryId);
                const CategoryIcon = getCategoryIcon(categoryId);
                const selections = event.checklistData?.selections[categoryId];

                return (
                  <div key={categoryId} className="bg-slate-700/20 rounded-xl border border-slate-600/50 overflow-hidden">
                    <button
                      onClick={() => toggleCategory(categoryId)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center">
                          <CategoryIcon className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white capitalize">
                          {categoryId.replace(/_/g, ' ')}
                        </h3>
                      </div>
                      {isExpanded ? (
                        <ChevronUpIcon className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-slate-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-600/50 p-4 bg-slate-800/30">
                        {selections && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-slate-300 mb-2">Selections:</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(selections).map(([key, value]) => (
                                <span
                                  key={key}
                                  className="px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full text-sm text-orange-300"
                                >
                                  {String(value)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {notes && (
                          <div>
                            <p className="text-sm font-medium text-slate-300 mb-2">Client Notes:</p>
                            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-600/30">
                              <p className="text-sm text-slate-200 leading-relaxed">{notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8 text-center">
            <DocumentTextIcon className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Client hasn't completed detailed checklist yet</p>
          </div>
        )}

        {/* Reference Images */}
        {event.referenceImages && event.referenceImages.length > 0 ? (
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center">
                <PhotoIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Reference Images</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {event.referenceImages.map((imageUrl, idx) => (
                <div key={idx} className="aspect-square bg-slate-700/50 rounded-lg overflow-hidden border border-slate-600/50 hover:border-orange-500/50 transition-all cursor-pointer">
                  <img
                    src={imageUrl}
                    alt={`Reference ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8 text-center">
            <PhotoIcon className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No reference images provided</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Secondary Actions */}
            <button
              onClick={handleSaveForLater}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 border rounded-lg font-semibold transition-all duration-200 ${
                saved
                  ? 'bg-orange-500/20 border-orange-500/30 text-orange-300'
                  : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <BookmarkIcon className="h-5 w-5" />
              <span>{saved ? 'Saved' : 'Save for Later'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-300 rounded-lg font-semibold transition-all duration-200"
            >
              <ShareIcon className="h-5 w-5" />
              <span>{copySuccess ? 'Copied!' : 'Share Event'}</span>
            </button>
          </div>

          {/* Primary CTA */}
          {!isClosed && (
            <div className="mt-4">
              <button
                onClick={() => router.push(`/craftsmen/events/${eventId}/bid`)}
                className={`w-full flex items-center justify-center space-x-2 px-8 py-4 rounded-xl font-bold text-white transition-all duration-300 transform shadow-2xl ${
                  hasExistingBid
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30 hover:shadow-blue-500/50'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105'
                }`}
              >
                <span className="text-lg">
                  {hasExistingBid ? 'View/Edit Your Proposal' : 'Submit Your Proposal'}
                </span>
                <ChevronDownIcon className="h-6 w-6 rotate-[-90deg]" />
              </button>
            </div>
          )}

          {isClosed && (
            <div className="mt-4 bg-slate-700/30 border border-slate-600/50 rounded-xl p-4 text-center">
              <p className="text-slate-400">Bidding has closed for this event</p>
            </div>
          )}
        </div>
      </div>

      {/* Copy Success Toast */}
      {copySuccess && (
        <div className="fixed bottom-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
          ✓ Copied to clipboard
        </div>
      )}
    </div>
  );
}
