/**
 * Venue Selection Section - Orchestrator Component
 * Manages the entire venue selection workflow with multiple steps
 */

'use client';

import { useState } from 'react';
import VenuePreferences, { type VenuePreferencesData } from './VenuePreferences';
import VenueBrowse from './VenueBrowse';
import type { VenueData } from '@/lib/venue-search';

interface VenueSelectionSectionProps {
  eventRequirements: {
    guestCount?: number;
    eventType?: string;
  };
  onVenueSelected: (venue: VenueData) => void;
  onSkip?: () => void;
}

type Step = 'preferences' | 'browse' | 'selected';

const VenueSelectionSection: React.FC<VenueSelectionSectionProps> = ({
  eventRequirements,
  onVenueSelected,
  onSkip
}) => {
  const [step, setStep] = useState<Step>('preferences');
  const [preferences, setPreferences] = useState<VenuePreferencesData | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<VenueData | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  const handlePreferencesComplete = (prefs: VenuePreferencesData) => {
    setPreferences(prefs);
    setStep('browse');
  };

  const handleVenueSelection = async (venue: VenueData) => {
    setSelectedVenue(venue);
    setOptimizing(true);

    try {
      // Trigger checklist optimization
      onVenueSelected(venue);
      setStep('selected');
    } catch (error) {
      console.error('Error selecting venue:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const handleBack = () => {
    if (step === 'browse') {
      setStep('preferences');
    } else if (step === 'selected') {
      setStep('browse');
    }
  };

  return (
    <div className="venue-selection-section">
      {/* Progress Indicator */}
      <div className="mb-6 flex items-center space-x-4">
        <div className={`flex items-center space-x-2 ${step === 'preferences' ? 'text-pink-500' : step === 'browse' || step === 'selected' ? 'text-green-500' : 'text-gray-500'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'preferences' ? 'border-pink-500 bg-pink-500/20' : step === 'browse' || step === 'selected' ? 'border-green-500 bg-green-500/20' : 'border-gray-600'}`}>
            {step === 'browse' || step === 'selected' ? '✓' : '1'}
          </div>
          <span className="text-sm font-medium">Preferences</span>
        </div>

        <div className={`flex-1 h-0.5 ${step === 'browse' || step === 'selected' ? 'bg-pink-500' : 'bg-gray-700'}`}></div>

        <div className={`flex items-center space-x-2 ${step === 'browse' ? 'text-pink-500' : step === 'selected' ? 'text-green-500' : 'text-gray-500'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'browse' ? 'border-pink-500 bg-pink-500/20' : step === 'selected' ? 'border-green-500 bg-green-500/20' : 'border-gray-600'}`}>
            {step === 'selected' ? '✓' : '2'}
          </div>
          <span className="text-sm font-medium">Browse</span>
        </div>

        <div className={`flex-1 h-0.5 ${step === 'selected' ? 'bg-pink-500' : 'bg-gray-700'}`}></div>

        <div className={`flex items-center space-x-2 ${step === 'selected' ? 'text-pink-500' : 'text-gray-500'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'selected' ? 'border-pink-500 bg-pink-500/20' : 'border-gray-600'}`}>
            3
          </div>
          <span className="text-sm font-medium">Confirmed</span>
        </div>
      </div>

      {/* Preferences Step */}
      {step === 'preferences' && (
        <VenuePreferences
          eventRequirements={eventRequirements}
          onComplete={handlePreferencesComplete}
        />
      )}

      {/* Browse Step */}
      {step === 'browse' && preferences && (
        <VenueBrowse
          preferences={preferences}
          eventRequirements={eventRequirements}
          onVenueSelected={handleVenueSelection}
          onBack={handleBack}
        />
      )}

      {/* Selected Step (Confirmation) */}
      {step === 'selected' && selectedVenue && (
        <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-8 space-y-6">
          {optimizing ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto"></div>
              <h5 className="text-lg font-semibold text-white">Optimizing your checklist...</h5>
              <p className="text-gray-400 text-sm">
                Auto-populating venue details and removing redundant items
              </p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className="text-5xl mb-4">✅</div>
                <h5 className="text-2xl font-bold text-white mb-2">
                  Venue Selected!
                </h5>
                <p className="text-gray-400">
                  Your checklist has been optimized for this venue
                </p>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 space-y-4">
                <div>
                  <h6 className="text-lg font-semibold text-white mb-1">
                    {selectedVenue.basic_info.official_name}
                  </h6>
                  <p className="text-gray-400 text-sm">
                    {selectedVenue.location.address}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Capacity</div>
                    <div className="text-white font-medium">
                      {selectedVenue.capacity.event_spaces[0].min_guests} - {selectedVenue.capacity.event_spaces[0].max_guests} guests
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Contact</div>
                    <div className="text-white font-medium">
                      {selectedVenue.contact.phone_primary}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedVenue.facilities.ac_available && (
                    <span className="px-3 py-1 bg-gray-800 text-xs text-gray-300 rounded-full">
                      ❄️ AC Available
                    </span>
                  )}
                  {selectedVenue.capacity.parking_capacity && selectedVenue.capacity.parking_capacity > 0 && (
                    <span className="px-3 py-1 bg-gray-800 text-xs text-gray-300 rounded-full">
                      🅿️ Parking ({selectedVenue.capacity.parking_capacity})
                    </span>
                  )}
                  {selectedVenue.catering.in_house_catering && (
                    <span className="px-3 py-1 bg-gray-800 text-xs text-gray-300 rounded-full">
                      🍽️ In-house Catering
                    </span>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all"
                >
                  Choose Different Venue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Checklist is already optimized, just close this section
                    if (onSkip) onSkip();
                  }}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all"
                >
                  Continue with This Venue →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Skip Option */}
      {step === 'preferences' && onSkip && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-gray-400 hover:text-white transition-all"
          >
            Skip venue selection for now →
          </button>
        </div>
      )}
    </div>
  );
};

export default VenueSelectionSection;
