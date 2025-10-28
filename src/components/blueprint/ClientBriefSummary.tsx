'use client';

import React from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import { ClientBrief, ForgeBlueprint } from '../../types/blueprint';

interface ClientBriefSummaryProps {
  clientBrief: ClientBrief;
  blueprint: ForgeBlueprint;
}

export const ClientBriefSummary: React.FC<ClientBriefSummaryProps> = ({
  clientBrief,
  blueprint
}) => {
  const briefFields = [
    { key: 'event_type', label: 'Event Type', icon: '🎭' },
    { key: 'date', label: 'Date', icon: '📅' },
    { key: 'city', label: 'City', icon: '🏙️' },
    { key: 'guest_count', label: 'Guests', icon: '👥' },
    { key: 'venue_status', label: 'Venue', icon: '🏛️' }
  ];

  const getComplexityInfo = (complexity: string) => {
    switch (complexity) {
      case 'master':
        return {
          label: 'Master Forge',
          description: 'Complex event requiring expert craftsmen',
          color: 'from-red-500 to-red-600'
        };
      case 'craftsman':
        return {
          label: 'Craftsman Forge',
          description: 'Skilled artisans for quality execution',
          color: 'from-blue-500 to-blue-600'
        };
      case 'apprentice':
        return {
          label: 'Apprentice Forge',
          description: 'Straightforward event with basic requirements',
          color: 'from-green-500 to-green-600'
        };
      default:
        return {
          label: 'Universal Forge',
          description: 'Adaptable template for any event type',
          color: 'from-orange-500 to-orange-600'
        };
    }
  };

  const complexityInfo = getComplexityInfo(blueprint.forgeComplexity);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center space-x-2">
          <EyeIcon className="h-5 w-5 text-blue-400" />
          <h3 className="font-semibold text-white">Your Event Brief</h3>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Blueprint Type */}
        <div className="space-y-2">
          <div className={`bg-gradient-to-r ${complexityInfo.color} p-3 rounded-lg text-center`}>
            <div className="text-white font-bold text-sm">{complexityInfo.label}</div>
            <div className="text-white/80 text-xs">{complexityInfo.description}</div>
          </div>
        </div>

        {/* Client Brief Details */}
        <div className="space-y-3">
          {briefFields.map((field) => (
            <div key={field.key} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{field.icon}</span>
                <span className="text-sm text-slate-400">{field.label}</span>
              </div>
              <div className="text-sm text-white font-medium text-right max-w-32 truncate">
                {clientBrief[field.key as keyof ClientBrief] || (
                  <span className="text-slate-500 italic">pending</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Blueprint Info */}
        <div className="border-t border-slate-700/50 pt-4">
          <div className="text-xs text-slate-500 space-y-1">
            <div>Blueprint: {blueprint.displayName}</div>
            <div>Version: {blueprint.version}</div>
            <div>Sections: {blueprint.sections.length}</div>
            <div>
              Items: {blueprint.sections.reduce((total, section) => total + section.items.length, 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};