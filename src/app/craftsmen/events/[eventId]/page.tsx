'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import ExecutionPlan from '@/components/execution-plan/ExecutionPlan';
import {
  ArrowLeftIcon,
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  XCircleIcon,
  HeartIcon,
  BriefcaseIcon,
  CakeIcon,
  RocketLaunchIcon,
  ListBulletIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

interface BlueprintItem {
  id: string;
  label: string;
  description?: string;
  type?: string;
  options?: string[];
  clientNote?: string;
  clientSelection?: any;
}

interface BlueprintSection {
  id: string;
  title: string;
  description?: string;
  items: BlueprintItem[];
}

interface ForgeBlueprint {
  eventType?: string;
  displayName?: string;
  forgeComplexity?: string;
  sections: BlueprintSection[];
}

interface ClientBrief {
  event_type: string;
  date: string;
  city: string;
  guest_count: number;
  guest_count_range?: string;
  venue_status: string;
  budget_range?: string;
  venue_name?: string;
  venue_details?: {
    venue_name?: string;
    indoor_outdoor?: string;
    stage_dimensions?: string;
    function_areas?: string;
    setup_date?: string;
  };
  checklist?: {
    selections: Record<string, any>;
    categoryNotes: Record<string, string>;
  };
}

interface EventData {
  id: string;
  title: string;
  forge_status: string;
  client_brief: ClientBrief;
  forge_blueprint: ForgeBlueprint | null;
  created_at: string;
}

export default function VendorEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const { user, isAuthenticated, isLoading: authLoading, isVendor } = useAuth();

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [hasExistingBid, setHasExistingBid] = useState(false);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'execution'>('blueprint');
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !isVendor) {
      router.push(`/craftsmen/login?returnUrl=/craftsmen/events/${eventId}`);
      return;
    }
    loadEvent();
    checkExistingBid();
  }, [authLoading, isAuthenticated, isVendor, eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/forge/projects/${eventId}`);
      const data = await res.json();

      if (!data.success || !data.event) {
        setError('Event not found');
        setLoading(false);
        return;
      }

      const ev: EventData = data.event;
      setEvent(ev);

      // Auto-expand all blueprint sections
      if (ev.forge_blueprint?.sections) {
        setExpandedSections(new Set(ev.forge_blueprint.sections.map((s) => s.id)));
      }
    } catch (err) {
      console.error('Error loading event:', err);
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingBid = async () => {
    if (!user?.userId) return;
    try {
      // Get vendor id
      const vendorRes = await fetch(`/api/vendors/me?user_id=${user.userId}`);
      const vendorData = await vendorRes.json();
      if (!vendorData.vendor) return;

      setVendorId(vendorData.vendor.id);

      const bidsRes = await fetch(`/api/bids?event_id=${eventId}&vendor_id=${vendorData.vendor.id}`);
      const bidsData = await bidsRes.json();
      setHasExistingBid((bidsData.bids || []).length > 0);

      // Get access token for execution plan API calls
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) setAccessToken(session.access_token);
    } catch {
      // Non-critical
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(sectionId) ? next.delete(sectionId) : next.add(sectionId);
      return next;
    });
  };

  const getEventTypeIcon = (eventType: string) => {
    const t = eventType?.toLowerCase() || '';
    if (t.includes('wedding')) return HeartIcon;
    if (t.includes('corporate') || t.includes('conference')) return BriefcaseIcon;
    if (t.includes('birthday') || t.includes('party')) return CakeIcon;
    if (t.includes('launch')) return RocketLaunchIcon;
    return SparklesIcon;
  };

  const getComplexityColor = (complexity?: string) => {
    switch (complexity) {
      case 'master': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'craftsman': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'apprentice': return 'text-green-400 bg-green-400/10 border-green-400/30';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    }
  };

  const getTimeUntilEvent = (dateStr: string) => {
    if (!dateStr) return '';
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Event passed';
    if (diff === 0) return 'Today';
    if (diff < 30) return `${diff} days away`;
    if (diff < 365) return `${Math.floor(diff / 30)} months away`;
    return `${Math.floor(diff / 365)} years away`;
  };

  const isOpen = event?.forge_status === 'OPEN_FOR_BIDS' || event?.forge_status === 'CRAFTSMEN_BIDDING';

  // ── Loading ──────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading forge project...</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────
  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Event Not Found</h2>
          <p className="text-slate-400 mb-8">This event may have been removed or the link is incorrect.</p>
          <button
            onClick={() => router.push('/craftsmen/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const EventTypeIcon = getEventTypeIcon(event.client_brief?.event_type);
  const blueprint = event.forge_blueprint;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 pb-32">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50 shadow-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/craftsmen/dashboard')}
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>

          <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
            isOpen ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-slate-700/50 border-slate-600/50 text-slate-400'
          }`}>
            {isOpen ? 'Open for Bids' : 'Bidding Closed'}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Event Overview ── */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl p-6 sm:p-8">
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <EventTypeIcon className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{event.title}</h1>
              <p className="text-slate-400 text-sm">
                Posted {new Date(event.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Budget — primary pricing signal */}
          {event.client_brief?.budget_range && (
            <div className="mb-4 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/40 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/30 border border-orange-500/40 flex items-center justify-center flex-shrink-0">
                <span className="text-orange-300 font-bold text-lg">₹</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-orange-300/70 font-medium uppercase tracking-wide">Client Budget</p>
                <p className="text-xl font-bold text-orange-300">{event.client_brief.budget_range}</p>
              </div>
              <span className="text-xs text-orange-300/50 italic hidden sm:block">Primary pricing signal</span>
            </div>
          )}

          {/* Quick Facts */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
              <div className="flex items-center space-x-2 mb-1">
                <CalendarIcon className="h-5 w-5 text-orange-400" />
                <p className="text-xs text-slate-400">Event Date</p>
              </div>
              <p className="font-semibold text-white text-sm">
                {event.client_brief?.date
                  ? new Date(event.client_brief.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'}
              </p>
              <p className="text-xs text-slate-400 mt-1">{getTimeUntilEvent(event.client_brief?.date)}</p>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
              <div className="flex items-center space-x-2 mb-1">
                <MapPinIcon className="h-5 w-5 text-orange-400" />
                <p className="text-xs text-slate-400">City</p>
              </div>
              <p className="font-semibold text-white text-sm capitalize">{event.client_brief?.city || '—'}</p>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
              <div className="flex items-center space-x-2 mb-1">
                <UsersIcon className="h-5 w-5 text-orange-400" />
                <p className="text-xs text-slate-400">Guests</p>
              </div>
              <p className="font-semibold text-white text-sm">
                {event.client_brief?.guest_count_range || event.client_brief?.guest_count || '—'}
              </p>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
              <div className="flex items-center space-x-2 mb-1">
                <BuildingOffice2Icon className="h-5 w-5 text-orange-400" />
                <p className="text-xs text-slate-400">Venue</p>
              </div>
              <p className="font-semibold text-white text-sm capitalize">
                {event.client_brief?.venue_status?.replace(/_/g, ' ') || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex bg-slate-800/60 border border-slate-700/50 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'blueprint'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <ListBulletIcon className="w-4 h-4" />
            Forge Blueprint
          </button>
          {hasExistingBid ? (
            <button
              onClick={() => setActiveTab('execution')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'execution'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ClipboardDocumentListIcon className="w-4 h-4" />
              Execution Plan
            </button>
          ) : (
            <div
              title="Submit a proposal first to access the Execution Plan"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 cursor-not-allowed select-none"
            >
              <ClipboardDocumentListIcon className="w-4 h-4" />
              Execution Plan
              <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded-full">After Bid</span>
            </div>
          )}
        </div>

        {/* ── FORGE BLUEPRINT (Primary Section) ── */}
        {activeTab === 'blueprint' && (
        <>

        {/* ── Venue Card ── shown only when venue_details are present */}
        {event.client_brief?.venue_details && Object.values(event.client_brief.venue_details).some(Boolean) && (
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-blue-500/30 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-blue-500/20 bg-blue-500/10">
              <BuildingOffice2Icon className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <h2 className="text-base font-bold text-white">Venue Details</h2>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {event.client_brief.venue_details.venue_name && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-400 mb-0.5">Venue name</p>
                  <p className="font-semibold text-white">{event.client_brief.venue_details.venue_name}</p>
                </div>
              )}
              {event.client_brief.venue_details.indoor_outdoor && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Setting</p>
                  <p className="font-semibold text-white">{event.client_brief.venue_details.indoor_outdoor}</p>
                </div>
              )}
              {event.client_brief.venue_details.function_areas && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Function areas</p>
                  <p className="font-semibold text-white">{event.client_brief.venue_details.function_areas}</p>
                </div>
              )}
              {event.client_brief.venue_details.stage_dimensions && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Stage dimensions</p>
                  <p className="font-semibold text-white">{event.client_brief.venue_details.stage_dimensions}</p>
                </div>
              )}
              {event.client_brief.venue_details.setup_date && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Setup / load-in date</p>
                  <p className="font-semibold text-white">
                    {new Date(event.client_brief.venue_details.setup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-orange-500/30 shadow-2xl overflow-hidden">
          {/* Blueprint Header */}
          <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/10 border-b border-orange-500/30 px-6 sm:px-8 py-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ListBulletIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {blueprint?.displayName || 'Forge Blueprint'}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {blueprint?.sections?.length || 0} sections · Client requirements for this event
                  </p>
                </div>
              </div>

              {blueprint?.forgeComplexity && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${getComplexityColor(blueprint.forgeComplexity)}`}>
                  {blueprint.forgeComplexity} forge
                </span>
              )}
            </div>
          </div>

          {/* Blueprint Sections */}
          <div className="p-6 sm:p-8 space-y-4">
            {blueprint && blueprint.sections && blueprint.sections.length > 0 ? (
              blueprint.sections.map((section) => {
                const isExpanded = expandedSections.has(section.id);
                // Gather client selections & notes for this section
                const clientSelections = event.client_brief?.checklist?.selections || {};
                const clientNotes = event.client_brief?.checklist?.categoryNotes || {};
                const sectionNote = clientNotes[section.id] || '';

                return (
                  <div
                    key={section.id}
                    className="bg-slate-700/20 rounded-xl border border-slate-600/50 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500/80 to-orange-700/80 rounded-lg flex items-center justify-center flex-shrink-0">
                          <DocumentTextIcon className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white">{section.title}</h3>
                          {section.description && (
                            <p className="text-xs text-slate-400 truncate">{section.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                        <span className="text-xs text-slate-500">{section.items?.length || 0} items</span>
                        {isExpanded
                          ? <ChevronUpIcon className="h-5 w-5 text-slate-400" />
                          : <ChevronDownIcon className="h-5 w-5 text-slate-400" />
                        }
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-600/50 bg-slate-800/30 p-4 space-y-3">
                        {section.items?.map((item) => {
                          const selection = clientSelections[item.id];
                          const hasSelection = selection !== undefined && selection !== null && selection !== '';

                          return (
                            <div
                              key={item.id}
                              className={`rounded-lg p-3 border ${
                                hasSelection
                                  ? 'bg-orange-500/10 border-orange-500/30'
                                  : 'bg-slate-700/20 border-slate-600/30'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start space-x-2 flex-1 min-w-0">
                                  {hasSelection ? (
                                    <CheckCircleIcon className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <div className="h-4 w-4 rounded-full border border-slate-500 mt-0.5 flex-shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-sm text-slate-200 leading-snug">{item.label}</p>
                                    {item.description && item.description !== item.label && (
                                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                                    )}
                                  </div>
                                </div>

                                {hasSelection && (
                                  <div className="flex-shrink-0">
                                    {Array.isArray(selection) ? (
                                      <div className="flex flex-wrap gap-1 justify-end">
                                        {selection.map((val: string, i: number) => (
                                          <span key={i} className="px-2 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded-full border border-orange-500/30">
                                            {val}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded-full border border-orange-500/30">
                                        {String(selection)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Section-level client note */}
                        {sectionNote && (
                          <div className="mt-2 bg-blue-500/10 border-l-4 border-blue-500 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-400 mb-1">Client Note</p>
                            <p className="text-sm text-slate-200">{sectionNote}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10">
                <DocumentTextIcon className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No blueprint attached to this event.</p>
                <p className="text-slate-500 text-sm mt-1">Review the event details above before submitting your proposal.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Client Brief Summary (extra context) ── */}
        {event.client_brief?.checklist?.categoryNotes && Object.values(event.client_brief.checklist.categoryNotes).some(Boolean) && (
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Client Notes</h2>
            </div>
            <div className="space-y-3">
              {Object.entries(event.client_brief.checklist.categoryNotes)
                .filter(([, note]) => note)
                .map(([sectionId, note]) => (
                  <div key={sectionId} className="bg-blue-500/10 border-l-4 border-blue-500 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-400 mb-1 capitalize">{sectionId.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-slate-200">{note}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
        </> )} {/* end blueprint tab */}

        {/* ── EXECUTION PLAN TAB ── */}
        {activeTab === 'execution' && (
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-blue-500/20 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/10 border-b border-blue-500/20 px-6 sm:px-8 py-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Execution Plan</h2>
                  <p className="text-sm text-slate-400">
                    Break down each blueprint item into subtasks and assign them to your team or subcontractors
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8">
              {vendorId && accessToken ? (
                <ExecutionPlan
                  eventId={event.id}
                  vendorId={vendorId}
                  blueprint={blueprint}
                  accessToken={accessToken}
                />
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <ClipboardDocumentListIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Loading execution plan...</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── Sticky Action Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900/98 to-slate-800/98 backdrop-blur-lg border-t border-slate-700/50 shadow-2xl z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-slate-300">
              <span className="flex items-center space-x-1">
                <ClockIcon className="w-4 h-4 text-orange-400" />
                <span>Proposal takes ~10-15 minutes</span>
              </span>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => router.push('/craftsmen/dashboard')}
                className="flex-1 sm:flex-initial px-6 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-white rounded-lg font-semibold transition-all"
              >
                ← Back
              </button>

              {isOpen && (
                <button
                  onClick={() => router.push(`/craftsmen/events/${eventId}/bid`)}
                  className={`flex-1 sm:flex-initial px-8 py-3 rounded-lg font-bold text-white transition-all duration-300 shadow-xl hover:scale-105 ${
                    hasExistingBid
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/30'
                  }`}
                >
                  {hasExistingBid ? '✏️ Edit Proposal' : 'Start Proposal →'}
                </button>
              )}

              {!isOpen && (
                <div className="flex-1 sm:flex-initial px-8 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-400 font-semibold text-center">
                  Bidding Closed
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
