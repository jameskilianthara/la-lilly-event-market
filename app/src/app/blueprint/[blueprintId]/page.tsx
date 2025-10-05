'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  PencilIcon,
  CloudArrowUpIcon,
  BookmarkIcon,
  ChevronDownIcon,
  SparklesIcon,
  RocketLaunchIcon,
  MusicalNoteIcon,
  CakeIcon,
  CameraIcon,
  TruckIcon,
  HashtagIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

interface EventMemory {
  event_type: string;
  date: string;
  location: string;
  guest_count: string;
  venue_status: string;
}

interface ChecklistData {
  selections: Record<string, any>;
  notes: Record<string, string>;
}

export default function BlueprintReviewPage() {
  const params = useParams();
  const router = useRouter();
  const blueprintId = params.blueprintId as string;

  const [eventMemory, setEventMemory] = useState<EventMemory | null>(null);
  const [checklistData, setChecklistData] = useState<ChecklistData | null>(null);
  const [eventType, setEventType] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [eventId, setEventId] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Generate unique event ID
  const generateEventId = (eventType: string, date: string) => {
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const randomStr = Math.random().toString(36).substring(2, 7);
    return `evt_${timestamp}_${randomStr}`;
  };

  const loadData = () => {
    // Get event type from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const typeFromUrl = urlParams.get('type');

    // Load event memory
    const savedMemory = localStorage.getItem('lalilly-event-memory');
    let memoryEventType = 'wedding';
    let memoryDate = '';

    if (savedMemory) {
      const memory = JSON.parse(savedMemory);
      setEventMemory(memory);
      memoryEventType = memory.event_type || 'wedding';
      memoryDate = memory.date || '';
    }

    // Use URL type if available, otherwise use memory type
    const finalEventType = typeFromUrl || memoryEventType;
    setEventType(finalEventType);

    // Load or generate event ID
    const eventIdKey = `event_id_${finalEventType}_${memoryDate}`;
    let savedEventId = localStorage.getItem(eventIdKey);

    if (!savedEventId) {
      savedEventId = generateEventId(finalEventType, memoryDate);
      localStorage.setItem(eventIdKey, savedEventId);
    }

    setEventId(savedEventId);

    // Load checklist data with correct event type
    const checklistKey = `checklist_${finalEventType.toLowerCase()}`;
    const savedChecklist = localStorage.getItem(checklistKey);

    if (savedChecklist) {
      setChecklistData(JSON.parse(savedChecklist));
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCopyEventId = async () => {
    try {
      await navigator.clipboard.writeText(eventId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSaveDraft = () => {
    setSaving(true);
    // Include event ID in saved data
    const draftData = {
      eventId,
      eventMemory,
      checklistData,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(`event_draft_${eventId}`, JSON.stringify(draftData));

    setTimeout(() => {
      setSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  const handlePostToVendors = () => {
    setPosting(true);
    // Save project with event ID and navigate
    const projectData = {
      eventId,
      eventMemory,
      checklistData,
      status: 'posted_to_vendors',
      postedAt: new Date().toISOString()
    };
    localStorage.setItem(`lalilly-project-${eventId}`, JSON.stringify(projectData));
    localStorage.setItem('lalilly-project-generated', 'true');

    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  // Get category data for display
  const getCategoryDisplay = () => {
    if (!checklistData || !checklistData.selections) return [];

    const categoryData: any[] = [];

    // Get all categories that have notes (these are the actual categories from checklist)
    const categoriesWithData = new Set(Object.keys(checklistData.notes || {}));

    // Also check selections to find which categories have data
    Object.keys(checklistData.selections).forEach(itemId => {
      // Items are saved with their category ID - extract it
      // No direct mapping available, so we'll group all selections together
    });

    // Category mapping with proper icons
    const categoryMap: Record<string, { title: string; icon: any }> = {
      venue_logistics: { title: 'Venue & Logistics', icon: BuildingOffice2Icon },
      design_decoration: { title: 'Design & Decoration', icon: SparklesIcon },
      entertainment_activities: { title: 'Entertainment & Activities', icon: MusicalNoteIcon },
      food_beverage: { title: 'Food & Beverage', icon: CakeIcon },
      photography_documentation: { title: 'Photography & Documentation', icon: CameraIcon },
      photography: { title: 'Photography & Documentation', icon: CameraIcon },
      transportation: { title: 'Transportation & Logistics', icon: TruckIcon },
      venue_setup: { title: 'Venue & Setup', icon: BuildingOffice2Icon },
      materials_branding: { title: 'Materials & Branding', icon: SparklesIcon },
      technology_av: { title: 'Technology & AV', icon: SparklesIcon },
      food_beverage_conf: { title: 'Food & Beverage', icon: CakeIcon },
      support_services: { title: 'Support Services', icon: SparklesIcon },
      party_specifications: { title: 'Party Specifications', icon: SparklesIcon },
      venue_decor: { title: 'Venue & Decoration', icon: SparklesIcon },
      entertainment_party: { title: 'Entertainment & Activities', icon: MusicalNoteIcon },
      food_beverage_party: { title: 'Food & Beverage', icon: CakeIcon },
      additional_services: { title: 'Additional Services', icon: SparklesIcon },
      exhibition_details: { title: 'Exhibition Details', icon: SparklesIcon },
      venue_infrastructure: { title: 'Venue & Infrastructure', icon: BuildingOffice2Icon },
      setup_design: { title: 'Setup & Design', icon: SparklesIcon },
      marketing_engagement: { title: 'Marketing & Engagement', icon: SparklesIcon },
      services_logistics: { title: 'Services & Logistics', icon: TruckIcon },
    };

    // Collect all selections
    const allSelections: string[] = [];
    Object.entries(checklistData.selections).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        allSelections.push(...value);
      } else if (value && typeof value === 'string') {
        allSelections.push(value);
      }
    });

    // For categories with notes, create display items
    Object.entries(checklistData.notes || {}).forEach(([categoryId, notes]) => {
      const category = categoryMap[categoryId];
      if (category && notes) {
        categoryData.push({
          id: categoryId,
          title: category.title,
          icon: category.icon,
          selections: [], // Will show all selections in first category
          notes: notes
        });
      }
    });

    // If we have selections but no categories with notes, create a general category
    if (allSelections.length > 0 && categoryData.length === 0) {
      categoryData.push({
        id: 'general_requirements',
        title: 'Event Requirements',
        icon: CheckCircleIcon,
        selections: allSelections,
        notes: ''
      });
    } else if (allSelections.length > 0 && categoryData.length > 0) {
      // Add all selections to the first category
      categoryData[0].selections = allSelections;
    }

    return categoryData;
  };

  const hasChecklistData = checklistData && Object.keys(checklistData.selections).length > 0;
  const categoryDisplay = getCategoryDisplay();

  if (!eventMemory || !hasChecklistData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <SparklesIcon className="h-16 w-16 text-orange-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Complete Your Checklist First</h2>
          <p className="text-slate-300 mb-8">
            Fill out your event requirements checklist to see your complete blueprint summary.
          </p>
          <button
            onClick={() => router.push('/checklist?type=wedding')}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Go to Checklist
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Your Event Forge Blueprint
              </h1>
              <p className="text-slate-300 mt-2 text-sm sm:text-base">Review and finalize your event specifications</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push(`/checklist?type=${eventType}`)}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg transition-all duration-200 border border-slate-600/50"
              >
                <PencilIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Edit Requirements</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Event ID Card */}
          {eventId && (
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <HashtagIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-400 mb-1">Event ID</p>
                    <code className="text-base sm:text-lg font-mono font-semibold text-white bg-slate-700/50 px-3 py-1 rounded border border-slate-600/50 inline-block break-all">
                      {eventId}
                    </code>
                  </div>
                </div>
                <button
                  onClick={handleCopyEventId}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 rounded-lg text-blue-400 font-medium transition-all duration-200 flex-shrink-0"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                  <span className="text-sm">{copySuccess ? 'Copied!' : 'Copy ID'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3 ml-13">
                This unique ID tracks your event through the vendor bidding process
              </p>
            </div>
          )}

          {/* Core Event Details */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Core Event Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center space-x-3">
                  <SparklesIcon className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-xs text-slate-400">Event Type</p>
                    <p className="text-lg font-semibold text-white capitalize">{eventMemory.event_type}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-xs text-slate-400">Event Date</p>
                    <p className="text-lg font-semibold text-white">{eventMemory.date}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center space-x-3">
                  <MapPinIcon className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="text-lg font-semibold text-white">{eventMemory.location}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center space-x-3">
                  <UsersIcon className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-xs text-slate-400">Guest Count</p>
                    <p className="text-lg font-semibold text-white">{eventMemory.guest_count} guests</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50 sm:col-span-2">
                <div className="flex items-center space-x-3">
                  <BuildingOffice2Icon className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-xs text-slate-400">Venue Status</p>
                    <p className="text-lg font-semibold text-white capitalize">{eventMemory.venue_status}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements Summary */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Requirements Summary</h2>
            </div>

            <div className="space-y-4">
              {categoryDisplay.map((category) => {
                const isExpanded = expandedCategories.has(category.id);
                const IconComponent = category.icon;

                return (
                  <div
                    key={category.id}
                    className="bg-slate-700/20 rounded-xl border border-slate-600/50 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-white">{category.title}</h3>
                          <p className="text-xs text-slate-400">{category.selections.length} items selected</p>
                        </div>
                      </div>
                      <ChevronDownIcon
                        className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${
                          isExpanded ? 'rotate-180' : 'rotate-0'
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-600/50 p-4 bg-slate-800/30">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-slate-300 mb-2">Selected Items:</p>
                            <div className="flex flex-wrap gap-2">
                              {category.selections.map((item: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-sm text-orange-300"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>

                          {category.notes && (
                            <div>
                              <p className="text-sm font-medium text-slate-300 mb-2">Custom Notes:</p>
                              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-600/30">
                                <p className="text-sm text-slate-200">{category.notes}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500 text-white font-semibold rounded-xl transition-all duration-200"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <BookmarkIcon className="h-5 w-5" />
                    <span>Save Draft</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePostToVendors}
                disabled={posting}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 hover:from-orange-600 hover:via-orange-700 hover:to-orange-600 text-white font-bold rounded-xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 border border-orange-400/50"
              >
                {posting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Posting to Forge...</span>
                  </>
                ) : (
                  <>
                    <RocketLaunchIcon className="h-5 w-5" />
                    <span>Post to Master Craftsmen</span>
                  </>
                )}
              </button>
            </div>

            {showSuccess && (
              <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                <p className="text-green-300 font-medium">Draft saved successfully!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
