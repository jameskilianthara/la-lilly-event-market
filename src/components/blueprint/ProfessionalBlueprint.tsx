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
  XMarkIcon,
  CheckIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import type { ForgeBlueprint, ClientBrief, ClientNotes, ReferenceImage } from '../../types/blueprint';
import { generateBlueprintPDF } from '../../lib/pdfGenerator';
import {
  copyBlueprintShareUrl,
  shareBlueprint,
  shareBlueprintViaWhatsApp,
  shareBlueprintViaEmail,
  getSocialShareUrls
} from '../../lib/blueprintSharing';

interface ProfessionalBlueprintProps {
  blueprint: ForgeBlueprint;
  clientBrief: ClientBrief;
  clientNotes: ClientNotes;
  referenceImages: ReferenceImage[];
  onNotesChange: (itemId: string, notes: string) => void;
  onLaunchProject: () => void;
  isSaving: boolean;
}

interface TimelineMilestone {
  id: string;
  date: string;
  title: string;
  description: string;
  category: 'planning' | 'booking' | 'execution' | 'event';
}

export const ProfessionalBlueprint: React.FC<ProfessionalBlueprintProps> = ({
  blueprint,
  clientBrief,
  clientNotes,
  referenceImages,
  onNotesChange,
  onLaunchProject,
  isSaving
}) => {
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [editingSpec, setEditingSpec] = useState<string | null>(null);
  const [successCriteria, setSuccessCriteria] = useState({
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
  });

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCopySuccess, setShareCopySuccess] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Auto-generate executive summary on mount
  useEffect(() => {
    if (!executiveSummary) {
      const summary = generateExecutiveSummary();
      setExecutiveSummary(summary);
    }
  }, []);

  const generateExecutiveSummary = (): string => {
    const eventType = clientBrief.event_type || 'event';
    const date = formatDate(clientBrief.date || '');
    const location = clientBrief.city || 'the specified location';
    const guests = clientBrief.guest_count || 'TBD';

    return `This document outlines the complete specifications for a ${eventType} event scheduled for ${date} in ${location}. The event will host approximately ${guests} guests and requires professional coordination across multiple service categories. This blueprint serves as the authoritative specification for vendor proposals and project execution.`;
  };

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

  const generateTimeline = (): TimelineMilestone[] => {
    const eventDate = new Date(clientBrief.date || Date.now());
    const milestones: TimelineMilestone[] = [];

    // 8 weeks before
    const week8 = new Date(eventDate);
    week8.setDate(eventDate.getDate() - 56);
    milestones.push({
      id: 'week8',
      date: week8.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      title: 'Project Launch & Vendor Selection',
      description: 'Review vendor proposals and finalize service providers',
      category: 'planning'
    });

    // 6 weeks before
    const week6 = new Date(eventDate);
    week6.setDate(eventDate.getDate() - 42);
    milestones.push({
      id: 'week6',
      date: week6.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      title: 'Contract Finalization',
      description: 'Sign contracts and confirm booking deposits',
      category: 'booking'
    });

    // 4 weeks before
    const week4 = new Date(eventDate);
    week4.setDate(eventDate.getDate() - 28);
    milestones.push({
      id: 'week4',
      date: week4.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      title: 'Detailed Planning Phase',
      description: 'Finalize event flow, layout, and vendor coordination',
      category: 'planning'
    });

    // 2 weeks before
    const week2 = new Date(eventDate);
    week2.setDate(eventDate.getDate() - 14);
    milestones.push({
      id: 'week2',
      date: week2.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      title: 'Final Confirmations',
      description: 'Confirm all vendor schedules and delivery timelines',
      category: 'execution'
    });

    // 1 week before
    const week1 = new Date(eventDate);
    week1.setDate(eventDate.getDate() - 7);
    milestones.push({
      id: 'week1',
      date: week1.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      title: 'Pre-Event Week',
      description: 'Final walkthrough and last-minute adjustments',
      category: 'execution'
    });

    // Event day
    milestones.push({
      id: 'event',
      date: eventDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      title: 'Event Day',
      description: `${clientBrief.event_type || 'Event'} execution and coordination`,
      category: 'event'
    });

    return milestones;
  };

  const getMilestoneCategoryColor = (category: TimelineMilestone['category']) => {
    switch (category) {
      case 'planning': return 'bg-blue-500';
      case 'booking': return 'bg-purple-500';
      case 'execution': return 'bg-orange-500';
      case 'event': return 'bg-green-500';
      default: return 'bg-slate-500';
    }
  };

  const timeline = generateTimeline();
  const blueprintId = `EF-${Date.now().toString(36).toUpperCase()}`;
  const generatedDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Handler functions
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateBlueprintPDF({
        blueprint,
        clientBrief,
        clientNotes,
        referenceImages,
        blueprintId,
        generatedDate,
        executiveSummary: executiveSummary || 'No executive summary provided.',
        specialInstructions: specialInstructions || ''
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleShareBlueprint = () => {
    setShowShareModal(true);
  };

  const handleCopyShareLink = async () => {
    const success = await copyBlueprintShareUrl(blueprintId);
    if (success) {
      setShareCopySuccess(true);
      setTimeout(() => setShareCopySuccess(false), 2000);
    }
  };

  const socialUrls = getSocialShareUrls(blueprintId, clientBrief);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      {/* Premium Professional Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          {/* Event Badge & Title */}
          <div className="text-center mb-8 lg:mb-12">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-4 rounded-full bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-400/30 backdrop-blur-sm">
              <SparklesIcon className="h-5 w-5 text-orange-300 mr-2" />
              <span className="text-orange-200 font-semibold text-sm uppercase tracking-wide">
                {clientBrief.event_type || 'Event'} Blueprint
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight">
              Professional Event Blueprint
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Comprehensive planning document generated by EventFoundry
            </p>
          </div>

          {/* Event Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            {/* Date Card */}
            <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 hover:scale-105">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-orange-500/50 transition-shadow duration-300">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Event Date</div>
                  <div className="text-white font-bold text-lg mt-0.5 truncate">
                    {clientBrief.date ? new Date(clientBrief.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select Date'}
                  </div>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            {/* Guests Card */}
            <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:scale-105">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/50 transition-shadow duration-300">
                  <UserGroupIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Guest Count</div>
                  <div className="text-white font-bold text-lg mt-0.5">
                    {clientBrief.guest_count || 'TBD'}
                  </div>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            {/* Location Card */}
            <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:scale-105">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-shadow duration-300">
                  <MapPinIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Location</div>
                  <div className="text-white font-bold text-lg mt-0.5 truncate">
                    {clientBrief.city || 'TBD'}
                  </div>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            {/* Venue Card */}
            <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 hover:scale-105">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-green-500/50 transition-shadow duration-300">
                  <BuildingOfficeIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Venue</div>
                  <div className="text-white font-bold text-lg mt-0.5">
                    {clientBrief.venue_status === 'booked' ? '✓ Confirmed' : 'Required'}
                  </div>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>

          {/* Status & Launch Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Status Card */}
              <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20">
                <div className="relative">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50"></div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Status</div>
                  <div className="text-white font-bold text-lg">Draft Blueprint</div>
                </div>
              </div>

              {/* Launch CTA */}
              <button
                onClick={onLaunchProject}
                className="w-full lg:w-auto group relative overflow-hidden bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white font-bold px-8 py-4 rounded-xl flex items-center justify-center space-x-3 shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 min-h-[44px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <RocketLaunchIcon className="h-6 w-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-lg relative z-10">Launch Project & Find Vendors</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
        {/* Executive Summary - Premium Card */}
        <section className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
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
              <div className="hidden sm:flex items-center space-x-2 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-full px-4 py-2">
                <CheckCircleIcon className="h-5 w-5 text-green-300" />
                <span className="text-green-100 text-sm font-semibold">Complete</span>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border-2 border-slate-200 rounded-xl p-5 hover:border-blue-300 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100 transition-all duration-300 min-h-[120px]">
              <textarea
                value={executiveSummary}
                onChange={(e) => setExecutiveSummary(e.target.value)}
                rows={4}
                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-700 text-base leading-relaxed resize-none"
                placeholder={executiveSummary || "Click to add executive summary..."}
              />
            </div>
            <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
              <button 
                onClick={() => document.querySelector('textarea')?.focus()}
                className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50 min-h-[44px]"
              >
                <PencilSquareIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Edit Summary</span>
              </button>
              {isSaving && (
                <div className="flex items-center space-x-2 text-orange-600">
                  <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                  <p className="text-sm font-medium">Saving...</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Sophisticated Timeline */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
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
              <div className="hidden sm:flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">{timeline.length} Milestones</span>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <div className="relative">
              {/* Progress line */}
              <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-purple-200 to-green-200 rounded-full hidden lg:block"></div>

              <div className="space-y-6">
                {timeline.map((milestone, index) => {
                  const isLast = index === timeline.length - 1;
                  const categoryColors = {
                    planning: { from: 'from-blue-500', to: 'to-blue-600', shadow: 'shadow-blue-500/50', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                    booking: { from: 'from-purple-500', to: 'to-purple-600', shadow: 'shadow-purple-500/50', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
                    execution: { from: 'from-orange-500', to: 'to-orange-600', shadow: 'shadow-orange-500/50', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
                    event: { from: 'from-green-500', to: 'to-green-600', shadow: 'shadow-green-500/50', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' }
                  };
                  const colors = categoryColors[milestone.category];

                  return (
                    <div key={milestone.id} className="relative flex items-start space-x-4 lg:space-x-6 group">
                      {/* Milestone marker */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br ${colors.from} ${colors.to} rounded-2xl flex items-center justify-center shadow-lg ${colors.shadow} group-hover:scale-110 transition-transform duration-300 z-10 relative`}>
                          <span className="text-white font-bold text-lg">{index + 1}</span>
                        </div>
                        {/* Connection line for mobile */}
                        {!isLast && (
                          <div className="absolute top-12 left-1/2 w-0.5 h-12 bg-gradient-to-b from-slate-300 to-slate-200 -translate-x-1/2 lg:hidden"></div>
                        )}
                      </div>

                      {/* Milestone content card */}
                      <div className={`flex-1 bg-gradient-to-br from-white to-slate-50 rounded-2xl border-2 ${colors.border} p-5 lg:p-6 group-hover:shadow-xl group-hover:scale-[1.02] transition-all duration-300 min-h-[44px]`}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`inline-block px-3 py-1 ${colors.bg} ${colors.text} text-xs font-bold uppercase tracking-wide rounded-full`}>
                                {milestone.category}
                              </span>
                              {isLast && (
                                <span className="inline-block px-3 py-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold uppercase tracking-wide rounded-full animate-pulse">
                                  Event Day
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-900 text-lg lg:text-xl mb-1">{milestone.title}</h4>
                            <p className="text-slate-600 text-sm lg:text-base">{milestone.description}</p>
                          </div>

                          {/* Date badge */}
                          <div className="flex-shrink-0">
                            <div className={`bg-gradient-to-br ${colors.from} ${colors.to} text-white px-4 py-2 rounded-xl shadow-lg ${colors.shadow}`}>
                              <div className="text-xs font-medium opacity-90 uppercase tracking-wide">Date</div>
                              <div className="text-sm lg:text-base font-bold">{milestone.date}</div>
                            </div>
                          </div>
                        </div>

                        {/* Days calculation */}
                        {!isLast && (
                          <div className="flex items-center space-x-2 text-xs text-slate-500 mt-3">
                            <ClockIcon className="h-4 w-4" />
                            <span className="font-medium">
                              {(() => {
                                try {
                                  const eventDate = new Date(clientBrief.date || Date.now());
                                  const milestoneDates: Record<string, number> = {
                                    'week8': 56,
                                    'week6': 42,
                                    'week4': 28,
                                    'week2': 14,
                                    'week1': 7
                                  };
                                  const daysBefore = milestoneDates[milestone.id] || 0;
                                  return `${daysBefore} days before event`;
                                } catch {
                                  return 'Scheduled milestone';
                                }
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Requirements */}
        <section className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-700 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Detailed Requirements</h2>
                  <p className="text-purple-100 text-sm">Specifications for master craftsmen</p>
                </div>
              </div>
              <div className="hidden sm:block bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="text-white text-sm font-medium">{blueprint.sections.length} Categories</span>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8 space-y-6">
            {blueprint.sections.map((section, sectionIndex) => {
              const filledItems = section.items.filter(item => clientNotes[item.id]?.trim()).length;
              const totalItems = section.items.length;
              const completionPercent = totalItems > 0 ? Math.round((filledItems / totalItems) * 100) : 0;

              return (
                <div key={section.id} className="group bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 rounded-2xl overflow-hidden hover:border-purple-300 hover:shadow-xl transition-all duration-300">
                  <div className="bg-gradient-to-r from-slate-50 to-purple-50/30 px-5 py-4 border-b-2 border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-3">
                        <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white text-sm font-bold flex items-center justify-center shadow-lg">
                          {sectionIndex + 1}
                        </span>
                        <span>{section.title}</span>
                      </h3>
                      {/* Completion indicator */}
                      <div className="flex items-center space-x-2">
                        <div className="text-xs font-medium text-slate-600">
                          {filledItems}/{totalItems} complete
                        </div>
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                            style={{ width: `${completionPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 ml-11">{section.description}</p>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {section.items.map((item) => {
                      const isFilled = clientNotes[item.id]?.trim();
                      return (
                        <div key={item.id} className="p-5 hover:bg-purple-50/30 transition-all duration-200">
                          <label className="block text-sm font-semibold text-slate-800 mb-3 flex items-center justify-between">
                            <span className="flex items-center space-x-2">
                              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isFilled ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                                {isFilled && <CheckCircleIcon className="h-4 w-4 text-white" />}
                              </span>
                              <span>{item.label}</span>
                            </span>
                            {item.required && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">Required</span>
                            )}
                          </label>
                          <textarea
                            value={clientNotes[item.id] || ''}
                            onChange={(e) => onNotesChange(item.id, e.target.value)}
                            placeholder={item.placeholder || 'Add your requirements and preferences...'}
                            rows={2}
                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all resize-none hover:border-purple-300 min-h-[44px]"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Special Instructions */}
        <section className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
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
            <div className="bg-gradient-to-br from-orange-50 to-pink-50/30 border-2 border-orange-200 rounded-xl p-5 hover:border-orange-300 focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-100 transition-all duration-300">
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special requirements, cultural considerations, accessibility needs, dietary restrictions, or unique preferences for vendors to consider..."
                rows={5}
                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-700 text-base leading-relaxed resize-none min-h-[44px]"
              />
            </div>
            <p className="text-sm text-slate-500 mt-3 flex items-center space-x-2">
              <PencilSquareIcon className="h-4 w-4" />
              <span>Add any special considerations for craftsmen</span>
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
              <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-2xl p-6 hover:border-green-300 hover:shadow-lg transition-all duration-300">
                <h4 className="font-bold text-slate-900 mb-4 flex items-center space-x-2 text-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">🎯</span>
                  </div>
                  <span>Primary Objectives</span>
                </h4>
                <ul className="space-y-3">
                  {successCriteria.primary.map((criterion, index) => (
                    <li key={index} className="flex items-start space-x-3 bg-white rounded-lg p-3 border border-green-200 hover:border-green-300 transition-colors duration-200">
                      <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 leading-relaxed">{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quality Standards */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
                <h4 className="font-bold text-slate-900 mb-4 flex items-center space-x-2 text-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">✨</span>
                  </div>
                  <span>Quality Standards</span>
                </h4>
                <ul className="space-y-3">
                  {successCriteria.quality.map((standard, index) => (
                    <li key={index} className="flex items-start space-x-3 bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-300 transition-colors duration-200">
                      <CheckCircleIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 leading-relaxed">{standard}</span>
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
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/10 to-pink-500/10 rounded-full blur-3xl"></div>

          <div className="relative p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
              <div className="flex items-center space-x-5">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/30 transform hover:scale-110 transition-transform duration-300">
                  <SparklesIcon className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-white mb-1">EventFoundry</h3>
                  <p className="text-slate-300 text-sm lg:text-base">Professional Event Blueprint System</p>
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
                This professional blueprint was forged by <span className="font-bold text-white bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">EventFoundry</span>, Kerala's premier event marketplace connecting visionary clients with master craftsmen. Your specification will reach verified, qualified artisans ready to bring your vision to life.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="group flex items-center justify-center space-x-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/20 hover:border-white/30 text-white px-6 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  <DocumentArrowDownIcon className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-semibold">
                    {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
                  </span>
                </button>

                <button
                  onClick={handleShareBlueprint}
                  className="group flex items-center justify-center space-x-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/20 hover:border-white/30 text-white px-6 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl min-h-[44px]"
                >
                  <ShareIcon className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-semibold">Share Blueprint</span>
                </button>

                <button
                  onClick={onLaunchProject}
                  className="group flex items-center justify-center space-x-3 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white px-6 py-4 rounded-xl transition-all duration-300 font-bold shadow-2xl hover:shadow-orange-500/50 hover:scale-105 min-h-[44px]"
                >
                  <RocketLaunchIcon className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Launch Project</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Premium Launch Section with Stats & Process */}
        <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 rounded-3xl shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative p-8 lg:p-12">
            {/* Rocket Animation */}
            <div className="text-center mb-8">
              <div className="inline-block relative">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 animate-bounce">
                  <RocketLaunchIcon className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">Ready to Launch Your Project?</h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                Your professional blueprint will be shared with our network of verified vendors who specialize in {clientBrief.event_type || 'events'} events in {clientBrief.city || 'your location'}.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 p-6 text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2">50+</div>
                <div className="text-white/90 font-medium">Qualified Vendors</div>
                <div className="text-xs text-white/70 mt-1">Across all categories</div>
              </div>
              <div className="bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 p-6 text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2">48h</div>
                <div className="text-white/90 font-medium">Response Time</div>
                <div className="text-xs text-white/70 mt-1">Average proposal delivery</div>
              </div>
              <div className="bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 p-6 text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2">95%</div>
                <div className="text-white/90 font-medium">Success Rate</div>
                <div className="text-xs text-white/70 mt-1">Client satisfaction</div>
              </div>
            </div>

            {/* Process Flow */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 p-6 lg:p-8 mb-8">
              <h3 className="text-xl font-bold text-white mb-6 text-center">What Happens Next?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1 */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <span className="text-3xl font-bold bg-gradient-to-br from-orange-500 to-pink-500 bg-clip-text text-transparent">1</span>
                  </div>
                  <h4 className="font-bold text-white mb-2">Blueprint Shared</h4>
                  <p className="text-sm text-white/80">Blueprint shared with qualified vendors</p>
                </div>

                {/* Step 2 */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <span className="text-3xl font-bold bg-gradient-to-br from-pink-500 to-purple-500 bg-clip-text text-transparent">2</span>
                  </div>
                  <h4 className="font-bold text-white mb-2">Vendors Submit Proposals</h4>
                  <p className="text-sm text-white/80">Vendors submit detailed proposals</p>
                </div>

                {/* Step 3 */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <span className="text-3xl font-bold bg-gradient-to-br from-purple-500 to-blue-500 bg-clip-text text-transparent">3</span>
                  </div>
                  <h4 className="font-bold text-white mb-2">Compare and Select</h4>
                  <p className="text-sm text-white/80">Compare and select your ideal vendor</p>
                </div>
              </div>
            </div>

            {/* Pre-launch Checklist */}
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-2xl">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center">
                <CheckBadgeIcon className="h-6 w-6 text-green-500 mr-2" />
                Pre-Launch Checklist
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700">Event specifications verified</span>
                </div>
                <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700">Timeline reviewed</span>
                </div>
                <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700">Requirements complete</span>
                </div>
                <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700">Special instructions added</span>
                </div>
              </div>
            </div>

            {/* Launch CTA */}
            <button
              onClick={onLaunchProject}
              className="w-full group relative overflow-hidden bg-white hover:bg-slate-50 text-slate-900 font-bold text-xl py-6 rounded-2xl flex items-center justify-center space-x-4 shadow-2xl hover:shadow-white/50 transition-all duration-300 transform hover:scale-[1.02] min-h-[44px]"
            >
              <RocketLaunchIcon className="h-8 w-8 text-orange-600 group-hover:rotate-12 transition-transform duration-300" />
              <span className="bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                Launch Project & Find Vendors
              </span>
            </button>

            <p className="text-center text-white/90 text-sm mt-4">
              🔒 Your blueprint will only be shared with verified, qualified craftsmen
            </p>
          </div>
        </section>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ShareIcon className="h-6 w-6 text-white" />
                    <h3 className="text-xl font-bold text-white">Share Blueprint</h3>
                  </div>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <p className="text-blue-100 text-sm mt-1">
                  Share this professional {clientBrief.event_type || 'event'} blueprint
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Copy Link */}
                <button
                  onClick={handleCopyShareLink}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <LinkIcon className="h-5 w-5 text-slate-600 group-hover:text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium text-slate-900">Copy Link</div>
                      <div className="text-sm text-slate-600">Share via any platform</div>
                    </div>
                  </div>
                  {shareCopySuccess ? (
                    <CheckIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <div className="text-xs text-slate-500">Click to copy</div>
                  )}
                </button>

                {/* Social Sharing Options */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-slate-700 mb-2">Share on social media</div>

                  {/* WhatsApp */}
                  <button
                    onClick={() => shareBlueprintViaWhatsApp(blueprintId, clientBrief)}
                    className="w-full flex items-center space-x-3 p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">W</span>
                    </div>
                    <span className="font-medium text-slate-900">WhatsApp</span>
                  </button>

                  {/* Email */}
                  <button
                    onClick={() => shareBlueprintViaEmail(blueprintId, clientBrief)}
                    className="w-full flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">@</span>
                    </div>
                    <span className="font-medium text-slate-900">Email</span>
                  </button>

                  {/* Twitter/X */}
                  <a
                    href={socialUrls.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center space-x-3 p-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">X</span>
                    </div>
                    <span className="font-medium text-slate-900">Twitter/X</span>
                  </a>

                  {/* Facebook */}
                  <a
                    href={socialUrls.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">f</span>
                    </div>
                    <span className="font-medium text-slate-900">Facebook</span>
                  </a>

                  {/* LinkedIn */}
                  <a
                    href={socialUrls.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">in</span>
                    </div>
                    <span className="font-medium text-slate-900">LinkedIn</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
