'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { getEventById, updateEvent } from '../../../lib/database';
import { useAuth } from '../../../contexts/AuthContext';
import { BlueprintReview } from '../../../components/blueprint/BlueprintReview';
import { ProfessionalBlueprint } from '../../../components/blueprint/ProfessionalBlueprint';
import type { Event } from '../../../types/database';

export default function BlueprintReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const eventId = params.blueprintId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Use the event's stored blueprint data directly
  const forgeBlueprint = event.forge_blueprint as any;
  const clientBriefData = event.client_brief as any;

  // If we have stored blueprint, use ProfessionalBlueprint directly
  if (forgeBlueprint) {
    return (
      <div className="min-h-screen">
        <ProfessionalBlueprint
          blueprint={forgeBlueprint}
          clientBrief={clientBriefData || {
            event_type: event.event_type || 'Event',
            date: event.date || '',
            city: event.city || '',
            guest_count: event.guest_count?.toString() || '',
            venue_status: 'TBD'
          }}
          clientNotes={{}}
          referenceImages={[]}
          onNotesChange={() => {}}
          onLaunchProject={async () => {
            // Handle launch project
            const biddingClosesAt = new Date();
            biddingClosesAt.setDate(biddingClosesAt.getDate() + 7);

            const { error: updateError } = await updateEvent(event.id, {
              forge_status: 'OPEN_FOR_BIDS',
              bidding_closes_at: biddingClosesAt.toISOString()
            });

            if (!updateError) {
              router.push(`/dashboard/client?event=${event.id}`);
            }
          }}
          isSaving={false}
        />
      </div>
    );
  }

  // Fallback to BlueprintReview if no stored blueprint
  const blueprintId = event.event_type || 'wedding';
  const clientBrief = {
    event_type: event.event_type || 'Event',
    date: event.date || '',
    city: event.city || '',
    guest_count: event.guest_count?.toString() || '',
    venue_status: clientBriefData?.venue_status || 'TBD'
  };

  return <BlueprintReview blueprintId={blueprintId} clientBrief={clientBrief} />;
}
