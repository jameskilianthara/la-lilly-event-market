'use client';

import React, { useState } from 'react';
import { ArrowLeftIcon, CogIcon, EyeIcon, RocketLaunchIcon, HomeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBlueprintReview } from '../../hooks/useBlueprintReview';
import { BlueprintDisplay } from './BlueprintDisplay';
import { ProfessionalBlueprint } from './ProfessionalBlueprint';
import { ClientBriefSummary } from './ClientBriefSummary';
import { ProjectPreview } from './ProjectPreview';

interface BlueprintReviewProps {
  blueprintId: string;
  clientBrief: {
    event_type: string;
    date: string;
    city: string;
    guest_count: string;
    venue_status: string;
  };
}

export const BlueprintReview: React.FC<BlueprintReviewProps> = ({
  blueprintId,
  clientBrief
}) => {
  const router = useRouter();
  const {
    blueprint,
    clientNotes,
    referenceImages,
    isLoading,
    isSaving,
    updateClientNotes,
    addReferenceImage,
    removeReferenceImage,
    finalizeProject
  } = useBlueprintReview(blueprintId, clientBrief);

  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState<'checklist' | 'professional'>('professional');
  const [isFinalizingProject, setIsFinalizingProject] = useState(false);

  const handleFinalizeProject = async () => {
    setIsFinalizingProject(true);
    try {
      const forgeProject = await finalizeProject();
      console.log('Project created successfully:', forgeProject);

      // Save project ID to localStorage for dashboard
      localStorage.setItem('latest_project_id', forgeProject.id);

      // Navigate to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
      setIsFinalizingProject(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <CogIcon className="h-12 w-12 text-slate-700 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Loading your blueprint...</p>
        </div>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">Blueprint not found</p>
          <Link
            href="/forge"
            className="text-orange-600 hover:text-orange-700 underline"
          >
            Return to Planning Chat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  try {
                    router.push('/');
                  } catch (error) {
                    console.error('Navigation error:', error);
                    // Fallback to hard navigation
                    window.location.href = '/';
                  }
                }}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <HomeIcon className="h-5 w-5" />
                <span>Home</span>
              </button>
              <button
                onClick={() => {
                  try {
                    router.push('/forge');
                  } catch (error) {
                    console.error('Navigation error:', error);
                    // Fallback to hard navigation
                    window.location.href = '/forge';
                  }
                }}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Back to Planning</span>
              </button>
              <div className="h-6 w-px bg-slate-300"></div>
              <div className="flex items-center space-x-3">
                <CogIcon className="h-8 w-8 text-slate-700" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Blueprint Review</h1>
                  <p className="text-sm text-slate-600">{blueprint.displayName}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('professional')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                    viewMode === 'professional'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📄 Professional
                </button>
                <button
                  onClick={() => setViewMode('checklist')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                    viewMode === 'checklist'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📋 Checklist
                </button>
              </div>

              <button
                onClick={handleFinalizeProject}
                disabled={isFinalizingProject}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed shadow-lg"
              >
                {isFinalizingProject ? (
                  <>
                    <CogIcon className="h-4 w-4 animate-spin" />
                    <span>Creating Project...</span>
                  </>
                ) : (
                  <>
                    <RocketLaunchIcon className="h-4 w-4" />
                    <span>Launch Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'professional' ? (
        /* Professional Blueprint View - Full Width */
        <ProfessionalBlueprint
          blueprint={blueprint}
          clientBrief={clientBrief}
          clientNotes={clientNotes}
          referenceImages={referenceImages}
          onNotesChange={updateClientNotes}
          onLaunchProject={handleFinalizeProject}
          isSaving={isSaving}
        />
      ) : (
        /* Checklist View - With Sidebar */
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content - Blueprint */}
            <div className="lg:col-span-3">
              <BlueprintDisplay
                blueprint={blueprint}
                clientBrief={clientBrief}
                clientNotes={clientNotes}
                referenceImages={referenceImages}
                onNotesChange={updateClientNotes}
                onImageAdd={addReferenceImage}
                onImageRemove={removeReferenceImage}
                isSaving={isSaving}
              />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Client Brief Summary */}
              <ClientBriefSummary
                clientBrief={clientBrief}
                blueprint={blueprint}
              />

              {/* Project Preview */}
              {showPreview && (
                <ProjectPreview
                  blueprint={blueprint}
                  clientBrief={clientBrief}
                  clientNotes={clientNotes}
                  referenceImages={referenceImages}
                />
              )}

              {/* Planning Tips */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="text-center">
                  <div className="text-2xl mb-3">⚒️</div>
                  <h4 className="font-medium text-slate-900 text-sm mb-2">Planning Tips</h4>
                  <div className="text-xs text-slate-600 leading-relaxed space-y-2">
                    <p>• Add detailed notes to help professionals understand your vision</p>
                    <p>• Upload reference images to show your style preferences</p>
                    <p>• Your blueprint becomes the project specification for bidding</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};