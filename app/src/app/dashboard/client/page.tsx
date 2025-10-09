'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  EyeIcon,
  SparklesIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  InboxIcon
} from '@heroicons/react/24/outline';

interface PostedEvent {
  eventId: string;
  eventMemory: {
    event_type: string;
    date: string;
    location: string;
    guest_count: string;
    venue_status: string;
  };
  checklistData?: any;
  postedAt: string;
  status: 'open' | 'bidding' | 'in_progress' | 'completed';
  bids: any[];
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<PostedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = () => {
    setLoading(true);
    const storedEvents = localStorage.getItem('posted_events');
    if (storedEvents) {
      const parsedEvents = JSON.parse(storedEvents);
      setEvents(parsedEvents);
    }
    setLoading(false);
  };

  const getStatusDisplay = (event: PostedEvent) => {
    const bidsCount = event.bids?.length || 0;

    if (event.status === 'completed') {
      return {
        label: 'Completed',
        color: 'from-emerald-500 to-green-600',
        bgColor: 'bg-emerald-900/30',
        borderColor: 'border-emerald-500/30',
        textColor: 'text-emerald-300',
        icon: CheckCircleIcon
      };
    }

    if (event.status === 'in_progress') {
      return {
        label: 'In Progress',
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-900/30',
        borderColor: 'border-blue-500/30',
        textColor: 'text-blue-300',
        icon: ClockIcon
      };
    }

    if (bidsCount > 0) {
      return {
        label: `${bidsCount} Bid${bidsCount > 1 ? 's' : ''} Received`,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-900/30',
        borderColor: 'border-purple-500/30',
        textColor: 'text-purple-300',
        icon: InboxIcon
      };
    }

    return {
      label: 'Open for Bids',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-900/30',
      borderColor: 'border-orange-500/30',
      textColor: 'text-orange-300',
      icon: ClockIcon
    };
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatPostedDate = (postedAt: string) => {
    try {
      const date = new Date(postedAt);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading your events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                My Events
              </h1>
              <p className="text-slate-300 mt-2 text-sm sm:text-base">
                Track and manage your posted events
              </p>
            </div>
            <button
              onClick={() => router.push('/forge')}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/30 hover:scale-105"
            >
              <PlusCircleIcon className="h-5 w-5" />
              <span>Plan New Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {events.length === 0 ? (
          /* Empty State */
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-600/50">
                <SparklesIcon className="h-12 w-12 text-slate-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">No Events Posted Yet</h2>
              <p className="text-slate-400 mb-8">
                Start planning your first extraordinary event with EventFoundry
              </p>
              <button
                onClick={() => router.push('/forge')}
                className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-200 transform hover:scale-105"
              >
                <SparklesIcon className="h-5 w-5" />
                <span>Plan Your First Event</span>
              </button>
            </div>
          </div>
        ) : (
          /* Events Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {events.map((event) => {
              const statusInfo = getStatusDisplay(event);
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={event.eventId}
                  className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden hover:border-slate-600/50 transition-all duration-200"
                >
                  {/* Event Header */}
                  <div className="p-6 border-b border-slate-700/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-white capitalize mb-1">
                          {event.eventMemory.event_type}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Posted {formatPostedDate(event.postedAt)}
                        </p>
                      </div>
                      <div className={`px-3 py-1.5 ${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-full flex items-center space-x-2`}>
                        <StatusIcon className={`h-4 w-4 ${statusInfo.textColor}`} />
                        <span className={`text-xs font-semibold ${statusInfo.textColor}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Event ID */}
                    <div className="bg-slate-700/30 rounded-lg px-3 py-2 border border-slate-600/50">
                      <p className="text-xs text-slate-400 mb-1">Event ID</p>
                      <code className="text-sm font-mono text-orange-400 break-all">
                        {event.eventId}
                      </code>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="p-6 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4 text-orange-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500">Date</p>
                          <p className="text-sm text-white font-medium truncate">
                            {formatDate(event.eventMemory.date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <UsersIcon className="h-4 w-4 text-orange-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500">Guests</p>
                          <p className="text-sm text-white font-medium truncate">
                            {event.eventMemory.guest_count}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="h-4 w-4 text-orange-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-500">Location</p>
                        <p className="text-sm text-white font-medium truncate">
                          {event.eventMemory.location}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-6 pt-0">
                    <button
                      onClick={() => {
                        // Navigate to event details or bids page
                        router.push(`/dashboard/client/events/${event.eventId}`);
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500 text-white font-semibold rounded-lg transition-all duration-200"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>
                        {event.bids?.length > 0 ? `View ${event.bids.length} Bid${event.bids.length > 1 ? 's' : ''}` : 'View Event'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Footer */}
        {events.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Total Events</p>
                  <p className="text-2xl font-bold text-white">{events.length}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="h-6 w-6 text-orange-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Open for Bids</p>
                  <p className="text-2xl font-bold text-white">
                    {events.filter(e => e.status === 'open' && (!e.bids || e.bids.length === 0)).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-orange-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Total Bids</p>
                  <p className="text-2xl font-bold text-white">
                    {events.reduce((sum, e) => sum + (e.bids?.length || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <InboxIcon className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
