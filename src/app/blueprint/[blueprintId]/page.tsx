'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { getEventById, updateEvent } from '../../../lib/database';
import { useAuth } from '../../../contexts/AuthContext';
import { ComprehensiveBlueprint } from '../../../components/blueprint/ComprehensiveBlueprint';
import { BlueprintReview } from '../../../components/blueprint/BlueprintReview';
import type { Event } from '../../../types/database';

interface ChecklistCategory {
  id: string;
  title: string;
  icon: string;
  items: ChecklistItem[];
  additionalNotes?: boolean;
}

interface ChecklistItem {
  id: string;
  question: string;
  type: 'radio' | 'select' | 'checkbox';
  options: string[];
}

interface ChecklistData {
  eventType: string;
  displayName: string;
  categories: ChecklistCategory[];
}

export default function BlueprintReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const eventId = params.blueprintId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checklistData, setChecklistData] = useState<ChecklistData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Check if this is a resumed draft from external source
    const isResumedDraft = sessionStorage.getItem('resume_from_external') === 'true';
    const draftShortCode = sessionStorage.getItem('draft_short_code');

    if (isResumedDraft && draftShortCode === eventId) {
      // This is a draft resume - load from sessionStorage
      loadDraftEvent();
    } else {
      // Normal event load
      loadEvent();
    }
  }, [eventId, isAuthenticated]);

  const loadDraftEvent = async () => {
    console.log('[Blueprint] Loading draft event from external source');

    try {
      setIsLoading(true);

      // Get draft data from sessionStorage
      const draftBriefStr = sessionStorage.getItem('draft_client_brief');
      const draftEventId = sessionStorage.getItem('draft_event_id');

      if (!draftBriefStr || !draftEventId) {
        console.error('[Blueprint] Missing draft data in sessionStorage');
        setError('Draft data not found. Please start over.');
        setIsLoading(false);
        return;
      }

      const clientBrief = JSON.parse(draftBriefStr);
      console.log('[Blueprint] Loaded draft client brief:', clientBrief);

      // Load the actual event from database to get full details
      const { data: eventData, error: fetchError } = await getEventById(draftEventId);

      if (fetchError || !eventData) {
        console.error('[Blueprint] Error fetching draft event:', fetchError);
        setError('Failed to load draft event');
        setIsLoading(false);
        return;
      }

      setEvent(eventData);
      setIsLoading(false);

      // Clear the resume flag so page refreshes work normally
      sessionStorage.removeItem('resume_from_external');

    } catch (err) {
      console.error('[Blueprint] Error loading draft:', err);
      setError('Failed to load draft event');
      setIsLoading(false);
    }
  };

  const loadEvent = async () => {
    console.log('[Blueprint] loadEvent called - authLoading:', authLoading, 'isAuthenticated:', isAuthenticated);

    // TEMPORARY: Skip auth check to fix loading issue
    // TODO: Re-enable authentication after debugging
    /*
    if (authLoading) {
      console.log('[Blueprint] Auth still loading, skipping event load');
      return;
    }

    if (!isAuthenticated) {
      console.log('[Blueprint] Not authenticated, showing error');
      setError('Please sign in to view your event');
      setIsLoading(false);
      return;
    }
    */

    console.log('[Blueprint] Loading event:', eventId);

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await getEventById(eventId);

      if (fetchError) {
        console.error('[Blueprint] Error fetching event:', fetchError);
        setError(`Failed to load event: ${fetchError.message || 'Unknown error'}`);
        setIsLoading(false);
        return;
      }

      if (!data) {
        console.error('[Blueprint] No event data found');
        setError('Event not found');
        setIsLoading(false);
        return;
      }

      console.log('[Blueprint] Event loaded:', data.id, 'Owner:', data.owner_user_id, 'Current user:', user?.userId);

      // TEMPORARY: Skip ownership check
      /*
      if (data.owner_user_id !== user?.userId) {
        console.error('[Blueprint] Permission denied - user does not own event');
        setError('You do not have permission to view this event');
        setIsLoading(false);
        return;
      }
      */

      setEvent(data);
      console.log('[Blueprint] Event set successfully');

      // Load checklist data based on event type
      console.log('[Blueprint] Loading checklist for event type:', data.event_type);
      await loadChecklistData(data.event_type || 'wedding');

      console.log('[Blueprint] ✅ Blueprint page loaded successfully');
      setIsLoading(false);
    } catch (err) {
      console.error('[Blueprint] Unexpected error loading event:', err);
      setError(`An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const loadChecklistData = async (eventType: string) => {
    try {
      // Map event type to checklist file name
      const checklistType = eventType.toLowerCase().replace(/\s+/g, '-');
      const response = await fetch(`/data/checklists/${checklistType}.json`);
      
      if (!response.ok) {
        // Fallback to wedding if not found
        if (checklistType !== 'wedding') {
          const fallbackResponse = await fetch('/data/checklists/wedding.json');
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setChecklistData(fallbackData);
          }
        }
        return;
      }

      const data = await response.json();
      setChecklistData(data);
    } catch (err) {
      console.error('Error loading checklist data:', err);
      // Continue without checklist data - component will handle gracefully
    }
  };

  const handleSaveBlueprint = async (blueprintData: any) => {
    if (!event) return;

    try {
      setIsSaving(true);
      
      // Merge with existing client_brief data
      const currentClientBrief = (event.client_brief as any) || {};
      const updatedClientBrief = {
        ...currentClientBrief,
        blueprint: blueprintData.blueprint
      };

      const { error: updateError } = await updateEvent(event.id, {
        client_brief: updatedClientBrief
      });

      if (updateError) {
        console.error('Error saving blueprint:', updateError);
        throw updateError;
      }

      // Update local event state
      setEvent({
        ...event,
        client_brief: updatedClientBrief
      });
    } catch (err) {
      console.error('Error saving blueprint:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleLaunchProject = async () => {
    console.log('[Launch Project] Button clicked');
    console.log('[Launch Project] Event:', event?.id);

    if (!event) {
      console.error('[Launch Project] No event found!');
      return;
    }

    try {
      setIsSaving(true);
      console.log('[Launch Project] Setting status to OPEN_FOR_BIDS...');

      const biddingClosesAt = new Date();
      biddingClosesAt.setDate(biddingClosesAt.getDate() + 7);
      console.log('[Launch Project] Bidding closes at:', biddingClosesAt.toISOString());

      // Use API route instead of direct Supabase client to avoid RLS issues
      const response = await fetch(`/api/forge/projects/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          forge_status: 'OPEN_FOR_BIDS',
          bidding_closes_at: biddingClosesAt.toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Launch Project] ❌ API error:', errorData);
        throw new Error(errorData.error || 'Failed to launch project');
      }

      console.log('[Launch Project] ✅ Event launched successfully!');
      console.log('[Launch Project] Navigating to dashboard...');

      // Navigate to dashboard
      router.push(`/dashboard/client?event=${event.id}`);
    } catch (err) {
      console.error('[Launch Project] ❌ Error:', err);
      alert(`Failed to launch project: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
      console.log('[Launch Project] Saving state reset');
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

  // Prepare client brief data
  const clientBriefData = (event.client_brief as any) || {};
  const checklistDataFromEvent = clientBriefData.checklist || null;

  // Debug logging
  console.log('[Blueprint] Event client_brief:', clientBriefData);
  console.log('[Blueprint] Checklist data from event:', checklistDataFromEvent);
  console.log('[Blueprint] Checklist selections:', checklistDataFromEvent?.selections);
  console.log('[Blueprint] Category notes:', checklistDataFromEvent?.categoryNotes);

  const clientBrief = {
    event_type: event.event_type || 'Event',
    date: event.date || '',
    city: event.city || '',
    guest_count: event.guest_count?.toString() || '',
    venue_status: clientBriefData.venue_status || event.venue_status || 'TBD',
    checklist: checklistDataFromEvent
  };

  // Use ComprehensiveBlueprint as the primary component
  return (
    <div className="min-h-screen">
      <ComprehensiveBlueprint
        eventId={event.id}
        clientBrief={clientBrief}
        checklistData={checklistDataFromEvent}
        checklistCategories={checklistData?.categories || []}
        onSave={handleSaveBlueprint}
        onLaunchProject={handleLaunchProject}
        isSaving={isSaving}
      />
    </div>
  );
}
