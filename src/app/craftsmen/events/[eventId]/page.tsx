'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  PhotoIcon,
  ClockIcon,
  CheckCircleIcon,
  BookmarkIcon,
  ShareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
  InboxIcon,
  XCircleIcon,
  HeartIcon,
  BriefcaseIcon,
  CakeIcon,
  RocketLaunchIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface VendorSession {
  vendorId: string;
  email: string;
  businessName?: string;
}

interface EventData {
  eventId: string;
  eventMemory: {
    event_type: string;
    date: string;
    location: string;
    guest_count: string;
    venue_status: string;
  };
  checklistData?: {
    selections: Record<string, any>;
    notes: Record<string, string>;
    images?: Record<string, string[]>;
  };
  referenceImages?: string[];
  postedAt: string;
  status: string;
  bids: any[];
  additionalNotes?: string;
}

interface KeyRequirement {
  id: string;
  text: string;
  category: string;
}

export default function VendorEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [session, setSession] = useState<VendorSession | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [hasExistingBid, setHasExistingBid] = useState(false);
  const [acknowledgedRequirements, setAcknowledgedRequirements] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check authentication
    const sessionData = localStorage.getItem('vendor_session');
    if (!sessionData) {
      router.push('/craftsmen/login');
      return;
    }

    const parsedSession: VendorSession = JSON.parse(sessionData);
    setSession(parsedSession);

    // Load event
    loadEvent();

    // Check if vendor has already bid
    checkExistingBid(parsedSession.vendorId);
  }, [eventId, router]);

  const loadEvent = () => {
    setLoading(true);
    const postedEvents = JSON.parse(localStorage.getItem('posted_events') || '[]');
    const foundEvent = postedEvents.find((e: EventData) => e.eventId === eventId);

    if (!foundEvent) {
      setError('Event not found');
      setLoading(false);
      return;
    }

    // DEBUG: Log event data structure
    console.log('=== EVENT DATA DEBUG ===');
    console.log('Full event:', foundEvent);
    console.log('checklistData:', foundEvent.checklistData);
    console.log('checklistData.selections:', foundEvent.checklistData?.selections);
    console.log('checklistData.notes:', foundEvent.checklistData?.notes);
    console.log('Selections keys:', foundEvent.checklistData?.selections ? Object.keys(foundEvent.checklistData.selections) : 'none');
    console.log('Notes keys:', foundEvent.checklistData?.notes ? Object.keys(foundEvent.checklistData.notes) : 'none');
    console.log('Has selections?', !!(foundEvent.checklistData?.selections && Object.keys(foundEvent.checklistData.selections).length > 0));
    console.log('Has notes?', !!(foundEvent.checklistData?.notes && Object.keys(foundEvent.checklistData.notes).length > 0));
    console.log('======================');

    setEvent(foundEvent);
    setLoading(false);

    // Check if saved
    const savedEvents = JSON.parse(localStorage.getItem('vendor_saved_events') || '[]');
    setSaved(savedEvents.includes(eventId));
  };

  const checkExistingBid = (vendorId: string) => {
    const allBids = JSON.parse(localStorage.getItem('vendor_bids') || '[]');
    const existingBid = allBids.find((bid: any) =>
      bid.vendorId === vendorId && bid.eventId === eventId
    );
    setHasExistingBid(!!existingBid);
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

  const handleSaveForLater = () => {
    const savedEvents = JSON.parse(localStorage.getItem('vendor_saved_events') || '[]');
    if (saved) {
      const updated = savedEvents.filter((id: string) => id !== eventId);
      localStorage.setItem('vendor_saved_events', JSON.stringify(updated));
      setSaved(false);
    } else {
      savedEvents.push(eventId);
      localStorage.setItem('vendor_saved_events', JSON.stringify(savedEvents));
      setSaved(true);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleCopyEventId = () => {
    navigator.clipboard.writeText(eventId);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const toggleAcknowledgment = (requirementId: string) => {
    const newAcknowledged = new Set(acknowledgedRequirements);
    if (newAcknowledged.has(requirementId)) {
      newAcknowledged.delete(requirementId);
    } else {
      newAcknowledged.add(requirementId);
    }
    setAcknowledgedRequirements(newAcknowledged);
  };

  const getTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const posted = new Date(timestamp).getTime();
    const diffMs = now - posted;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getTimeUntilEvent = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Event passed';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day';
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  const getEventTypeIcon = (eventType: string) => {
    const type = eventType.toLowerCase();
    if (type.includes('wedding')) return HeartIcon;
    if (type.includes('corporate') || type.includes('conference')) return BriefcaseIcon;
    if (type.includes('birthday') || type.includes('party')) return CakeIcon;
    if (type.includes('launch')) return RocketLaunchIcon;
    return SparklesIcon;
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categoryId.toLowerCase();
    if (category.includes('venue')) return BuildingOffice2Icon;
    if (category.includes('design') || category.includes('decor')) return SparklesIcon;
    if (category.includes('food') || category.includes('catering')) return CakeIcon;
    if (category.includes('photo')) return PhotoIcon;
    return DocumentTextIcon;
  };

  const getPriorityClass = (text: string): string => {
    if (!text) return 'priority-normal';

    const highPriority = ['must', 'required', 'essential', 'critical', 'need', 'mandatory', 'important'];
    const mediumPriority = ['prefer', 'would like', 'should', 'want'];

    const lowerText = text.toLowerCase();

    if (highPriority.some(word => lowerText.includes(word))) {
      return 'priority-high';
    }
    if (mediumPriority.some(word => lowerText.includes(word))) {
      return 'priority-medium';
    }
    return 'priority-normal';
  };

  const getPriorityIcon = (text: string) => {
    const priorityClass = getPriorityClass(text);
    if (priorityClass === 'priority-high') return <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />;
    if (priorityClass === 'priority-medium') return <LightBulbIcon className="w-5 h-5 text-yellow-400" />;
    return <DocumentTextIcon className="w-5 h-5 text-slate-400" />;
  };

  const highlightKeywords = (text: string) => {
    if (!text) return null;

    const keywords = [
      { words: ['must', 'required', 'essential', 'critical', 'mandatory'], className: 'keyword-critical' },
      { words: ['prefer', 'would like', 'should', 'want'], className: 'keyword-important' },
      { words: ['flexible', 'optional', 'bonus'], className: 'keyword-flexible' }
    ];

    // Sanitize text to prevent XSS - only allow safe characters
    const sanitizedText = text.replace(/[<>]/g, '').trim();

    // Split text into words and highlight keywords safely
    const words = sanitizedText.split(/\s+/);
    const highlightedWords = words.map((word, index) => {
      const cleanWord = word.replace(/[^\w\s-]/g, ''); // Remove special chars except hyphens
      const keyword = keywords.find(k =>
        k.words.some(w => cleanWord.toLowerCase() === w.toLowerCase())
      );

      if (keyword) {
        return (
          <span key={index} className={keyword.className}>
            {cleanWord}
          </span>
        );
      }

      return <span key={index}>{cleanWord}</span>;
    });

    // Add spaces between words
    const result = [];
    for (let i = 0; i < highlightedWords.length; i++) {
      result.push(highlightedWords[i]);
      if (i < highlightedWords.length - 1) {
        result.push(' ');
      }
    }

    return <div className="leading-relaxed">{result}</div>;
  };

  const getKeyRequirements = (): KeyRequirement[] => {
    if (!event) return [];

    const requirements: KeyRequirement[] = [];

    // Extract from checklist notes
    if (event.checklistData?.notes) {
      Object.entries(event.checklistData.notes).forEach(([category, notes]) => {
        if (notes) {
          const sentences = notes.split(/[.!]+/).filter(s => s.trim().length > 10);
          sentences.forEach((sentence, idx) => {
            if (getPriorityClass(sentence) === 'priority-high') {
              requirements.push({
                id: `${category}-${idx}`,
                text: sentence.trim(),
                category
              });
            }
          });
        }
      });
    }

    // Extract from additional notes
    if (event.additionalNotes) {
      const sentences = event.additionalNotes.split(/[.!]+/).filter(s => s.trim().length > 10);
      sentences.forEach((sentence, idx) => {
        if (getPriorityClass(sentence) === 'priority-high') {
          requirements.push({
            id: `overall-${idx}`,
            text: sentence.trim(),
            category: 'Overall'
          });
        }
      });
    }

    return requirements;
  };

  const keyRequirements = getKeyRequirements();
  const allRequirementsAcknowledged = keyRequirements.length === 0 || keyRequirements.every(req => acknowledgedRequirements.has(req.id));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Event Not Found</h2>
          <p className="text-slate-400 mb-8">
            This event may have been removed or the link is incorrect.
          </p>
          <button
            onClick={() => router.push('/craftsmen/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const EventTypeIcon = getEventTypeIcon(event.eventMemory.event_type);
  const isClosed = event.status !== 'open';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/craftsmen/dashboard')}
              className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="font-medium">Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleCopyEventId}
                className="flex items-center space-x-2 px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <DocumentDuplicateIcon className="h-4 w-4 text-slate-400" />
                <code className="text-xs font-mono text-slate-300">{eventId.slice(0, 12)}...</code>
              </button>

              <div className={`px-3 py-1.5 rounded-lg border ${
                isClosed
                  ? 'bg-slate-700/50 border-slate-600/50 text-slate-400'
                  : 'bg-green-500/20 border-green-500/30 text-green-400'
              }`}>
                <span className="text-xs font-semibold">
                  {isClosed ? 'Bidding Closed' : 'Open for Bids'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Event Overview Card */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <EventTypeIcon className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 capitalize">
                  {event.eventMemory.event_type} Event
                </h1>
                <p className="text-lg text-slate-300 mb-2">{event.eventMemory.location}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center space-x-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>Posted {getTimeAgo(event.postedAt)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <InboxIcon className="h-4 w-4" />
                    <span>{event.bids?.length || 0} proposal{event.bids?.length !== 1 ? 's' : ''}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Facts Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center space-x-2 mb-1">
                  <CalendarIcon className="h-5 w-5 text-orange-400" />
                  <p className="text-xs text-slate-400">Event Date</p>
                </div>
                <p className="text-base font-semibold text-white">
                  {new Date(event.eventMemory.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-xs text-slate-400 mt-1">{getTimeUntilEvent(event.eventMemory.date)} away</p>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center space-x-2 mb-1">
                  <UsersIcon className="h-5 w-5 text-orange-400" />
                  <p className="text-xs text-slate-400">Guests</p>
                </div>
                <p className="text-base font-semibold text-white">{event.eventMemory.guest_count} people</p>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center space-x-2 mb-1">
                  <MapPinIcon className="h-5 w-5 text-orange-400" />
                  <p className="text-xs text-slate-400">Location</p>
                </div>
                <p className="text-base font-semibold text-white">{event.eventMemory.location}</p>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center space-x-2 mb-1">
                  <BuildingOffice2Icon className="h-5 w-5 text-orange-400" />
                  <p className="text-xs text-slate-400">Venue Status</p>
                </div>
                <p className="text-base font-semibold text-white capitalize">{event.eventMemory.venue_status}</p>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center space-x-2 mb-1">
                  <InboxIcon className="h-5 w-5 text-orange-400" />
                  <p className="text-xs text-slate-400">Competition</p>
                </div>
                <p className="text-base font-semibold text-white">{event.bids?.length || 0} bids</p>
              </div>
            </div>
          </div>
        </div>

        {/* Competition Info */}
        {event.bids && event.bids.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <InboxIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-300 font-medium mb-1">
                  {event.bids.length} proposal{event.bids.length !== 1 ? 's' : ''} already submitted
                </p>
                <p className="text-sm text-blue-200/80">
                  Be competitive with your pricing and showcase your unique value proposition.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Complete Requirements Breakdown */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">📋 Complete Client Requirements</h2>
          </div>
          <p className="text-slate-400 mb-6 ml-15">
            Review all requirements carefully before submitting your proposal
          </p>

          {event.checklistData && (
            Object.keys(event.checklistData.selections || {}).length > 0 ||
            Object.keys(event.checklistData.notes || {}).length > 0
          ) ? (
            <div className="space-y-4">
              {Object.entries(event.checklistData.selections || {}).map(([categoryId, categorySelections]) => {
                const notes = event.checklistData?.notes?.[categoryId] || '';
                const isExpanded = expandedCategories.has(categoryId);
                const CategoryIcon = getCategoryIcon(categoryId);
                const priorityClass = getPriorityClass(notes);

                return (
                  <div
                    key={categoryId}
                    className={`bg-slate-700/20 rounded-xl border overflow-hidden transition-all ${
                      priorityClass === 'priority-high'
                        ? 'border-red-500/30'
                        : priorityClass === 'priority-medium'
                        ? 'border-yellow-500/30'
                        : 'border-slate-600/50'
                    }`}
                  >
                    <button
                      onClick={() => toggleCategory(categoryId)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center">
                          <CategoryIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-white capitalize">
                            {categoryId.replace(/_/g, ' ')}
                          </h3>
                          {categorySelections && Object.keys(categorySelections).length > 0 && (
                            <p className="text-xs text-slate-400">
                              {Object.keys(categorySelections).length} item{Object.keys(categorySelections).length !== 1 ? 's' : ''} selected
                            </p>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUpIcon className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-slate-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-600/50 p-4 bg-slate-800/30 space-y-4">
                        {categorySelections && Object.keys(categorySelections).length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-slate-300 mb-2">Client Selected:</h4>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(categorySelections).map(([key, value]) => (
                                <span
                                  key={key}
                                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full text-sm text-orange-300"
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                  <span>{String(value)}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {notes && (
                          <div className={`rounded-lg p-4 border-l-4 ${
                            priorityClass === 'priority-high'
                              ? 'bg-red-500/10 border-red-500'
                              : priorityClass === 'priority-medium'
                              ? 'bg-yellow-500/10 border-yellow-500'
                              : 'bg-slate-700/30 border-slate-600'
                          }`}>
                            <div className="flex items-start space-x-3 mb-3">
                              {getPriorityIcon(notes)}
                              <h4 className="text-sm font-semibold text-white">Special Requirements</h4>
                            </div>
                            <div className="text-sm text-slate-200 mb-3">
                              {highlightKeywords(notes)}
                            </div>
                            {priorityClass === 'priority-high' && (
                              <div className="pt-3 border-t border-slate-600/50">
                                <p className="text-xs font-semibold text-red-400">
                                  ⚠️ MUST ADDRESS THIS IN YOUR BID
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {(!categorySelections || Object.keys(categorySelections).length === 0) && !notes && (
                          <p className="text-sm text-slate-400 italic">No specific requirements provided</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-700/20 border border-slate-600/50 rounded-xl p-8 text-center">
              <DocumentTextIcon className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-white font-semibold mb-2">Limited Requirements Provided</h4>
              <p className="text-slate-400 text-sm mb-4">
                The client hasn't specified detailed requirements yet. You can still submit a proposal based on the basic event information.
              </p>
              <p className="text-blue-300 text-sm">
                💡 <strong>Tip:</strong> Consider asking clarifying questions before bidding.
              </p>
            </div>
          )}

          {/* Overall Event Notes */}
          {event.additionalNotes && (
            <div className="mt-6 bg-orange-500/10 border-l-4 border-orange-500 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-3">
                <DocumentTextIcon className="w-6 h-6 text-orange-400" />
                <h3 className="text-lg font-bold text-white">📝 Overall Notes from Client</h3>
              </div>
              <div className="text-slate-200">
                {highlightKeywords(event.additionalNotes)}
              </div>
              <div className="mt-4 pt-4 border-t border-orange-500/30">
                <p className="text-sm text-orange-300">
                  <strong>💡 KEY INSIGHT:</strong> Pay special attention to these overall requirements when structuring your proposal.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Reference Images */}
        {event.referenceImages && event.referenceImages.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center">
                <PhotoIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Reference Images</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {event.referenceImages.map((imageUrl, idx) => (
                <div key={idx} className="aspect-square bg-slate-700/50 rounded-lg overflow-hidden border border-slate-600/50 hover:border-orange-500/50 transition-all cursor-pointer">
                  <img
                    src={imageUrl}
                    alt={`Reference ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requirements Acknowledgment */}
        {keyRequirements.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircleIcon className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-bold text-white">✅ Acknowledge Key Requirements</h3>
            </div>
            <p className="text-slate-400 mb-6">
              Before submitting your proposal, confirm you can fulfill these critical requirements:
            </p>

            <div className="space-y-3">
              {keyRequirements.map((requirement) => (
                <label
                  key={requirement.id}
                  className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    acknowledgedRequirements.has(requirement.id)
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-slate-700/20 border-slate-600/50 hover:border-slate-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={acknowledgedRequirements.has(requirement.id)}
                    onChange={() => toggleAcknowledgment(requirement.id)}
                    className="mt-1 w-5 h-5 rounded border-slate-600 text-orange-500 focus:ring-orange-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-white leading-relaxed">{requirement.text}</p>
                    <p className="text-xs text-slate-400 mt-1">Category: {requirement.category}</p>
                  </div>
                </label>
              ))}
            </div>

            {!allRequirementsAcknowledged && (
              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-300 text-sm">
                  ⚠️ You must acknowledge all key requirements to proceed with your proposal
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSaveForLater}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 border rounded-lg font-semibold transition-all duration-200 ${
                saved
                  ? 'bg-orange-500/20 border-orange-500/30 text-orange-300'
                  : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <BookmarkIcon className="h-5 w-5" />
              <span>{saved ? 'Saved' : 'Save for Later'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-300 rounded-lg font-semibold transition-all duration-200"
            >
              <ShareIcon className="h-5 w-5" />
              <span>{copySuccess ? 'Copied!' : 'Share Event'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900/98 to-slate-800/98 backdrop-blur-lg border-t border-slate-700/50 shadow-2xl z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <span className="flex items-center space-x-1">
                <ClockIcon className="w-4 h-4 text-orange-400" />
                <span>Proposal takes ~10-15 minutes</span>
              </span>
              <span className="flex items-center space-x-1">
                <CheckCircleIcon className="w-4 h-4 text-green-400" />
                <span>Auto-saves every 30 seconds</span>
              </span>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => router.push('/craftsmen/dashboard')}
                className="flex-1 sm:flex-initial px-6 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-white rounded-lg font-semibold transition-all"
              >
                ← Back
              </button>

              {!isClosed && (
                <button
                  onClick={() => router.push(`/craftsmen/events/${eventId}/bid`)}
                  disabled={!allRequirementsAcknowledged && keyRequirements.length > 0}
                  className={`flex-1 sm:flex-initial px-8 py-3 rounded-lg font-bold text-white transition-all duration-300 transform shadow-xl ${
                    !allRequirementsAcknowledged && keyRequirements.length > 0
                      ? 'bg-slate-600 cursor-not-allowed opacity-50'
                      : hasExistingBid
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30 hover:scale-105'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/30 hover:scale-105'
                  }`}
                >
                  {hasExistingBid ? '✏️ Edit Proposal' : 'Start Proposal →'}
                </button>
              )}

              {isClosed && (
                <div className="flex-1 sm:flex-initial px-8 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-400 font-semibold text-center">
                  Bidding Closed
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Copy Success Toast */}
      {copySuccess && (
        <div className="fixed bottom-24 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in z-50">
          ✓ Copied to clipboard
        </div>
      )}

      <style jsx global>{`
        .keyword-critical {
          background: rgba(239, 68, 68, 0.2);
          color: #EF4444;
          font-weight: 600;
          padding: 0 4px;
          border-radius: 2px;
        }
        .keyword-important {
          background: rgba(245, 158, 11, 0.2);
          color: #F59E0B;
          font-weight: 500;
          padding: 0 4px;
          border-radius: 2px;
        }
        .keyword-flexible {
          background: rgba(59, 130, 246, 0.2);
          color: #3B82F6;
          font-weight: 500;
          padding: 0 4px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
