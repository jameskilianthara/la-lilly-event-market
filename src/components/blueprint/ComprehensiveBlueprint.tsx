// Vercel Force Update 1
'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  UserGroupIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  RocketLaunchIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  ClockIcon,
  CheckBadgeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { parseEventDate } from '../../lib/dateParser';
import DynamicChecklistItem from '../checklist/DynamicChecklistItem';
import VenueSelectionSection from '../checklist/VenueSelectionSection';

interface ChecklistData {
  selections: Record<string, any>;
  categoryNotes: Record<string, string>;
  imageReferences?: Record<string, string[]>;
  completedAt?: string;
}

interface ChecklistCategory {
  id: string;
  title: string;
  icon: string;
  items: ChecklistItem[];
  additionalNotes?: boolean;
}

interface ChecklistItem {
  id: string;
  question: string;
  type: 'radio' | 'select' | 'checkbox' | 'text' | 'text_with_autocomplete' | 'dynamic_venue_selector';
  options: string[];
  isDynamicVenueTrigger?: boolean;
  dependsOn?: {
    questionId: string;
    triggerValue: string | string[];
  };
  autocompleteSource?: string;
  children?: ChecklistItem[];
}

interface ClientBrief {
  event_type?: string;
  date?: string;
  city?: string;
  guest_count?: string;
  venue_status?: string;
  checklist?: ChecklistData;
}

interface TimelineMilestone {
  id: string;
  date: string;
  title: string;
  description: string;
  category: 'planning' | 'booking' | 'execution' | 'event';
  editable?: boolean;
  daysUntil?: string;
}

interface SuccessCriteria {
  primary: string[];
  quality: string[];
}

interface ComprehensiveBlueprintProps {
  eventId: string;
  clientBrief: ClientBrief;
  checklistData?: ChecklistData;
  checklistCategories?: ChecklistCategory[];
  onSave?: (data: any) => Promise<void>;
  onLaunchProject: () => Promise<void>;
  isSaving?: boolean;
}

