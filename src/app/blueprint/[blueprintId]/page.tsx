'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  CheckCircleIcon,
  RocketLaunchIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { getEventById, updateEvent } from '../../../lib/database';
import { useAuth } from '../../../contexts/AuthContext';
import type { Event } from '../../../types/database';

export default function BlueprintReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const eventId = params.blueprintId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCommissioning, setIsCommissioning] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId, isAuthenticated]);

  const loadEvent = async () => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setError('Please sign in to view your event');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await getEventById(eventId);

      if (fetchError) {
        console.error('Error fetching event:', fetchError);
        setError('Failed to load event. Please try again.');
        setIsLoading(false);
        return;
      }

      if (!data) {
        setError('Event not found');
        setIsLoading(false);
        return;
      }

      // Check if user owns this event
      if (data.owner_user_id !== user?.userId) {
        setError('You do not have permission to view this event');
        setIsLoading(false);
        return;
      }

      setEvent(data);
      setIsLoading(false);
    } catch (err) {
      console.error('Unexpected error loading event:', err);
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleCommissionProject = async () => {
    if (!event) return;

    setIsCommissioning(true);

    try {
      // Calculate bidding close date (7 days from now)
      const biddingClosesAt = new Date();
      biddingClosesAt.setDate(biddingClosesAt.getDate() + 7);

      // Update event status to OPEN_FOR_BIDS
      const { error: updateError } = await updateEvent(event.id, {
        forge_status: 'OPEN_FOR_BIDS',
        bidding_closes_at: biddingClosesAt.toISOString()
      });

      if (updateError) {
        console.error('Error commissioning project:', updateError);
        alert('Failed to commission project. Please try again.');
        setIsCommissioning(false);
        return;
      }

      // Navigate to event dashboard or marketplace
      router.push(`/dashboard/client?event=${event.id}`);
    } catch (err) {
      console.error('Unexpected error commissioning:', err);
      alert('An unexpected error occurred');
      setIsCommissioning(false);
    }
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading your event blueprint...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-lg rounded-2xl border border-slate-700 p-8 text-center">
          <ExclamationCircleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Unable to Load Event</h2>
          <p className="text-slate-300 mb-6">{error || 'Event not found'}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/forge')}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition"
            >
              Create New Event
            </button>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const clientBrief = event.client_brief as any;
  const forgeBlueprint = event.forge_blueprint as any;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-slate-400 hover:text-slate-200 transition mb-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>
              <h1 className="text-3xl font-bold text-white">{event.title}</h1>
              <p className="text-slate-400 mt-1">Review your event blueprint</p>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">Blueprint Ready</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Summary Card */}
            <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl border border-slate-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Event Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-xs text-slate-400">Date</p>
                    <p className="text-slate-200 font-medium">{clientBrief?.date || 'TBD'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPinIcon className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-xs text-slate-400">City</p>
                    <p className="text-slate-200 font-medium">{event.city || 'TBD'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <UsersIcon className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-xs text-slate-400">Guests</p>
                    <p className="text-slate-200 font-medium">{event.guest_count || 'TBD'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-xs text-slate-400">Venue</p>
                    <p className="text-slate-200 font-medium">{clientBrief?.venue_status || 'TBD'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Blueprint Sections */}
            <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl border border-slate-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Event Blueprint</h2>

              {forgeBlueprint?.sections?.length > 0 ? (
                <div className="space-y-4">
                  {forgeBlueprint.sections.map((section: any, idx: number) => (
                    <div key={idx} className="border border-slate-700 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-orange-400 mb-2">
                        {section.title || `Section ${idx + 1}`}
                      </h3>
                      {section.description && (
                        <p className="text-slate-400 text-sm mb-3">{section.description}</p>
                      )}
                      {section.items?.length > 0 && (
                        <ul className="space-y-2">
                          {section.items.map((item: any, itemIdx: number) => (
                            <li key={itemIdx} className="flex items-start space-x-2">
                              <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                              <span className="text-slate-300">{item.label || item.id}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400">Blueprint details will be customized for your event</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-6">
            {/* Commission Project Card */}
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 backdrop-blur-lg rounded-xl border border-orange-500/30 p-6">
              <RocketLaunchIcon className="w-12 h-12 text-orange-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Ready to Launch?</h3>
              <p className="text-slate-300 text-sm mb-6">
                Commission your event and start receiving bids from qualified vendors.
              </p>
              <button
                onClick={handleCommissionProject}
                disabled={isCommissioning}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                {isCommissioning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Commissioning...</span>
                  </>
                ) : (
                  <>
                    <RocketLaunchIcon className="w-5 h-5" />
                    <span>Commission Project</span>
                  </>
                )}
              </button>
            </div>

            {/* Event Details Card */}
            <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Event Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-400">Event ID</p>
                  <p className="text-slate-200 font-mono">{event.id.substring(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-slate-400">Status</p>
                  <p className="text-green-400 font-medium">{event.forge_status.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-slate-400">Created</p>
                  <p className="text-slate-200">{new Date(event.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Help Card */}
            <div className="bg-blue-500/10 backdrop-blur-lg rounded-xl border border-blue-500/30 p-6">
              <h3 className="text-lg font-bold text-white mb-2">Need Help?</h3>
              <p className="text-slate-300 text-sm mb-4">
                Our team is here to assist you with your event planning.
              </p>
              <a
                href="mailto:kerala@eventfoundry.com"
                className="text-orange-400 hover:text-orange-300 text-sm font-medium"
              >
                Contact Support →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
