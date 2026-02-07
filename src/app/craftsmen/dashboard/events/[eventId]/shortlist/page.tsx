'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../../contexts/AuthContext';
import { CheckCircleIcon, ClockIcon, SparklesIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../../../../../../components/ui/LoadingSpinner';

interface ShortlistData {
  eventId: string;
  eventTitle: string;
  clientName: string;
  bidId: string;
  originalBidAmount: number;
  competitivePosition: {
    isLowestBid: boolean;
    percentageAbove: number;
    message: string;
  };
  revisionDeadline: string;
  canRevise: boolean;
  eventDetails: {
    eventType: string;
    date: string;
    city: string;
    guestCount: number;
  };
}

export default function VendorShortlistNotificationPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const eventId = params.eventId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shortlistData, setShortlistData] = useState<ShortlistData | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadShortlistData();
  }, [isAuthenticated, eventId]);

  const loadShortlistData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/craftsmen/events/${eventId}/shortlist-status`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load shortlist data');
      }

      const data = await response.json();
      setShortlistData(data);
    } catch (err) {
      console.error('Error loading shortlist data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load shortlist data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeRemaining = () => {
    if (!shortlistData?.revisionDeadline) return null;

    const deadline = new Date(shortlistData.revisionDeadline);
    const now = new Date();
    const hoursRemaining = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));

    return hoursRemaining;
  };

  const handleReviseClick = () => {
    router.push(`/craftsmen/dashboard/events/${eventId}/revise-bid`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !shortlistData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-6">
        <div className="bg-red-900/20 border-2 border-red-500/50 rounded-xl p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-slate-300">{error || 'Failed to load shortlist information'}</p>
          <button
            onClick={() => router.push('/craftsmen/dashboard')}
            className="mt-4 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const hoursRemaining = calculateTimeRemaining();
  const deadlinePassed = hoursRemaining !== null && hoursRemaining <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Congratulations Header */}
        <div className="bg-gradient-to-r from-emerald-900/40 to-green-900/40 border-2 border-emerald-500/30 rounded-xl p-8 mb-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <TrophyIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            🎉 Congratulations! You've Been Shortlisted!
          </h1>
          <p className="text-emerald-300 text-lg">
            {shortlistData.eventTitle}
          </p>
        </div>

        {/* Competitive Position */}
        <div className={`border-2 rounded-xl p-6 mb-6 ${
          shortlistData.competitivePosition.isLowestBid
            ? 'bg-gradient-to-r from-orange-900/40 to-amber-900/40 border-orange-500/30'
            : 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-blue-500/30'
        }`}>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                shortlistData.competitivePosition.isLowestBid
                  ? 'bg-gradient-to-br from-orange-500 to-amber-600'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600'
              }`}>
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">Your Competitive Position</h3>
              <p className={`text-lg font-semibold ${
                shortlistData.competitivePosition.isLowestBid ? 'text-orange-300' : 'text-blue-300'
              }`}>
                {shortlistData.competitivePosition.message}
              </p>
              <p className="text-slate-300 mt-3 text-sm">
                Original Bid Amount: <span className="font-bold text-white">₹{shortlistData.originalBidAmount.toLocaleString('en-IN')}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Revision Deadline */}
        {shortlistData.canRevise && !deadlinePassed && hoursRemaining !== null && (
          <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-2 border-purple-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Revision Window</h3>
                <p className="text-slate-300 mb-3">
                  You have <span className="font-bold text-purple-300">{hoursRemaining} hours</span> remaining to revise your bid if you choose to.
                </p>
                <p className="text-sm text-slate-400">
                  Deadline: {new Date(shortlistData.revisionDeadline).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {deadlinePassed && (
          <div className="bg-red-900/20 border-2 border-red-500/50 rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-3">
              <ClockIcon className="h-6 w-6 text-red-400" />
              <p className="text-red-300 font-semibold">
                Revision window has closed. Your original bid stands.
              </p>
            </div>
          </div>
        )}

        {/* Event Details */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircleIcon className="h-6 w-6 text-emerald-500" />
            Event Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">Event Type</p>
              <p className="text-white font-semibold">{shortlistData.eventDetails.eventType}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Date</p>
              <p className="text-white font-semibold">{shortlistData.eventDetails.date}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Location</p>
              <p className="text-white font-semibold">{shortlistData.eventDetails.city}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Guest Count</p>
              <p className="text-white font-semibold">{shortlistData.eventDetails.guestCount} guests</p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">What Happens Next?</h3>
          <div className="space-y-3 text-slate-300">
            <p className="flex items-start gap-2">
              <span className="text-orange-400 font-bold mt-1">1.</span>
              <span>Review your competitive position and decide if you want to revise your bid.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-orange-400 font-bold mt-1">2.</span>
              <span>You have {hoursRemaining || 0} hours to submit a revised bid (optional).</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-orange-400 font-bold mt-1">3.</span>
              <span>The client will review all final bids along with vendor profiles to make their selection.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-orange-400 font-bold mt-1">4.</span>
              <span>You'll be notified once the client makes their final decision.</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            {shortlistData.canRevise && !deadlinePassed && (
              <button
                onClick={handleReviseClick}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105"
              >
                <SparklesIcon className="inline-block w-5 h-5 mr-2" />
                Revise My Bid
              </button>
            )}
            <button
              onClick={() => router.push('/craftsmen/dashboard')}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
