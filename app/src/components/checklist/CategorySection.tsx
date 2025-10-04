'use client';

import React from 'react';
import { ChecklistItem } from './ChecklistItem';

interface ChecklistItemType {
  id: string;
  question: string;
  type: string;
  options?: string[];
  placeholder?: string;
}

interface CategoryType {
  id: string;
  title: string;
  icon: string;
  items: ChecklistItemType[];
  additionalNotes: boolean;
}

interface CategorySectionProps {
  category: CategoryType;
  selections: Record<string, string | string[] | boolean>;
  notes: string;
  onSelectionChange: (itemId: string, value: string | string[] | boolean) => void;
  onNotesChange: (value: string) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  selections,
  notes,
  onSelectionChange,
  onNotesChange
}) => {
  return (
    <div className="border-t border-slate-200">
      <div className="p-6 space-y-6">
        {/* Checklist Items */}
        {category.items.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            value={selections[item.id]}
            onChange={(value) => onSelectionChange(item.id, value)}
          />
        ))}

        {/* Additional Notes Section */}
        {category.additionalNotes && (
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Additional Notes for {category.title}
            </label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder={`Add any additional requirements or notes for ${category.title.toLowerCase()}...`}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
};