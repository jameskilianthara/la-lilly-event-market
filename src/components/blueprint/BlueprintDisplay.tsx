'use client';

import React from 'react';
import { ChevronDownIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { ForgeBlueprint, ClientBrief, ClientNotes, ReferenceImage } from '../../types/blueprint';
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
  const [sectionNotes, setSectionNotes] = React.useState<{ [sectionId: string]: string }>({});

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const updateSectionNotes = (sectionId: string, notes: string) => {
    setSectionNotes(prev => ({ ...prev, [sectionId]: notes }));
  };

  const getSectionCompletion = (section: any) => {
    const itemsWithNotes = section.items.filter((item: any) =>
      clientNotes[item.id] && clientNotes[item.id].trim().length > 0
    ).length;
    return itemsWithNotes > 0 ? Math.round((itemsWithNotes / section.items.length) * 100) : 0;
  };

  const getOverallCompletion = () => {
    const totalItems = blueprint.sections.reduce((sum, section) => sum + section.items.length, 0);
    const completedItems = Object.keys(clientNotes).filter(key =>
      clientNotes[key] && clientNotes[key].trim().length > 0
    ).length;
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'master': return 'from-red-500 to-red-600';
      case 'craftsman': return 'from-blue-500 to-blue-600';
      case 'apprentice': return 'from-green-500 to-green-600';
      default: return 'from-orange-500 to-orange-600';
    }
  };

  const overallCompletion = getOverallCompletion();

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

        {/* Progress Indicator */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <span className="text-white font-medium">Blueprint Progress</span>
            </div>
            <span className="text-sm text-slate-400">{overallCompletion}% Complete</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${overallCompletion}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {overallCompletion === 100
              ? '🎉 All sections reviewed! Ready to launch your project.'
              : overallCompletion >= 50
              ? 'Great progress! Keep adding details to help craftsmen understand your vision.'
              : 'Add notes to items to help craftsmen prepare accurate proposals.'}
          </p>
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
        {blueprint.sections.map((section, index) => {
          const isExpanded = expandedSections.has(section.id);
          const sectionCompletion = getSectionCompletion(section);

          return (
            <div
              key={section.id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-slate-700/30 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-500 to-blue-600 rounded-lg text-white font-bold text-sm shadow-md group-hover:scale-110 transition-transform duration-200">
                    {index + 1}
                    {sectionCompletion === 100 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-lg font-semibold text-white group-hover:text-orange-300 transition-colors duration-200">
                        {section.title}
                      </h3>
                      {sectionCompletion > 0 && sectionCompletion < 100 && (
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                          {sectionCompletion}%
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{section.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
                    {section.items.length} items
                  </div>
                  <ChevronDownIcon
                    className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${
                      isExpanded ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                </div>
              </button>

              {/* Section Content with Smooth Animation */}
              <div
                className={`transition-all duration-300 ease-in-out ${
                  isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                }`}
              >
                <BlueprintSection
                  section={section}
                  clientNotes={clientNotes}
                  referenceImages={referenceImages.filter(img => img.sectionId === section.id)}
                  onNotesChange={onNotesChange}
                  onImageAdd={(file) => onImageAdd(section.id, file)}
                  onImageRemove={onImageRemove}
                />

                {/* Section Notes Textarea */}
                <div className="border-t border-slate-700/50 p-6 bg-slate-900/30">
                  <label className="block mb-2">
                    <span className="text-white font-medium flex items-center space-x-2">
                      <span>📝</span>
                      <span>Additional Notes for {section.title}</span>
                    </span>
                    <span className="text-slate-400 text-xs block mt-1">
                      Add any additional requirements, preferences, or questions for this section
                    </span>
                  </label>
                  <textarea
                    value={sectionNotes[section.id] || ''}
                    onChange={(e) => updateSectionNotes(section.id, e.target.value)}
                    placeholder={`E.g., "For decor, I prefer sustainable materials and a minimalist aesthetic..."`}
                    rows={3}
                    className="w-full bg-slate-800/50 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200 resize-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
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