/**
 * Venue Browse Component
 * Displays filtered venues based on preferences and allows selection
 */

'use client';

import { useState, useEffect } from 'react';
import VenueSelectionCard from './VenueSelectionCard';
import type { VenueData } from '@/lib/venue-search';
import type { VenuePreferencesData } from './VenuePreferences';

interface VenueBrowseProps {
  preferences: VenuePreferencesData;
  eventRequirements: {
    guestCount?: number;
    eventType?: string;
  };
  onVenueSelected: (venue: VenueData) => void;
  onBack?: () => void;
}

const VenueBrowse: React.FC<VenueBrowseProps> = ({
  preferences,
  eventRequirements,
  onVenueSelected,
  onBack
}) => {
  const [venues, setVenues] = useState<VenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMatchingVenues();
  }, [preferences, eventRequirements]);

  const fetchMatchingVenues = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build search filters based on preferences
      const filters: any = {};

      if (eventRequirements.guestCount) {
        filters.min_capacity = Math.floor(eventRequirements.guestCount * 0.8);
        filters.max_capacity = Math.ceil(eventRequirements.guestCount * 1.3);
      }

      if (preferences.venue_type) {
        filters.venue_type = preferences.venue_type;
      }

      // Map special requirements to filters
      if (preferences.special_requirements.includes('parking')) {
        filters.has_parking = true;
      }
      if (preferences.special_requirements.includes('accommodation')) {
        filters.has_accommodation = true;
      }
      if (preferences.special_requirements.includes('in_house_catering')) {
        filters.has_kitchen = true;
      }

      const response = await fetch('/api/venues/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: preferences.venue_type.replace(/_/g, ' '),
          filters,
          maxResults: 20
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch venues');
      }

      const data = await response.json();
      setVenues(data.results || []);
    } catch (err) {
      console.error('Error fetching venues:', err);
      setError('Failed to load venues. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="venue-browse space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xl font-semibold text-white mb-2">
            Recommended Venues
          </h4>
          <p className="text-gray-400 text-sm">
            Based on your preferences: {preferences.venue_type.replace(/_/g, ' ')}
            {eventRequirements.guestCount && `, ${eventRequirements.guestCount} guests`}
            {preferences.indoor_outdoor && `, ${preferences.indoor_outdoor}`}
          </p>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:border-gray-600 transition-all"
          >
            ← Update Preferences
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin"></div>
          <p className="text-gray-400">Finding perfect venues...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
          <div className="text-red-400 mb-4">⚠️ {error}</div>
          <button
            type="button"
            onClick={fetchMatchingVenues}
            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && venues.length === 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center space-y-4">
          <div className="text-5xl mb-4">🔍</div>
          <h5 className="text-lg font-semibold text-white">
            No venues match your criteria
          </h5>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Try adjusting your preferences or budget range to see more options.
          </p>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mt-4 px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-all"
            >
              Update Preferences
            </button>
          )}
        </div>
      )}

      {/* Venues Grid */}
      {!loading && !error && venues.length > 0 && (
        <>
          <div className="text-sm text-gray-400 mb-4">
            Found {venues.length} venue{venues.length !== 1 ? 's' : ''}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <VenueSelectionCard
                key={venue.venue_id}
                venue={venue}
                eventRequirements={eventRequirements}
                onSelect={() => onVenueSelected(venue)}
              />
            ))}
          </div>
        </>
      )}

      {/* Helpful Tips */}
      {!loading && venues.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="text-blue-300 text-sm font-medium mb-2">💡 Tip</div>
          <p className="text-blue-200/80 text-sm">
            Click "Select This Venue" to auto-populate your checklist with venue-specific
            details like capacity, facilities, and contact information.
          </p>
        </div>
      )}
    </div>
  );
};

export default VenueBrowse;