export const ComprehensiveBlueprint: React.FC<ComprehensiveBlueprintProps> = ({
  eventId,
  clientBrief,
  checklistData,
  checklistCategories = [],
  onSave,
  onLaunchProject,
  isSaving = false
}) => {
  // Initialize state from saved blueprint data if available
  const savedBlueprint = (clientBrief as any).blueprint || null;
  
  const [executiveSummary, setExecutiveSummary] = useState(
    savedBlueprint?.executiveSummary || ''
  );
  const [specialInstructions, setSpecialInstructions] = useState(
    savedBlueprint?.specialInstructions || ''
  );
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [successCriteria, setSuccessCriteria] = useState<SuccessCriteria>(
    savedBlueprint?.successCriteria || {
      primary: [
        'Create a memorable experience for all guests',
        'Execute event within planned timeline and budget',
        'Ensure smooth coordination between all vendors'
      ],
      quality: [
        'Professional-grade execution across all services',
        'High guest satisfaction and positive feedback',
        'Zero critical issues or major delays'
      ]
    }
  );
  const [categoryNotes, setCategoryNotes] = useState<Record<string, string>>(
    savedBlueprint?.categoryNotes || checklistData?.categoryNotes || {}
  );
  const [timeline, setTimeline] = useState<TimelineMilestone[]>([]);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, any>>(
    checklistData?.selections || {}
  );
  const [selectedVenue, setSelectedVenue] = useState<any>(null);

  // Define helper functions before they're used in useEffect
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'TBD';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    } catch {
      return dateString;
    }
  };

  const generateSummaryFromChecklist = (): string => {
    if (!checklistData?.selections || !checklistCategories.length) {
      return 'Professional coordination across multiple service categories';
    }

    const categoriesWithSelections = checklistCategories.filter(category => {
      return category.items.some(item => {
        const value = checklistData.selections[item.id];
        if (Array.isArray(value)) return value.length > 0;
        return value && value.toString().trim() !== '';
      });
    });

    if (categoriesWithSelections.length === 0) {
      return 'Professional coordination across multiple service categories';
    }

    return categoriesWithSelections.slice(0, 3).map(cat => cat.title).join(', ');
  };

  const generateExecutiveSummary = (): string => {
    const eventType = clientBrief.event_type || 'event';
    const date = formatDate(clientBrief.date || '');
    const location = clientBrief.city || 'the specified location';
    const guests = clientBrief.guest_count || 'TBD';
    
    // Generate summary from checklist selections
    const keyRequirements = generateSummaryFromChecklist();
    
    return `This document outlines the complete specifications for a ${eventType} event scheduled for ${date} in ${location}. The event will host approximately ${guests} guests and includes the following key requirements: ${keyRequirements}. This blueprint serves as the authoritative specification for vendor proposals and project execution.`;
  };

  const parseEventDateSafely = (dateInput: string | undefined): Date | null => {
    if (!dateInput) return null;

    try {
      // Strategy 1: Try parsing from client_brief.date_parsed (database format)
      const briefData = (clientBrief as any).client_brief;
      if (briefData?.date_parsed) {
        const date = new Date(briefData.date_parsed);
        if (!isNaN(date.getTime())) {
          console.log('✅ Parsed date from client_brief.date_parsed:', briefData.date_parsed);
          return date;
        }
      }

      // Strategy 2: Try direct Date parsing (works for ISO formats)
      let date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        console.log('✅ Parsed date directly:', dateInput);
        return date;
      }

      // Strategy 3: Use our date parser utility
      const parsedDateStr = parseEventDate(dateInput);
      date = new Date(parsedDateStr);
      if (!isNaN(date.getTime())) {
        console.log('✅ Parsed date using parseEventDate:', dateInput, '→', parsedDateStr);
        return date;
      }

      console.warn('⚠️ All date parsing strategies failed for:', dateInput);
      return null;
    } catch (error) {
      console.error('❌ Error parsing date:', error, 'Input:', dateInput);
      return null;
    }
  };

  const calculateDaysUntil = (milestoneDate: Date, eventDate: Date): string => {
    const diffTime = eventDate.getTime() - milestoneDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Event Day';
    if (diffDays < 0) return `${Math.abs(diffDays)} days after event`;

    const weeks = Math.floor(diffDays / 7);
    if (weeks > 0) {
      return `${diffDays} days before event (${weeks} ${weeks === 1 ? 'week' : 'weeks'})`;
    }
    return `${diffDays} days before event`;
  };

  const generateTimeline = (): TimelineMilestone[] => {
    // Parse event date with multiple fallback strategies
    const eventDate = parseEventDateSafely(clientBrief.date);

    // If parsing fails, return placeholder timeline
    if (!eventDate || isNaN(eventDate.getTime())) {
      console.warn('⚠️ Invalid event date, returning placeholder timeline');
      const now = new Date();
      now.setMonth(now.getMonth() + 3); // Default to 3 months from now

      return [{
        id: 'placeholder',
        date: 'TBD',
        title: 'Event Planning',
        description: 'Please set a valid event date to see your planning timeline',
        category: 'planning',
        editable: true,
        daysUntil: 'Date required'
      }];
    }

    console.log('📅 Generating timeline for event date:', eventDate.toISOString().split('T')[0]);

    const milestones: TimelineMilestone[] = [];

    // 8 weeks before
    const week8 = new Date(eventDate);
    week8.setDate(eventDate.getDate() - 56);
    milestones.push({
      id: 'week8',
      date: week8.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      title: 'Project Launch & Vendor Selection',
      description: 'Review vendor proposals and finalize service providers',
      category: 'planning',
      editable: true,
      daysUntil: calculateDaysUntil(week8, eventDate)
    });

    // 6 weeks before
    const week6 = new Date(eventDate);
    week6.setDate(eventDate.getDate() - 42);
    milestones.push({
      id: 'week6',
      date: week6.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      title: 'Contract Finalization',
      description: 'Sign contracts and confirm booking deposits',
      category: 'booking',
      editable: true,
      daysUntil: calculateDaysUntil(week6, eventDate)
    });

    // 4 weeks before
    const week4 = new Date(eventDate);
    week4.setDate(eventDate.getDate() - 28);
    milestones.push({
      id: 'week4',
      date: week4.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      title: 'Detailed Planning Phase',
      description: 'Finalize event flow, layout, and vendor coordination',
      category: 'planning',
      editable: true,
      daysUntil: calculateDaysUntil(week4, eventDate)
    });

    // 2 weeks before
    const week2 = new Date(eventDate);
    week2.setDate(eventDate.getDate() - 14);
    milestones.push({
      id: 'week2',
      date: week2.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      title: 'Final Confirmations',
      description: 'Confirm all vendor schedules and delivery timelines',
      category: 'execution',
      editable: true,
      daysUntil: calculateDaysUntil(week2, eventDate)
    });

    // 1 week before
    const week1 = new Date(eventDate);
    week1.setDate(eventDate.getDate() - 7);
    milestones.push({
      id: 'week1',
      date: week1.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      title: 'Pre-Event Week',
      description: 'Final walkthrough and last-minute adjustments',
      category: 'execution',
      editable: true,
      daysUntil: calculateDaysUntil(week1, eventDate)
    });

    // Event day
    milestones.push({
      id: 'event',
      date: eventDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      title: 'Event Day',
      description: `${clientBrief.event_type || 'Event'} execution and coordination`,
      category: 'event',
      editable: false,
      daysUntil: 'Event Day'
    });

    return milestones;
  };

  // Initialize timeline
  useEffect(() => {
    const savedTimeline = savedBlueprint?.timeline;
    if (savedTimeline && Array.isArray(savedTimeline) && savedTimeline.length > 0) {
      setTimeline(savedTimeline);
    } else {
      const generatedTimeline = generateTimeline();
      setTimeline(generatedTimeline);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientBrief.date, clientBrief.event_type]);

  // Auto-generate executive summary on mount if not already set
  useEffect(() => {
    if (!executiveSummary && clientBrief?.event_type && !savedBlueprint?.executiveSummary) {
      const summary = generateExecutiveSummary();
      setExecutiveSummary(summary);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (!onSave) return;

    const saveTimer = setTimeout(() => {
      const blueprintData = {
        executiveSummary,
        specialInstructions,
        successCriteria,
        categoryNotes,
        timeline,
        lastModified: Date.now()
      };

      onSave({
        blueprint: blueprintData
      }).catch(console.error);
    }, 2000); // Auto-save every 2 seconds

    return () => clearTimeout(saveTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executiveSummary, specialInstructions, successCriteria, categoryNotes, timeline.length]);

  const handleEditStart = (fieldId: string, currentValue: string) => {
    setEditingField(fieldId);
    setEditValue(currentValue);
  };

  const handleEditSave = () => {
    if (!editingField) return;

    if (editingField === 'executiveSummary') {
      setExecutiveSummary(editValue);
    } else if (editingField === 'specialInstructions') {
      setSpecialInstructions(editValue);
    } else if (editingField.startsWith('success-primary-')) {
      const index = parseInt(editingField.split('-')[2]);
      const newCriteria = { ...successCriteria };
      newCriteria.primary[index] = editValue;
      setSuccessCriteria(newCriteria);
    } else if (editingField.startsWith('success-quality-')) {
      const index = parseInt(editingField.split('-')[2]);
      const newCriteria = { ...successCriteria };
      newCriteria.quality[index] = editValue;
      setSuccessCriteria(newCriteria);
    }

    setEditingField(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleAddSuccessCriterion = (type: 'primary' | 'quality') => {
    const newCriteria = { ...successCriteria };
    newCriteria[type].push('New criterion');
    setSuccessCriteria(newCriteria);
    // Start editing the new item
    const index = newCriteria[type].length - 1;
    handleEditStart(`success-${type}-${index}`, 'New criterion');
  };

  const handleRemoveSuccessCriterion = (type: 'primary' | 'quality', index: number) => {
    const newCriteria = { ...successCriteria };
    newCriteria[type].splice(index, 1);
    setSuccessCriteria(newCriteria);
  };

  const handleCategoryNotesChange = (categoryId: string, notes: string) => {
    const newNotes = { ...categoryNotes, [categoryId]: notes };
    setCategoryNotes(newNotes);
  };

  const handleChecklistAnswerChange = (questionId: string, value: any) => {
    const newAnswers = { ...checklistAnswers, [questionId]: value };
    setChecklistAnswers(newAnswers);

    // Auto-save checklist answers
    if (onSave) {
      onSave({
        blueprint: {
          ...savedBlueprint,
          checklistAnswers: newAnswers
        }
      }).catch(console.error);
    }
  };

  const handleVenueSelected = async (venue: any) => {
    setSelectedVenue(venue);

    // Auto-populate venue fields
    const venueAnswers = {
      ...checklistAnswers,
      venue_name: venue.basic_info.official_name,
      venue_address: venue.location.address,
      venue_booking_status: 'pending'
    };
    setChecklistAnswers(venueAnswers);

    // Trigger checklist optimization
    try {
      const response = await fetch('/api/venues/optimize-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue_id: venue.venue_id,
          checklist: {
            eventType: clientBrief.event_type,
            sections: checklistCategories
          }
        })
      });

      if (response.ok) {
        const optimizedData = await response.json();
        console.log('✅ Checklist optimized:', optimizedData);

        // Update checklist with auto-populated items
        if (optimizedData.auto_populated_items) {
          const updatedAnswers: Record<string, any> = { ...venueAnswers };
          optimizedData.auto_populated_items.forEach((item: any) => {
            updatedAnswers[item.item_id] = item.value;
          });
          setChecklistAnswers(updatedAnswers);
        }
      }
    } catch (error) {
      console.error('Error optimizing checklist:', error);
    }
  };

  const handleLaunchProject = async () => {
    console.log('[Blueprint] Launch button clicked, showing modal...');
    setShowLaunchModal(true);
  };

  const confirmLaunch = async () => {
    console.log('[Blueprint] User confirmed launch in modal');
    setShowLaunchModal(false);
    try {
      console.log('[Blueprint] Calling onLaunchProject()...');
      await onLaunchProject();
      console.log('[Blueprint] ✅ onLaunchProject completed successfully');
    } catch (error) {
      console.error('[Blueprint] ❌ Error in onLaunchProject:', error);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Import PDF generator
      const { generateBlueprintPDF } = await import('../../lib/pdfGenerator');

      // Prepare blueprint sections from checklist
      const blueprintSections = checklistCategories.map((category) => ({
        id: category.id,
        title: category.title,
        description: `${category.title} requirements and specifications`,
        items: category.items.map((item) => ({
          id: item.question,
          label: item.question
        }))
      }));

      // Prepare client notes from checklist answers and category notes
      const clientNotes: Record<string, string> = {};
      checklistCategories.forEach((category) => {
        category.items.forEach((item) => {
          const answer = checklistAnswers[item.id];
          if (answer) {
            const answerText = Array.isArray(answer) ? answer.join(', ') : answer.toString();
            clientNotes[item.question] = answerText;
          }
        });
        // Add category notes
        if (categoryNotes[category.id]) {
          clientNotes[`${category.title}_notes`] = categoryNotes[category.id];
        }
      });

      const pdfData = {
        blueprint: {
          id: blueprintId,
          eventType: clientBrief.event_type || 'Event',
          displayName: `${clientBrief.event_type || 'Event'} Blueprint`,
          version: '1.0',
          forgeComplexity: 'craftsman' as const,
          sections: blueprintSections
        },
        clientBrief: {
          event_type: clientBrief.event_type || 'Event',
          date: clientBrief.date || '',
          city: clientBrief.city || '',
          guest_count: clientBrief.guest_count || '',
          venue_status: clientBrief.venue_status || 'TBD'
        },
        clientNotes,
        referenceImages: [],
        blueprintId: eventId,
        generatedDate: new Date().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        executiveSummary: executiveSummary || 'Professional event blueprint',
        specialInstructions: specialInstructions || ''
      };

      await generateBlueprintPDF(pdfData);
      console.log('✅ PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleShareBlueprint = async () => {
    try {
      const shareUrl = `${window.location.origin}/blueprint/${eventId}`;
      const shareText = `Check out my ${clientBrief.event_type || 'event'} blueprint on EventFoundry!`;

      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: `${clientBrief.event_type || 'Event'} Blueprint - EventFoundry`,
          text: shareText,
          url: shareUrl
        });
        console.log('✅ Blueprint shared successfully');
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert('Blueprint link copied to clipboard!\n\n' + shareUrl);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing blueprint:', error);
        // Fallback: Show share URL
        const shareUrl = `${window.location.origin}/blueprint/${eventId}`;
        alert('Share this link:\n\n' + shareUrl);
      }
    }
  };

  const renderEditableText = (
    fieldId: string,
    value: string,
    placeholder: string,
    multiline: boolean = false,
    rows: number = 4
  ) => {
    if (editingField === fieldId) {
      return (
        <div className="inline-editor">
          {multiline ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              rows={rows}
              className="w-full bg-white border-2 border-blue-400 rounded-xl px-4 py-3 text-slate-700 text-base focus:outline-none focus:ring-4 focus:ring-blue-100 resize-none"
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-white border-2 border-blue-400 rounded-xl px-4 py-3 text-slate-700 text-base focus:outline-none focus:ring-4 focus:ring-blue-100"
              autoFocus
            />
          )}
          <div className="flex items-center space-x-2 mt-2">
            <button
              onClick={handleEditSave}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              ✅ Save
            </button>
            <button
              onClick={handleEditCancel}
              className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-lg font-medium transition-colors"
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className="editable-text cursor-pointer group relative"
        onClick={() => handleEditStart(fieldId, value)}
      >
        <div className="text-slate-700 leading-relaxed">{value || placeholder}</div>
        <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <PencilSquareIcon className="h-4 w-4 text-slate-400" />
        </span>
      </div>
    );
  };

  const renderRequirementValue = (item: ChecklistItem): string => {
    const value = checklistData?.selections[item.id];
    if (!value) return 'Not specified';

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return value.toString();
  };

  const blueprintId = `EF-${eventId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const generatedDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const venueDecided = clientBrief.venue_status === 'booked' || clientBrief.venue_status === 'confirmed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          {/* Event Overview */}
          <div className="text-center mb-8 lg:mb-12">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-4 rounded-full bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-400/30 backdrop-blur-sm">
              <SparklesIcon className="h-5 w-5 text-orange-300 mr-2" />
              <span className="text-orange-200 font-semibold text-sm uppercase tracking-wide">
                {clientBrief.event_type || 'Event'} Event Blueprint
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
              {clientBrief.event_type || 'Event'} Event Blueprint
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6 mb-8">
              <div className="flex items-center space-x-2 text-white/90">
                <CalendarIcon className="h-5 w-5 text-orange-300" />
                <span className="text-lg">{formatDate(clientBrief.date || '')}</span>
              </div>
              <div className="flex items-center space-x-2 text-white/90">
                <UserGroupIcon className="h-5 w-5 text-blue-300" />
                <span className="text-lg">{clientBrief.guest_count || 'TBD'} Guests</span>
              </div>
              <div className="flex items-center space-x-2 text-white/90">
                <MapPinIcon className="h-5 w-5 text-purple-300" />
                <span className="text-lg">{clientBrief.city || 'TBD'}</span>
              </div>
            </div>
          </div>

          {/* Status & Launch */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50"></div>
                <div>
                  <div className="text-sm text-slate-400 font-medium">Blueprint Status</div>
                  <div className="text-white font-bold text-lg">Draft - Ready to Launch</div>
                </div>
              </div>

              <button
                onClick={handleLaunchProject}
                disabled={isSaving}
                className="w-full lg:w-auto group relative overflow-hidden bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white font-bold px-8 py-4 rounded-xl flex items-center justify-center space-x-3 shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <RocketLaunchIcon className="h-6 w-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-lg relative z-10">🚀 Launch Project</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
        {/* Executive Summary */}
        <section className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-blue-900 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Executive Summary</h2>
                  <p className="text-slate-300 text-sm">High-level event overview</p>
                </div>
              </div>
              <button
                onClick={() => handleEditStart('executiveSummary', executiveSummary)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <PencilSquareIcon className="h-4 w-4" />
                <span>Edit Summary</span>
              </button>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border-2 border-slate-200 rounded-xl p-5 hover:border-blue-300 focus-within:border-blue-400 transition-all duration-300">
              {renderEditableText('executiveSummary', executiveSummary, 'Provide a high-level overview of your event...', true, 4)}
            </div>
            {isSaving && (
              <div className="mt-3 flex items-center space-x-2 text-orange-600">
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                <p className="text-sm font-medium">Saving...</p>
              </div>
            )}
          </div>
        </section>

        {/* Event Specifications */}
        <section className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-700 px-6 py-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Event Specifications</h2>
                <p className="text-blue-100 text-sm">Core event information</p>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="spec-item bg-gradient-to-br from-slate-50 to-blue-50/30 border-2 border-slate-200 rounded-xl p-5">
                <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Event Type</label>
                <span className="text-slate-900 font-bold text-lg">{clientBrief.event_type || 'TBD'}</span>
              </div>

              <div className="spec-item bg-gradient-to-br from-slate-50 to-blue-50/30 border-2 border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Event Date</label>
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">📅 Change Date</button>
                </div>
                <span className="text-slate-900 font-bold text-lg">{formatDate(clientBrief.date || '')}</span>
              </div>

              <div className="spec-item bg-gradient-to-br from-slate-50 to-blue-50/30 border-2 border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Guest Count</label>
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">👥 Adjust Count</button>
                </div>
                <span className="text-slate-900 font-bold text-lg">{clientBrief.guest_count || 'TBD'}</span>
              </div>

              <div className="spec-item bg-gradient-to-br from-slate-50 to-blue-50/30 border-2 border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Location</label>
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">📍 Change Location</button>
                </div>
                <span className="text-slate-900 font-bold text-lg">{clientBrief.city || 'TBD'}</span>
              </div>

              <div className="spec-item bg-gradient-to-br from-slate-50 to-blue-50/30 border-2 border-slate-200 rounded-xl p-5">
                <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Venue Status</label>
                <span className={`text-lg font-bold ${venueDecided ? 'text-green-600' : 'text-orange-600'}`}>
                  {venueDecided ? '✓ Venue Confirmed' : 'Venue Required'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline & Milestones */}
        <section className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Event Timeline & Milestones</h2>
                  <p className="text-blue-100 text-sm">Your journey to a perfect event</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-purple-200 to-green-200 rounded-full hidden lg:block"></div>
              <div className="space-y-6">
                {timeline.map((milestone, index) => {
                  const isLast = index === timeline.length - 1;
                  const categoryColors = {
                    planning: { from: 'from-blue-500', to: 'to-blue-600', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                    booking: { from: 'from-purple-500', to: 'to-purple-600', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
                    execution: { from: 'from-orange-500', to: 'to-orange-600', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
                    event: { from: 'from-green-500', to: 'to-green-600', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' }
                  };
                  const colors = categoryColors[milestone.category];

                  return (
                    <div key={milestone.id} className="relative flex items-start space-x-4 lg:space-x-6 group">
                      <div className="relative flex-shrink-0">
                        <div className={`w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br ${colors.from} ${colors.to} rounded-2xl flex items-center justify-center shadow-lg z-10 relative`}>
                          <span className="text-white font-bold text-lg">{index + 1}</span>
                        </div>
                        {!isLast && (
                          <div className="absolute top-12 left-1/2 w-0.5 h-12 bg-gradient-to-b from-slate-300 to-slate-200 -translate-x-1/2 lg:hidden"></div>
                        )}
                      </div>

                      <div className={`flex-1 bg-gradient-to-br from-white to-slate-50 rounded-2xl border-2 ${colors.border} p-5 lg:p-6`}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`inline-block px-3 py-1 ${colors.bg} ${colors.text} text-xs font-bold uppercase tracking-wide rounded-full`}>
                                {milestone.category}
                              </span>
                              {isLast && (
                                <span className="inline-block px-3 py-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold uppercase tracking-wide rounded-full">
                                  Event Day
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-900 text-lg lg:text-xl mb-1">{milestone.title}</h4>
                            <p className="text-slate-600 text-sm lg:text-base">{milestone.description}</p>
                          </div>
                          <div className="flex-shrink-0">
                            <div className={`bg-gradient-to-br ${colors.from} ${colors.to} text-white px-4 py-2 rounded-xl shadow-lg`}>
                              <div className="text-xs font-medium opacity-90 uppercase tracking-wide">Date</div>
                              <div className="text-sm lg:text-base font-bold">{milestone.date}</div>
                              {milestone.daysUntil && (
                                <div className="text-xs opacity-75 mt-1">{milestone.daysUntil}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <button className="mt-6 w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2">
              <span>+</span>
              <span>Add Custom Milestone</span>
            </button>
          </div>
        </section>

        {/* Detailed Requirements */}
        {checklistCategories.length > 0 && (
          <section className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Detailed Requirements</h2>
                    <p className="text-purple-100 text-sm">Specifications from your checklist</p>
                  </div>
                </div>
                <div className="hidden sm:block bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <span className="text-white text-sm font-medium">{checklistCategories.length} Categories</span>
                </div>
              </div>
            </div>

            <div className="p-6 lg:p-8 space-y-6">
              {checklistCategories.map((category, categoryIndex) => {
                const categoryNote = categoryNotes[category.id] || '';
                const itemsWithSelections = category.items.filter(item => {
                  const value = checklistData?.selections[item.id];
                  if (Array.isArray(value)) return value.length > 0;
                  return value && value.toString().trim() !== '';
                });

                // Helper function to format answer values
                const formatAnswer = (value: any): string => {
                  if (!value) return 'Not specified';
                  if (Array.isArray(value)) {
                    if (value.length === 0) return 'Not specified';
                    return value.map(v => {
                      // Convert snake_case or kebab-case to Title Case
                      return v.toString().replace(/[_-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
                    }).join(', ');
                  }
                  // Convert single values: buffet_style → Buffet Style
                  return value.toString().replace(/[_-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
                };

                // Show all categories - even empty ones can have notes added
                // Users can add vendor-specific notes for any category

                return (
                  <div key={category.id} className="bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 rounded-2xl overflow-hidden">
                    {/* Category Header */}
                    <div className="bg-gradient-to-r from-slate-50 to-purple-50/30 px-5 py-4 border-b-2 border-slate-200">
                      <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-3">
                        <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white text-sm font-bold flex items-center justify-center shadow-lg">
                          {categoryIndex + 1}
                        </span>
                        <span>{category.title}</span>
                        <span className="ml-auto text-sm font-normal text-slate-500">
                          {itemsWithSelections.length} {itemsWithSelections.length === 1 ? 'requirement' : 'requirements'}
                        </span>
                      </h3>
                    </div>

                    {/* Captured Requirements (Read-Only) */}
                    {itemsWithSelections.length > 0 && (
                      <div className="bg-white">
                        <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-200">
                          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-2">
                            <CheckCircleIcon className="h-4 w-4 text-purple-500" />
                            <span>Captured Requirements</span>
                          </h4>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {itemsWithSelections.map((item) => {
                            const answer = checklistAnswers[item.id];
                            const formattedAnswer = formatAnswer(answer);

                            return (
                              <div key={item.id} className="p-4 hover:bg-purple-50/20 transition-all duration-200">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="text-sm font-semibold text-slate-600 mb-1">
                                      {item.question}
                                    </div>
                                    <div className="text-base font-medium text-slate-900">
                                      {formattedAnswer}
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                      {item.type === 'checkbox' && Array.isArray(answer) ? `${answer.length} selected` : 'Specified'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Additional Notes Section (Always Editable) */}
                    <div className="p-5 border-t-2 border-slate-200 bg-gradient-to-br from-slate-50/50 to-purple-50/20">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wide flex items-center space-x-2">
                          <PencilSquareIcon className="h-4 w-4 text-purple-500" />
                          <span>Additional Notes for {category.title}</span>
                        </h4>
                        {categoryNote && (
                          <span className="text-xs text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded-full">
                            Notes Added
                          </span>
                        )}
                      </div>
                      <textarea
                        value={categoryNote}
                        onChange={(e) => handleCategoryNotesChange(category.id, e.target.value)}
                        placeholder={`Add any special instructions or preferences for ${category.title.toLowerCase()}...`}
                        rows={4}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm leading-relaxed focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 resize-none transition-all duration-200 hover:border-purple-300"
                      />
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>💡 Tip: Add vendor-specific instructions, cultural preferences, or budget constraints</span>
                        {categoryNote && (
                          <span className="text-purple-600 font-medium">{categoryNote.length} characters</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Special Instructions */}
        <section className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 via-orange-700 to-pink-600 px-6 py-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Special Instructions</h2>
                <p className="text-orange-100 text-sm">Cultural, accessibility & unique requirements</p>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <div className="bg-gradient-to-br from-orange-50 to-pink-50/30 border-2 border-orange-200 rounded-xl p-5 hover:border-orange-300 focus-within:border-orange-400 transition-all duration-300">
              {renderEditableText('specialInstructions', specialInstructions, 'Any special requirements, cultural considerations, accessibility needs, dietary restrictions, or unique preferences for vendors to consider...', true, 5)}
            </div>
            <p className="text-sm text-slate-500 mt-3 flex items-center space-x-2">
              <PencilSquareIcon className="h-4 w-4" />
              <span>Add any special considerations for vendors</span>
            </p>
          </div>
        </section>

        {/* Success Criteria */}
        <section className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 px-6 py-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <CheckBadgeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Event Success Criteria</h2>
                <p className="text-green-100 text-sm">Define what success looks like</p>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Primary Objectives */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">🎯</span>
                    </div>
                    <span>Primary Objectives</span>
                  </h4>
                  <button
                    onClick={() => handleAddSuccessCriterion('primary')}
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    + Add
                  </button>
                </div>
                <ul className="space-y-3">
                  {successCriteria.primary.map((criterion, index) => (
                    <li key={index} className="flex items-start space-x-3 bg-white rounded-lg p-3 border border-green-200">
                      <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        {editingField === `success-primary-${index}` ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleEditSave}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditSave();
                                if (e.key === 'Escape') handleEditCancel();
                              }}
                              className="flex-1 px-2 py-1 border border-green-300 rounded text-sm"
                              autoFocus
                            />
                            <button
                              onClick={handleEditSave}
                              className="text-green-600 hover:text-green-700"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleRemoveSuccessCriterion('primary', index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between group">
                            <span
                              className="text-sm text-slate-700 leading-relaxed cursor-pointer flex-1"
                              onClick={() => handleEditStart(`success-primary-${index}`, criterion)}
                            >
                              {criterion}
                            </span>
                            <button
                              onClick={() => handleEditStart(`success-primary-${index}`, criterion)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-slate-400 hover:text-slate-600"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quality Standards */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">✨</span>
                    </div>
                    <span>Quality Standards</span>
                  </h4>
                  <button
                    onClick={() => handleAddSuccessCriterion('quality')}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    + Add
                  </button>
                </div>
                <ul className="space-y-3">
                  {successCriteria.quality.map((standard, index) => (
                    <li key={index} className="flex items-start space-x-3 bg-white rounded-lg p-3 border border-blue-200">
                      <CheckCircleIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        {editingField === `success-quality-${index}` ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleEditSave}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditSave();
                                if (e.key === 'Escape') handleEditCancel();
                              }}
                              className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm"
                              autoFocus
                            />
                            <button
                              onClick={handleEditSave}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleRemoveSuccessCriterion('quality', index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between group">
                            <span
                              className="text-sm text-slate-700 leading-relaxed cursor-pointer flex-1"
                              onClick={() => handleEditStart(`success-quality-${index}`, standard)}
                            >
                              {standard}
                            </span>
                            <button
                              onClick={() => handleEditStart(`success-quality-${index}`, standard)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-slate-400 hover:text-slate-600"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* EventFoundry Branding Footer */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 rounded-3xl border-2 border-slate-700 shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50"></div>
          <div className="relative p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
              <div className="flex items-center space-x-5">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/30">
                  <SparklesIcon className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-white mb-1">EventFoundry</h3>
                  <p className="text-slate-300 text-sm lg:text-base">Professional Event Blueprint System</p>
                  <p className="text-slate-400 text-xs mt-1">Kerala's Premier Event Marketplace</p>
                </div>
              </div>

              <div className="text-center lg:text-right bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Document ID</p>
                <p className="text-white font-mono font-bold text-lg mb-2">{blueprintId}</p>
                <div className="flex items-center justify-center lg:justify-end space-x-2 text-xs text-slate-400">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Generated: {generatedDate}</span>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-white/10 pt-8">
              <p className="text-slate-300 text-base leading-relaxed mb-6 text-center lg:text-left max-w-3xl">
                This professional blueprint was generated by <span className="font-bold text-white bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">EventFoundry</span>. Your specification will reach verified, qualified vendors ready to bring your vision to life.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={handleDownloadPDF}
                  className="group flex items-center justify-center space-x-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/20 hover:border-white/30 text-white px-6 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl min-h-[44px]"
                >
                  <DocumentArrowDownIcon className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-semibold">Download PDF</span>
                </button>

                <button
                  onClick={handleShareBlueprint}
                  className="group flex items-center justify-center space-x-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/20 hover:border-white/30 text-white px-6 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl min-h-[44px]"
                >
                  <ShareIcon className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-semibold">Share Blueprint</span>
                </button>

                <button
                  onClick={handleLaunchProject}
                  disabled={isSaving}
                  className="group flex items-center justify-center space-x-3 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white px-6 py-4 rounded-xl transition-all duration-300 font-bold shadow-2xl hover:shadow-orange-500/50 hover:scale-105 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RocketLaunchIcon className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Launch Project</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Launch Project Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 rounded-3xl shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative p-8 lg:p-12">
            <div className="text-center mb-8">
              <div className="inline-block relative mb-4">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce">
                  <RocketLaunchIcon className="h-12 w-12 text-white" />
                </div>
              </div>
              <h3 className="text-3xl lg:text-4xl font-bold text-white mb-3">🚀 Ready to Launch Your Project?</h3>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                Once launched, this blueprint will be shared with qualified vendors who will provide detailed proposals for your {clientBrief.event_type || 'event'} event.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 mb-6 shadow-2xl">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center">
                <CheckBadgeIcon className="h-6 w-6 text-green-500 mr-2" />
                Before launching, please review:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700">Event specifications are correct</span>
                </div>
                <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700">Timeline and milestones are realistic</span>
                </div>
                <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700">All requirements are clearly specified</span>
                </div>
                <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700">Special instructions are complete</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLaunchProject}
              className="w-full group relative overflow-hidden bg-white hover:bg-slate-50 text-transparent bg-clip-text font-bold text-xl py-6 rounded-2xl flex items-center justify-center space-x-4 shadow-2xl hover:shadow-white/50 transition-all duration-300 transform hover:scale-[1.02] min-h-[44px]"
            >
              <div className="absolute inset-0 bg-white"></div>
              <RocketLaunchIcon className="h-8 w-8 relative z-10 text-orange-600 group-hover:rotate-12 transition-transform duration-300" style={{ color: '#ea580c' }} />
              <span className="relative z-10 bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Launch Project & Find Vendors
              </span>
            </button>

            <p className="text-center text-white/90 text-sm mt-4">
              🔒 After launch, vendors will receive this blueprint and submit proposals within 48-72 hours.
            </p>
          </div>
        </section>
      </div>

      {/* Launch Confirmation Modal */}
      {showLaunchModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-slate-900">Launch Project?</h3>
              <button
                onClick={() => setShowLaunchModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="text-slate-600 mb-6">
              Once launched, this blueprint will be shared with qualified vendors who will provide detailed proposals for your {clientBrief.event_type || 'event'} event.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowLaunchModal(false)}
                className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLaunch}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-lg font-bold transition-all"
              >
                Launch Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

