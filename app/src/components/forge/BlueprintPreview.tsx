'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DocumentTextIcon, EyeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface ClientBrief {
  event_type?: string;
  date?: string;
  city?: string;
  guest_count?: string;
  venue_status?: string;
  [key: string]: string | undefined;
}

interface BlueprintPreviewProps {
  clientBrief: ClientBrief;
  blueprintId: string | null;
  isComplete: boolean;
}

export const BlueprintPreview: React.FC<BlueprintPreviewProps> = ({
  clientBrief,
  blueprintId,
  isComplete
}) => {
  const router = useRouter();
  const briefFields = [
    { key: 'event_type', label: 'Event Type', icon: '🎭' },
    { key: 'date', label: 'Date', icon: '📅' },
    { key: 'city', label: 'City', icon: '🏙️' },
    { key: 'guest_count', label: 'Guests', icon: '👥' },
    { key: 'venue_status', label: 'Venue', icon: '🏛️' }
  ];

  const getBlueprintType = () => {
    if (!clientBrief.event_type) return null;

    const eventType = clientBrief.event_type.toLowerCase();
    if (['wedding', 'marriage', 'nikah', 'shaadi'].includes(eventType)) {
      return { type: 'Wedding Blueprint', complexity: 'Master', color: 'from-pink-500 to-rose-600' };
    }
    if (['corporate', 'conference', 'business'].includes(eventType)) {
      return { type: 'Corporate Blueprint', complexity: 'Professional', color: 'from-slate-600 to-slate-700' };
    }
    if (['birthday', 'celebration', 'party'].includes(eventType)) {
      return { type: 'Celebration Blueprint', complexity: 'Professional', color: 'from-purple-500 to-violet-600' };
    }
    return { type: 'Custom Blueprint', complexity: 'Universal', color: 'from-slate-700 to-slate-800' };
  };

  const blueprint = getBlueprintType();

  return (
    <div className="space-y-6">
      {/* Blueprint Status Card */}
      <div className="bg-white backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <DocumentTextIcon className="h-5 w-5 text-slate-600" />
            <h3 className="font-semibold text-slate-800">Event Blueprint</h3>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {blueprint ? (
            <div className="space-y-3">
              <div className={`bg-gradient-to-r ${blueprint.color} p-3 rounded-lg`}>
                <div className="text-white font-medium text-sm">{blueprint.type}</div>
                <div className="text-white/80 text-xs">Complexity: {blueprint.complexity}</div>
              </div>

              {isComplete && (
                <div className="flex items-center space-x-2 text-emerald-600 text-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span>Blueprint ready</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-slate-700/50 rounded-full flex items-center justify-center mb-3">
                <DocumentTextIcon className="h-8 w-8 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm">Blueprint will appear as you provide your event details</p>
            </div>
          )}
        </div>
      </div>

      {/* Client Brief Summary */}
      <div className="bg-white backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <EyeIcon className="h-5 w-5 text-slate-600" />
            <h3 className="font-semibold text-slate-800">Your Vision</h3>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {briefFields.map((field) => (
            <div key={field.key} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{field.icon}</span>
                <span className="text-sm text-slate-400">{field.label}</span>
              </div>
              <div className="text-sm text-white font-medium">
                {clientBrief[field.key] || (
                  <span className="text-slate-500 italic">pending</span>
                )}
              </div>
            </div>
          ))}

          {Object.keys(clientBrief).length === 0 && (
            <div className="text-center py-4">
              <p className="text-slate-500 text-sm">Your event details will appear here as you progress</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      {isComplete && blueprintId && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-green-500/20 overflow-hidden">
          <div className="p-4">
            <button
              onClick={() => {
                const params = new URLSearchParams({
                  event_type: clientBrief.event_type || '',
                  date: clientBrief.date || '',
                  city: clientBrief.city || '',
                  guest_count: clientBrief.guest_count || '',
                  venue_status: clientBrief.venue_status || ''
                });
                router.push(`/blueprint/${blueprintId}?${params.toString()}`);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>Review Blueprint</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>
            <p className="text-xs text-slate-400 text-center mt-2">
              Preview your custom checklist and find industry professionals
            </p>
          </div>
        </div>
      )}

      {/* Forge Info */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/30 p-4">
        <div className="text-center">
          <div className="text-2xl mb-2">⚒️</div>
          <h4 className="font-medium text-white text-sm mb-1">EventFoundry Promise</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every event is crafted with precision by industry professionals. Your blueprint will be matched with verified experts in your area.
          </p>
        </div>
      </div>
    </div>
  );
};