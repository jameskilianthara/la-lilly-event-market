'use client';

import React from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ForgeBlueprint, ClientBrief, ClientNotes, ReferenceImage } from '../../types/blueprint';
import { BlueprintSection } from './BlueprintSection';

interface BlueprintDisplayProps {
  blueprint: ForgeBlueprint;
  clientBrief: ClientBrief;
  clientNotes: ClientNotes;
  referenceImages: ReferenceImage[];
  onNotesChange: (itemId: string, notes: string) => void;
  onImageAdd: (sectionId: string, file: File) => void;
  onImageRemove: (imageId: string) => void;
  isSaving: boolean;
}

export const BlueprintDisplay: React.FC<BlueprintDisplayProps> = ({
  blueprint,
  clientBrief,
  clientNotes,
  referenceImages,
  onNotesChange,
  onImageAdd,
  onImageRemove,
  isSaving
}) => {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set(blueprint.sections.map(section => section.id))
  );

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'master': return 'from-red-500 to-red-600';
      case 'craftsman': return 'from-blue-500 to-blue-600';
      case 'apprentice': return 'from-green-500 to-green-600';
      default: return 'from-orange-500 to-orange-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Blueprint Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{blueprint.displayName}</h2>
            <p className="text-slate-400">Customized for your {clientBrief.event_type} in {clientBrief.city}</p>
          </div>
          <div className={`px-3 py-1 bg-gradient-to-r ${getComplexityColor(blueprint.forgeComplexity)} rounded-full text-white text-sm font-medium`}>
            {blueprint.forgeComplexity.charAt(0).toUpperCase() + blueprint.forgeComplexity.slice(1)} Forge
          </div>
        </div>

        {/* Event Details Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl mb-1">🎭</div>
            <div className="text-sm text-slate-400">Event Type</div>
            <div className="text-white font-medium">{clientBrief.event_type}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">📅</div>
            <div className="text-sm text-slate-400">Date</div>
            <div className="text-white font-medium">{clientBrief.date}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-sm text-slate-400">Guests</div>
            <div className="text-white font-medium">{clientBrief.guest_count}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🏛️</div>
            <div className="text-sm text-slate-400">Venue</div>
            <div className="text-white font-medium text-xs">{clientBrief.venue_status}</div>
          </div>
        </div>
      </div>

      {/* Auto-save Indicator */}
      {isSaving && (
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center space-x-2 text-slate-400 text-sm">
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Saving your notes...</span>
          </div>
        </div>
      )}

      {/* Blueprint Sections */}
      <div className="space-y-4">
        {blueprint.sections.map((section, index) => (
          <div key={section.id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-orange-500 to-blue-600 rounded-lg text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                  <p className="text-slate-400 text-sm">{section.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-xs text-slate-500">
                  {section.items.length} items
                </div>
                {expandedSections.has(section.id) ? (
                  <ChevronDownIcon className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </button>

            {/* Section Content */}
            {expandedSections.has(section.id) && (
              <BlueprintSection
                section={section}
                clientNotes={clientNotes}
                referenceImages={referenceImages.filter(img => img.sectionId === section.id)}
                onNotesChange={onNotesChange}
                onImageAdd={(file) => onImageAdd(section.id, file)}
                onImageRemove={onImageRemove}
              />
            )}
          </div>
        ))}
      </div>

      {/* Completion Summary */}
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white text-sm font-bold">
            ✓
          </div>
          <div>
            <h4 className="text-green-400 font-medium">Blueprint Review Complete</h4>
            <p className="text-slate-300 text-sm">
              Your forge blueprint is ready. When you launch the project, master craftsmen will receive this
              specification to prepare their proposals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};