/**
 * Venue Preferences Component
 * Quick preference collection for venue selection
 */

'use client';

import { useState } from 'react';

export interface VenuePreferencesData {
  venue_type: string;
  indoor_outdoor: string;
  budget_range: string;
  special_requirements: string[];
}

interface VenuePreferencesProps {
  onComplete: (preferences: VenuePreferencesData) => void;
  eventRequirements?: {
    guestCount?: number;
    eventType?: string;
  };
}

const VenuePreferences: React.FC<VenuePreferencesProps> = ({
  onComplete,
  eventRequirements
}) => {
  const [preferences, setPreferences] = useState<VenuePreferencesData>({
    venue_type: '',
    indoor_outdoor: '',
    budget_range: '',
    special_requirements: []
  });

  const updatePreference = (key: keyof VenuePreferencesData, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleRequirement = (requirement: string) => {
    setPreferences(prev => ({
      ...prev,
      special_requirements: prev.special_requirements.includes(requirement)
        ? prev.special_requirements.filter(r => r !== requirement)
        : [...prev.special_requirements, requirement]
    }));
  };

  const isValid = preferences.venue_type && preferences.indoor_outdoor;

  return (
    <div className="venue-preferences bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-6">
      <div>
        <h4 className="text-xl font-semibold text-white mb-2">
          Let's find your perfect venue
        </h4>
        <p className="text-gray-400 text-sm">
          {eventRequirements?.guestCount && (
            <>Based on your event for {eventRequirements.guestCount} guests, </>
          )}
          help us understand your venue preferences.
        </p>
      </div>

      {/* Venue Type Preference */}
      <div className="preference-group">
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Venue Type Preference <span className="text-pink-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'hotel_banquet', label: 'Hotel/Resort', icon: '🏨' },
            { value: 'dedicated_banquet_hall', label: 'Banquet Hall', icon: '🏛️' },
            { value: 'boutique_garden_venue', label: 'Garden/Outdoor', icon: '🌳' },
            { value: 'heritage_palace_resort', label: 'Heritage/Palace', icon: '🏰' }
          ].map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => updatePreference('venue_type', option.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                preferences.venue_type === option.value
                  ? 'border-pink-500 bg-pink-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-2">{option.icon}</div>
              <div className="text-sm font-medium text-white">{option.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Indoor/Outdoor Preference */}
      <div className="preference-group">
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Setting Preference <span className="text-pink-500">*</span>
        </label>
        <div className="space-y-2">
          {[
            { value: 'indoor', label: 'Indoor only', description: 'Air-conditioned, weather-proof' },
            { value: 'outdoor', label: 'Outdoor only', description: 'Garden, lawn, or open-air' },
            { value: 'both', label: 'Indoor + Outdoor', description: 'Best of both worlds' }
          ].map(option => (
            <label
              key={option.value}
              className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                preferences.indoor_outdoor === option.value
                  ? 'border-pink-500 bg-pink-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="indoor_outdoor"
                value={option.value}
                checked={preferences.indoor_outdoor === option.value}
                onChange={(e) => updatePreference('indoor_outdoor', e.target.value)}
                className="mt-1 w-4 h-4 text-pink-600 bg-gray-700 border-gray-600 focus:ring-pink-500"
              />
              <div className="flex-1">
                <div className="font-medium text-white">{option.label}</div>
                <div className="text-xs text-gray-400 mt-1">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Budget Range */}
      <div className="preference-group">
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Budget Range for Venue (Optional)
        </label>
        <select
          value={preferences.budget_range}
          onChange={(e) => updatePreference('budget_range', e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
        >
          <option value="">Select budget range</option>
          <option value="budget">₹50K - ₹1L (Budget-friendly)</option>
          <option value="mid">₹1L - ₹3L (Mid-range)</option>
          <option value="premium">₹3L - ₹5L (Premium)</option>
          <option value="luxury">₹5L+ (Luxury)</option>
        </select>
      </div>

      {/* Special Requirements */}
      <div className="preference-group">
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Special Requirements (Optional)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'parking', label: 'Ample Parking' },
            { value: 'accommodation', label: 'Guest Rooms' },
            { value: 'in_house_catering', label: 'In-house Catering' },
            { value: 'waterfront', label: 'Waterfront View' },
            { value: 'accessible', label: 'Wheelchair Accessible' },
            { value: 'alcohol_allowed', label: 'Alcohol Allowed' }
          ].map(req => (
            <label
              key={req.value}
              className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                preferences.special_requirements.includes(req.value)
                  ? 'border-pink-500 bg-pink-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={preferences.special_requirements.includes(req.value)}
                onChange={() => toggleRequirement(req.value)}
                className="w-4 h-4 text-pink-600 bg-gray-700 border-gray-600 rounded focus:ring-pink-500"
              />
              <span className="text-sm text-white">{req.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <button
        type="button"
        onClick={() => onComplete(preferences)}
        disabled={!isValid}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
          isValid
            ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
        }`}
      >
        Find Matching Venues →
      </button>
    </div>
  );
};

export default VenuePreferences;
