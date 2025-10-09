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
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <DocumentTextIcon className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold text-slate-100">Event Blueprint</h3>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {blueprint ? (
            <div className="space-y-3">
              <div className={`bg-gradient-to-r ${blueprint.color} p-4 rounded-lg shadow-lg`}>
                <div className="text-white font-semibold text-sm">{blueprint.type}</div>
                <div className="text-white/90 text-xs mt-1">Complexity: {blueprint.complexity}</div>
              </div>

              {isComplete && (
                <div className="flex items-center space-x-2 text-emerald-400 text-sm bg-emerald-900/30 px-3 py-2 rounded-lg border border-emerald-500/30">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span>Blueprint ready</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-slate-700/50 rounded-full flex items-center justify-center mb-3 border border-slate-600/50">
                <DocumentTextIcon className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-400 text-sm">Blueprint will appear as you provide your event details</p>
            </div>
          )}
        </div>
      </div>

      {/* Client Brief Summary */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <EyeIcon className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold text-slate-100">Your Vision</h3>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {briefFields.map((field) => (
            <div key={field.key} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/30 transition-colors">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{field.icon}</span>
                <span className="text-sm text-slate-300 font-medium">{field.label}</span>
              </div>
              <div className="text-sm text-slate-100 font-semibold">
                {clientBrief[field.key] || (
                  <span className="text-slate-500 italic font-normal">pending</span>
                )}
              </div>
            </div>
          ))}

          {Object.keys(clientBrief).length === 0 && (
            <div className="text-center py-4">
              <p className="text-slate-400 text-sm">Your event details will appear here as you progress</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      {isComplete && blueprintId && (
        <div className="bg-gradient-to-br from-emerald-900/40 to-green-900/40 backdrop-blur-xl rounded-xl border border-emerald-500/30 overflow-hidden shadow-2xl">
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
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105"
            >
              <span>Review Blueprint</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>
            <p className="text-xs text-slate-300 text-center mt-2">
              Preview your custom checklist and find industry professionals
            </p>
          </div>
        </div>
      )}

      {/* Forge Info */}
      <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/40 backdrop-blur-xl rounded-xl border border-orange-500/30 p-4 shadow-2xl">
        <div className="text-center">
          <div className="text-2xl mb-2">⚒️</div>
          <h4 className="font-semibold text-orange-300 text-sm mb-2">EventFoundry Promise</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every event is crafted with precision by industry professionals. Your blueprint will be matched with verified experts in your area.
          </p>
        </div>
      </div>
    </div>
  );
};