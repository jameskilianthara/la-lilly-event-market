'use client';

/**
 * Resume Draft Event Page
 *
 * URL: /forge/resume/FORGE2X9
 *
 * Purpose: Load draft event from external source (WhatsApp bot)
 * and redirect to blueprint selection, skipping the chat questions
 */

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { RocketLaunchIcon, ClockIcon, ExclamationCircleIcon, CogIcon } from '@heroicons/react/24/outline';

export default function ResumeDraftPage() {
  const router = useRouter();
  const params = useParams();
  const shortCode = params.shortCode as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftData, setDraftData] = useState<any>(null);

  useEffect(() => {
    if (!shortCode) {
      setError('Invalid short code');
      setLoading(false);
      return;
    }

    loadDraftEvent();
  }, [shortCode]);

  const loadDraftEvent = async () => {
    try {
      setLoading(true);

      console.log(`[Resume Draft] Loading draft for code: ${shortCode}`);

      // Call API to get draft event
      const response = await fetch(`/api/forge/external-import?short_code=${shortCode}`);
      const data = await response.json();

      if (!data.success) {
        console.error('[Resume Draft] Failed to load:', data.error);
        setError(data.error || 'Draft not found');
        setLoading(false);
        return;
      }

      if (data.is_expired) {
        console.error('[Resume Draft] Draft expired');
        setError('This draft has expired. Please create a new event.');
        setLoading(false);
        return;
      }

      if (data.is_completed) {
        console.log('[Resume Draft] Draft already completed, redirecting...');
        // Redirect to the completed event
        router.push(`/forge/${data.event_id}`);
        return;
      }

      console.log('[Resume Draft] Loaded successfully:', data);
      setDraftData(data);

      // Store draft data in sessionStorage for checklist page to use
      const clientBrief = data.event?.client_brief || {
        event_type: data.event?.event_type,
        city: data.event?.city,
        date: data.event?.date,
        guest_count: data.event?.guest_count?.toString(),
        venue_status: data.event?.venue_status
      };

      // Store complete event blueprint state
      sessionStorage.setItem('draft_client_brief', JSON.stringify(clientBrief));
      sessionStorage.setItem('draft_short_code', shortCode);
      sessionStorage.setItem('draft_event_id', data.event_id);
      sessionStorage.setItem('resume_from_external', 'true');
      sessionStorage.setItem('skip_forge_questions', 'true'); // Flag to skip 5 questions
      sessionStorage.setItem('show_welcome_toast', 'true'); // Flag to show welcome message

      // Redirect to checklist page after short delay (skip Forge questions)
      setTimeout(() => {
        // Navigate directly to checklist with event type and eventId
        const eventType = clientBrief.event_type?.toLowerCase().replace(/\s+/g, '_') || 'wedding';
        router.push(`/checklist?type=${eventType}&eventId=${data.event_id}&fromWhatsApp=true`);
      }, 1500);

    } catch (err) {
      console.error('[Resume Draft] Error:', err);
      setError('Failed to load draft event. Please try again.');
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-lg rounded-2xl border border-slate-700 p-8 text-center">
          <CogIcon className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Your Event</h2>
          <p className="text-slate-300 mb-4">
            Retrieving your event details...
          </p>
          <p className="text-sm text-slate-400">
            Code: <span className="font-mono text-orange-400">{shortCode}</span>
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-lg rounded-2xl border border-red-500/50 p-8 text-center">
          <ExclamationCircleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Draft</h2>
          <p className="text-slate-300 mb-6">{error}</p>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/forge')}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition"
            >
              Start New Event
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
            >
              Go to Homepage
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-6">
            Code: <span className="font-mono">{shortCode}</span>
          </p>
        </div>
      </div>
    );
  }

  // Success state (brief display before redirect)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-lg rounded-2xl border border-green-500/50 p-8 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <RocketLaunchIcon className="w-10 h-10 text-green-400" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Draft Loaded Successfully!</h2>

        <div className="bg-slate-900/50 rounded-lg p-4 mb-6 text-left">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Event Type:</span>
              <span className="text-white font-medium">{draftData?.event?.event_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">City:</span>
              <span className="text-white font-medium">{draftData?.event?.city}</span>
            </div>
            {draftData?.event?.date && (
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Date:</span>
                <span className="text-white font-medium">{new Date(draftData.event.date).toLocaleDateString()}</span>
              </div>
            )}
            {draftData?.event?.guest_count && (
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Guests:</span>
                <span className="text-white font-medium">{draftData.event.guest_count}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center space-x-2 text-orange-400 mb-4">
          <ClockIcon className="w-5 h-5 animate-pulse" />
          <span className="text-sm">Redirecting to event checklist...</span>
        </div>

        <p className="text-xs text-slate-500">
          Skipping the 5 questions — taking you straight to your personalized checklist!
        </p>
      </div>
    </div>
  );
}
