'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronDownIcon, ChevronUpIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { CategorySection } from './CategorySection';
import { ProgressBar } from './ProgressBar';
import { EventSummaryCard } from './EventSummaryCard';
import { useChecklist } from '../../hooks/useChecklist';

interface ChecklistContainerProps {
  eventType?: string;
  clientBrief?: {
    event_type?: string;
    date?: string;
    city?: string;
    guest_count?: string;
    venue_status?: string;
  };
}

export const ChecklistContainer: React.FC<ChecklistContainerProps> = ({
  eventType: propEventType,
  clientBrief: propClientBrief
}) => {
  const searchParams = useSearchParams();

  // Get data from props or URL parameters
  const eventType = propEventType || searchParams.get('event_type') || 'wedding';
  const clientBrief = propClientBrief || {
    event_type: searchParams.get('event_type') || '',
    date: searchParams.get('date') || '',
    city: searchParams.get('city') || '',
    guest_count: searchParams.get('guest_count') || '',
    venue_status: searchParams.get('venue_status') || ''
  };

  const {
    checklist,
    selections,
    notes,
    loading,
    error,
    progress,
    updateSelection,
    updateNotes,
    exportChecklist,
    saveProgress
  } = useChecklist(eventType);

  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);

  // Auto-expand first category on load
  useEffect(() => {
    if (checklist && checklist.categories.length > 0 && expandedCategories.length === 0) {
      setExpandedCategories([checklist.categories[0].id]);
    }
  }, [checklist, expandedCategories.length]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleExport = async (format: 'pdf' | 'json') => {
    try {
      await exportChecklist(format, clientBrief);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your event checklist...</p>
        </div>
      </div>
    );
  }

  if (error || !checklist) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">Unable to load checklist for this event type.</p>
          <p className="text-slate-600">Please try again or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{checklist.displayName}</h1>
              <p className="text-gray-700 mt-1">Complete your event planning checklist</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => saveProgress()}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Save Progress
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Event Summary */}
          <EventSummaryCard clientBrief={clientBrief} />

          {/* Progress Bar */}
          <ProgressBar progress={progress} />

          {/* Categories */}
          <div className="space-y-4">
            {checklist.categories.map((category) => (
              <div key={category.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">{category.title}</h3>
                      <p className="text-sm text-gray-600">
                        {selections[category.id] ? Object.keys(selections[category.id]).length : 0} of {category.items.length} completed
                      </p>
                    </div>
                  </div>
                  {expandedCategories.includes(category.id) ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </button>

                {/* Category Content */}
                {expandedCategories.includes(category.id) && (
                  <CategorySection
                    category={category}
                    selections={selections[category.id] || {}}
                    notes={notes[category.id] || ''}
                    onSelectionChange={(itemId, value) => updateSelection(category.id, itemId, value)}
                    onNotesChange={(value) => updateNotes(category.id, value)}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Completion Summary */}
          {progress.percentage >= 100 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-lg font-semibold text-emerald-800 mb-2">Checklist Complete!</h3>
              <p className="text-emerald-700 mb-4">
                Great job! You&apos;ve completed your event planning checklist.
                Don&apos;t forget to export or share your checklist with your team.
              </p>
              <button
                onClick={() => setShowExportModal(true)}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Export Final Checklist
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Export Checklist</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="font-medium text-slate-900">Export as PDF</div>
                <div className="text-sm text-slate-500">Download a printable PDF version</div>
              </button>
              <button
                onClick={() => handleExport('json')}
                className="w-full px-4 py-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="font-medium text-slate-900">Export as Data</div>
                <div className="text-sm text-slate-500">Download JSON data for integration</div>
              </button>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};