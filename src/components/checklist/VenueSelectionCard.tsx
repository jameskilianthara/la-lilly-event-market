/**
 * Venue Selection Card Component
 * Displays individual venue with key details for selection
 */

'use client';

import type { VenueData } from '@/lib/venue-search';

interface VenueSelectionCardProps {
  venue: VenueData;
  eventRequirements?: {
    guestCount?: number;
    eventType?: string;
  };
  onSelect: () => void;
}

const VenueSelectionCard: React.FC<VenueSelectionCardProps> = ({
  venue,
  eventRequirements,
  onSelect
}) => {
  const mainSpace = venue.capacity.event_spaces[0];
  const priceRange = venue.pricing.per_plate_cost_min && venue.pricing.per_plate_cost_max
    ? `₹${venue.pricing.per_plate_cost_min.toLocaleString()} - ₹${venue.pricing.per_plate_cost_max.toLocaleString()}`
    : 'Contact for pricing';

  // Check if venue meets guest count requirement
  const meetsCapacity = eventRequirements?.guestCount
    ? mainSpace.max_guests >= eventRequirements.guestCount
    : true;

  return (
    <div className="venue-selection-card bg-gray-900/70 border border-gray-800 rounded-xl overflow-hidden hover:border-pink-500 transition-all">
      {/* Venue Header */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h5 className="text-lg font-semibold text-white mb-1">
              {venue.basic_info.official_name}
            </h5>
            <div className="text-sm text-gray-400">
              {venue.location.landmark || venue.location.district}
            </div>
          </div>
          {venue.basic_info.star_rating && (
            <div className="flex items-center space-x-1 text-yellow-400">
              {Array.from({ length: venue.basic_info.star_rating }).map((_, i) => (
                <span key={i}>⭐</span>
              ))}
            </div>
          )}
        </div>

        {venue.basic_info.google_rating && (
          <div className="mt-2 flex items-center space-x-2 text-xs">
            <span className="text-yellow-400">★ {venue.basic_info.google_rating}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400">
              {venue.basic_info.total_reviews} reviews
            </span>
          </div>
        )}
      </div>

      {/* Venue Details */}
      <div className="p-5 space-y-4">
        {/* Capacity */}
        <div className="flex items-start space-x-3">
          <span className="text-xl">👥</span>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">Capacity</div>
            <div className="text-sm text-gray-400">
              {mainSpace.min_guests} - {mainSpace.max_guests} guests
              {mainSpace.optimal_guests && ` (optimal: ${mainSpace.optimal_guests})`}
            </div>
            {eventRequirements?.guestCount && (
              <div className={`text-xs mt-1 ${meetsCapacity ? 'text-green-400' : 'text-orange-400'}`}>
                {meetsCapacity
                  ? `✓ Can accommodate ${eventRequirements.guestCount} guests`
                  : `⚠ Your ${eventRequirements.guestCount} guests exceeds capacity`
                }
              </div>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="flex items-start space-x-3">
          <span className="text-xl">💰</span>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">Per Plate</div>
            <div className="text-sm text-gray-400">{priceRange}</div>
          </div>
        </div>

        {/* Venue Type */}
        <div className="flex items-start space-x-3">
          <span className="text-xl">
            {venue.basic_info.venue_type.includes('hotel') ? '🏨' :
             venue.basic_info.venue_type.includes('palace') ? '🏰' :
             venue.basic_info.venue_type.includes('garden') ? '🌳' : '🏛️'}
          </span>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">Type</div>
            <div className="text-sm text-gray-400 capitalize">
              {venue.basic_info.venue_type.replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="flex flex-wrap gap-2">
          {venue.facilities.ac_available && (
            <span className="px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded">
              ❄️ AC
            </span>
          )}
          {venue.capacity.parking_capacity && venue.capacity.parking_capacity > 0 && (
            <span className="px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded">
              🅿️ Parking ({venue.capacity.parking_capacity})
            </span>
          )}
          {venue.facilities.accommodation_available && (
            <span className="px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded">
              🛏️ Rooms ({venue.facilities.accommodation_rooms})
            </span>
          )}
          {venue.catering.in_house_catering && (
            <span className="px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded">
              🍽️ Catering
            </span>
          )}
          {mainSpace.space_type === 'outdoor' && (
            <span className="px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded">
              🌤️ Outdoor
            </span>
          )}
        </div>

        {/* Location */}
        <div className="text-xs text-gray-500 border-t border-gray-800 pt-3">
          📍 {venue.location.address}
        </div>
      </div>

      {/* Select Button */}
      <div className="p-5 bg-gray-800/50 border-t border-gray-800">
        <button
          type="button"
          onClick={onSelect}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all"
        >
          Select This Venue
        </button>
      </div>
    </div>
  );
};

export default VenueSelectionCard;
