'use client';

import React from 'react';
import { CheckIcon, CogIcon } from '@heroicons/react/24/outline';

interface ForgeProgressProps {
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
}

export const ForgeProgress: React.FC<ForgeProgressProps> = ({
  currentStep,
  totalSteps,
  isComplete
}) => {
  const steps = [
    { id: 1, name: 'Event Type', description: 'Define your vision' },
    { id: 2, name: 'Date', description: 'Set the timeline' },
    { id: 3, name: 'Location', description: 'Choose the venue' },
    { id: 4, name: 'Scale', description: 'Size the experience' },
    { id: 5, name: 'Venue', description: 'Secure the space' }
  ];

  const getStepStatus = (stepId: number) => {
    if (isComplete) return 'complete';
    if (stepId < currentStep) return 'complete';
    if (stepId === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Blueprint Progress</h3>
          <p className="text-sm text-slate-300">
            {isComplete
              ? '🔥 Blueprint ready!'
              : `Step ${currentStep} of ${totalSteps} - ${steps[currentStep - 1]?.description || 'In progress'}`
            }
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-400">
            {Math.round((currentStep / totalSteps) * 100)}%
          </div>
          <div className="text-xs text-slate-400">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden border border-slate-600/50">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-700 ease-out shadow-lg"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        >
          <div className="h-full w-full bg-gradient-to-r from-white/20 to-transparent"></div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-5 gap-2">
        {steps.map((step) => {
          const status = getStepStatus(step.id);

          return (
            <div key={step.id} className="text-center">
              {/* Step Circle */}
              <div className="flex justify-center mb-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    status === 'complete'
                      ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg'
                      : status === 'current'
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/50'
                      : 'bg-slate-700/50 text-slate-500 border border-slate-600/50'
                  }`}
                >
                  {status === 'complete' ? (
                    <CheckIcon className="h-5 w-5" />
                  ) : status === 'current' ? (
                    <CogIcon className="h-5 w-5 animate-spin [animation-duration:2s]" />
                  ) : (
                    step.id
                  )}
                </div>
              </div>

              {/* Step Label */}
              <div
                className={`text-xs font-medium transition-colors duration-300 ${
                  status === 'complete' || status === 'current'
                    ? 'text-slate-200'
                    : 'text-slate-500'
                }`}
              >
                {step.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {isComplete && (
        <div className="mt-4 p-3 bg-gradient-to-r from-emerald-900/40 to-green-900/40 border border-emerald-500/30 rounded-lg backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <CheckIcon className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-medium text-emerald-300">
              Blueprint created successfully! Ready for professional matching.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};