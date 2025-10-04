'use client';

import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { ForgeBlueprint, ClientBrief, ClientNotes, ReferenceImage } from '../../types/blueprint';

interface ProjectPreviewProps {
  blueprint: ForgeBlueprint;
  clientBrief: ClientBrief;
  clientNotes: ClientNotes;
  referenceImages: ReferenceImage[];
}

export const ProjectPreview: React.FC<ProjectPreviewProps> = ({
  blueprint,
  clientBrief,
  clientNotes,
  referenceImages
}) => {
  const notesCount = Object.values(clientNotes).filter(note => note.trim()).length;
  const totalItems = blueprint.sections.reduce((total, section) => total + section.items.length, 0);
  const completionPercentage = totalItems > 0 ? Math.round((notesCount / totalItems) * 100) : 0;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center space-x-2">
          <DocumentTextIcon className="h-5 w-5 text-green-400" />
          <h3 className="font-semibold text-white">Project Preview</h3>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          What craftsmen will see when they receive your project
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Completion Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Completion</span>
            <span className="text-white font-medium">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-slate-700/30 rounded-lg p-3">
            <div className="text-lg font-bold text-white">{notesCount}</div>
            <div className="text-xs text-slate-400">Notes Added</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-3">
            <div className="text-lg font-bold text-white">{referenceImages.length}</div>
            <div className="text-xs text-slate-400">Images</div>
          </div>
        </div>

        {/* Project Summary */}
        <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
          <h4 className="text-white font-medium text-sm">Project Title</h4>
          <p className="text-slate-300 text-sm">
            {clientBrief.event_type} - {clientBrief.date}
          </p>
          <div className="text-xs text-slate-400">
            {clientBrief.guest_count} guests in {clientBrief.city}
          </div>
        </div>

        {/* Section Summary */}
        <div className="space-y-2">
          <h4 className="text-white font-medium text-sm">Blueprint Sections</h4>
          <div className="space-y-1">
            {blueprint.sections.map((section) => {
              const sectionNotesCount = section.items.filter(
                item => clientNotes[item.id]?.trim()
              ).length;
              const sectionImagesCount = referenceImages.filter(
                img => img.sectionId === section.id
              ).length;

              return (
                <div
                  key={section.id}
                  className="flex items-center justify-between text-xs p-2 bg-slate-700/20 rounded"
                >
                  <span className="text-slate-300">{section.title}</span>
                  <div className="flex items-center space-x-2 text-slate-500">
                    <span>{sectionNotesCount}/{section.items.length}</span>
                    {sectionImagesCount > 0 && (
                      <span className="text-blue-400">📷 {sectionImagesCount}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Readiness Indicator */}
        <div className={`p-3 rounded-lg text-center ${
          completionPercentage >= 80
            ? 'bg-green-500/10 border border-green-500/20'
            : completionPercentage >= 50
              ? 'bg-yellow-500/10 border border-yellow-500/20'
              : 'bg-red-500/10 border border-red-500/20'
        }`}>
          <div className={`text-sm font-medium ${
            completionPercentage >= 80
              ? 'text-green-400'
              : completionPercentage >= 50
                ? 'text-yellow-400'
                : 'text-red-400'
          }`}>
            {completionPercentage >= 80
              ? '🔥 Ready to Launch!'
              : completionPercentage >= 50
                ? '⚡ Almost Ready'
                : '⚠️ Needs More Details'
            }
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {completionPercentage >= 80
              ? 'Your project has enough detail for quality proposals'
              : completionPercentage >= 50
                ? 'Add a few more notes for better craftsmen understanding'
                : 'More details will help craftsmen provide accurate proposals'
            }
          </div>
        </div>
      </div>
    </div>
  );
};