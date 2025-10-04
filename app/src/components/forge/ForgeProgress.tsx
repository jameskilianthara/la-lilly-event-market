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
          <h3 className="text-lg font-semibold text-slate-800">Blueprint Progress</h3>
          <p className="text-sm text-slate-600">
            {isComplete
              ? '🔥 Blueprint ready!'
              : `Step ${currentStep} of ${totalSteps} - ${steps[currentStep - 1]?.description || 'In progress'}`
            }
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-700">
            {Math.round((currentStep / totalSteps) * 100)}%
          </div>
          <div className="text-xs text-slate-600">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-slate-700 transition-all duration-700 ease-out"
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
                      ? 'bg-emerald-600 text-white'
                      : status === 'current'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-200 text-slate-500 border border-slate-300'
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
                    ? 'text-slate-800'
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
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center">
              <CheckIcon className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-medium text-emerald-700">
              Blueprint created successfully! Ready for professional matching.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};