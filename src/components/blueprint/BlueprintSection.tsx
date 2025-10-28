'use client';

import React from 'react';
import type { BlueprintSection as IBlueprintSection, ClientNotes, ReferenceImage } from '../../types/blueprint';
import { BlueprintItem } from './BlueprintItem';
import { ReferenceUpload } from './ReferenceUpload';

interface BlueprintSectionProps {
  section: IBlueprintSection;
  clientNotes: ClientNotes;
  referenceImages: ReferenceImage[];
  onNotesChange: (itemId: string, notes: string) => void;
  onImageAdd: (file: File) => void;
  onImageRemove: (imageId: string) => void;
}

export const BlueprintSection: React.FC<BlueprintSectionProps> = ({
  section,
  clientNotes,
  referenceImages,
  onNotesChange,
  onImageAdd,
  onImageRemove
}) => {
  return (
    <div className="border-t border-slate-700/50">
      {/* Section Items */}
      <div className="p-6 space-y-4">
        {section.items.map((item) => (
          <BlueprintItem
            key={item.id}
            item={item}
            notes={clientNotes[item.id] || ''}
            onNotesChange={(notes) => onNotesChange(item.id, notes)}
          />
        ))}
      </div>

      {/* Reference Images */}
      <div className="border-t border-slate-700/30 p-6 bg-slate-900/20">
        <div className="mb-4">
          <h4 className="text-white font-medium mb-2">Reference Images</h4>
          <p className="text-slate-400 text-sm">
            Upload images that inspire your vision for this section. These help craftsmen understand your style preferences.
          </p>
        </div>

        <ReferenceUpload
          images={referenceImages}
          onImageAdd={onImageAdd}
          onImageRemove={onImageRemove}
          maxImages={5}
        />
      </div>
    </div>
  );
};