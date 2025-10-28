'use client';

import React, { useState, useEffect } from 'react';
import { PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { BlueprintItem as IBlueprintItem } from '../../types/blueprint';

interface BlueprintItemProps {
  item: IBlueprintItem;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export const BlueprintItem: React.FC<BlueprintItemProps> = ({
  item,
  notes,
  onNotesChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes);
  const [hasNotes, setHasNotes] = useState(!!notes);

  useEffect(() => {
    setLocalNotes(notes);
    setHasNotes(!!notes);
  }, [notes]);

  const handleSave = () => {
    onNotesChange(localNotes);
    setIsEditing(false);
    setHasNotes(!!localNotes);
  };

  const handleCancel = () => {
    setLocalNotes(notes);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="group">
      <div className="flex items-start space-x-4">
        {/* Item Status */}
        <div className="flex-shrink-0 mt-1">
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            hasNotes
              ? 'border-green-500 bg-green-500'
              : item.required
                ? 'border-orange-500'
                : 'border-slate-500'
          }`}>
            {hasNotes && <CheckIcon className="h-3 w-3 text-white" />}
          </div>
        </div>

        {/* Item Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h5 className="text-white font-medium group-hover:text-orange-300 transition-colors">
                {item.label}
                {item.required && <span className="text-orange-400 ml-1">*</span>}
              </h5>

              {item.category && (
                <span className="inline-block mt-1 px-2 py-1 text-xs bg-slate-700/50 text-slate-300 rounded">
                  {item.category}
                </span>
              )}
            </div>

            {/* Edit Button */}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 px-2 py-1 text-slate-400 hover:text-orange-400 transition-all duration-200"
              >
                <PencilIcon className="h-3 w-3" />
                <span className="text-xs">{hasNotes ? 'Edit' : 'Add'} notes</span>
              </button>
            )}
          </div>

          {/* Notes Display/Edit */}
          <div className="mt-3">
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={item.placeholder || "Add your preferences, requirements, or special notes for this item..."}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Ctrl+Enter to save, Esc to cancel
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1 text-slate-400 hover:text-white transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm rounded-md transition-all duration-200"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : hasNotes ? (
              <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {notes}
                </p>
              </div>
            ) : (
              <div className="text-slate-500 text-sm italic">
                No notes added yet. Click to add your preferences for this item.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};