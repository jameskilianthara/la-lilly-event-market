'use client';

import { useState, useEffect, useCallback } from 'react';

interface ChecklistItem {
  id: string;
  question: string;
  type: string;
  options?: string[];
  placeholder?: string;
}

interface ChecklistCategory {
  id: string;
  title: string;
  icon: string;
  items: ChecklistItem[];
  additionalNotes: boolean;
}

interface Checklist {
  eventType: string;
  displayName: string;
  categories: ChecklistCategory[];
  [key: string]: string | ChecklistCategory[];
}

interface Progress {
  completed: number;
  total: number;
  percentage: number;
}

export const useChecklist = (eventType: string) => {
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [selections, setSelections] = useState<Record<string, Record<string, string | string[] | boolean>>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map event types to checklist files
  const getChecklistFile = (type: string): string => {
    const normalizedType = type.toLowerCase();

    if (['wedding', 'marriage', 'nikah', 'shaadi'].includes(normalizedType)) {
      return 'wedding';
    }
    if (['engagement', 'ring-ceremony'].includes(normalizedType)) {
      return 'wedding'; // Use wedding checklist for engagement as they're similar
    }
    if (['conference', 'meeting', 'corporate', 'business'].includes(normalizedType)) {
      return 'conference';
    }
    if (['birthday', 'party', 'dj', 'theme-party', 'celebration'].includes(normalizedType)) {
      return 'party';
    }
    if (['exhibition', 'trade-show', 'expo'].includes(normalizedType)) {
      return 'exhibition';
    }
    if (['film-event', 'movie-launch', 'pooja', 'audio-launch', 'video-launch'].includes(normalizedType)) {
      return 'conference'; // Use conference template for film events
    }
    if (['press-conference', 'media-event'].includes(normalizedType)) {
      return 'conference';
    }
    if (['promotion', 'road-show', 'marketing'].includes(normalizedType)) {
      return 'conference'; // Use conference template for promotional events
    }
    if (['inauguration', 'opening'].includes(normalizedType)) {
      return 'conference';
    }
    if (['employee-engagement', 'dealer-meet', 'team-event'].includes(normalizedType)) {
      return 'conference';
    }

    // Default to wedding for unknown types
    return 'wedding';
  };

  // Load checklist data
  useEffect(() => {
    const loadChecklist = async () => {
      try {
        setLoading(true);
        setError(null);

        const checklistFile = getChecklistFile(eventType);
        const response = await fetch(`/api/checklist/${checklistFile}`);

        if (!response.ok) {
          // Fallback to local import if API not available
          const checklistModule = await import(`../data/checklists/${checklistFile}.json`);
          setChecklist(checklistModule.default);
        } else {
          const data = await response.json();
          setChecklist(data);
        }

        // Load saved progress from localStorage
        const savedKey = `checklist-progress-${eventType}`;
        const savedData = localStorage.getItem(savedKey);

        if (savedData) {
          const parsed = JSON.parse(savedData);
          setSelections(parsed.selections || {});
          setNotes(parsed.notes || {});
        }

      } catch (err) {
        console.error('Error loading checklist:', err);
        setError('Failed to load checklist');
      } finally {
        setLoading(false);
      }
    };

    if (eventType) {
      loadChecklist();
    }
  }, [eventType]);

  // Calculate progress
  const progress: Progress = useCallback(() => {
    if (!checklist) return { completed: 0, total: 0, percentage: 0 };

    let totalItems = 0;
    let completedItems = 0;

    checklist.categories.forEach(category => {
      category.items.forEach(item => {
        totalItems++;
        const value = selections[category.id]?.[item.id];

        if (value) {
          if (Array.isArray(value) && value.length > 0) {
            completedItems++;
          } else if (!Array.isArray(value) && value.toString().trim() !== '') {
            completedItems++;
          }
        }
      });
    });

    return {
      completed: completedItems,
      total: totalItems,
      percentage: totalItems > 0 ? (completedItems / totalItems) * 100 : 0
    };
  }, [checklist, selections])();

  // Update selection for a specific item
  const updateSelection = useCallback((categoryId: string, itemId: string, value: string | string[] | boolean) => {
    setSelections(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [itemId]: value
      }
    }));
  }, []);

  // Update notes for a category
  const updateNotes = useCallback((categoryId: string, value: string) => {
    setNotes(prev => ({
      ...prev,
      [categoryId]: value
    }));
  }, []);

  // Save progress to localStorage
  const saveProgress = useCallback(() => {
    const savedKey = `checklist-progress-${eventType}`;
    const dataToSave = {
      selections,
      notes,
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem(savedKey, JSON.stringify(dataToSave));
      return true;
    } catch (err) {
      console.error('Error saving progress:', err);
      return false;
    }
  }, [eventType, selections, notes]);

  // Auto-save progress when selections or notes change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (Object.keys(selections).length > 0 || Object.keys(notes).length > 0) {
        saveProgress();
      }
    }, 1000);

    return () => clearTimeout(debounceTimer);
  }, [selections, notes, saveProgress]);

  // Export checklist
  const exportChecklist = useCallback(async (format: 'pdf' | 'json', clientBrief: Record<string, string>) => {
    const exportData = {
      eventType,
      checklist,
      selections,
      notes,
      progress,
      clientBrief,
      exportedAt: new Date().toISOString()
    };

    if (format === 'json') {
      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventType}-checklist-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // In a real implementation, you would generate a PDF
      // For now, create a formatted text version
      let content = `${checklist?.displayName || 'Event Checklist'}\n\n`;
      content += `Event Details:\n`;
      content += `Type: ${clientBrief.event_type || 'N/A'}\n`;
      content += `Date: ${clientBrief.date || 'N/A'}\n`;
      content += `City: ${clientBrief.city || 'N/A'}\n`;
      content += `Guests: ${clientBrief.guest_count || 'N/A'}\n`;
      content += `Venue Status: ${clientBrief.venue_status || 'N/A'}\n\n`;

      checklist?.categories.forEach(category => {
        content += `${category.title}\n`;
        content += '='.repeat(category.title.length) + '\n\n';

        category.items.forEach(item => {
          const value = selections[category.id]?.[item.id];
          content += `□ ${item.question}\n`;
          if (value) {
            if (Array.isArray(value)) {
              value.forEach(v => content += `  ✓ ${v}\n`);
            } else {
              content += `  ✓ ${value}\n`;
            }
          }
          content += '\n';
        });

        if (notes[category.id]) {
          content += `Notes: ${notes[category.id]}\n\n`;
        }
      });

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventType}-checklist-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [eventType, checklist, selections, notes, progress]);

  return {
    checklist,
    selections,
    notes,
    loading,
    error,
    progress,
    updateSelection,
    updateNotes,
    saveProgress,
    exportChecklist
  };
};