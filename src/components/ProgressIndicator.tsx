'use client';

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step {
  id: string;
  name: string;
  description: string;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
}

export default function ProgressIndicator({ steps, currentStep, completedSteps }: ProgressIndicatorProps) {
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const isStepCompleted = (stepId: string) => {
    return completedSteps.includes(stepId);
  };

  const isStepCurrent = (stepId: string) => {
    return stepId === currentStep;
  };

  const isStepUpcoming = (stepId: string) => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    const currentIndex = getCurrentStepIndex();
    return stepIndex > currentIndex;
  };

  return (
    <div className="py-4">
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, stepIndex) => (
            <li key={step.id} className={`relative ${stepIndex !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
              {/* Connector Line */}
              {stepIndex !== steps.length - 1 && (
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div 
                    className={`h-0.5 w-full transition-all duration-500 ${
                      isStepCompleted(steps[stepIndex + 1].id) || isStepCurrent(steps[stepIndex + 1].id)
                        ? 'bg-blue-600' 
                        : 'bg-neutral-200'
                    }`} 
                  />
                </div>
              )}

              {/* Step Circle */}
              <div className="relative flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: stepIndex * 0.1 }}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isStepCompleted(step.id)
                      ? 'border-blue-600 bg-blue-600'
                      : isStepCurrent(step.id)
                      ? 'border-blue-600 bg-white ring-4 ring-blue-100'
                      : 'border-neutral-300 bg-white hover:border-neutral-400'
                  }`}
                >
                  {isStepCompleted(step.id) ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : (
                    <span 
                      className={`text-sm font-medium ${
                        isStepCurrent(step.id) 
                          ? 'text-blue-600' 
                          : isStepUpcoming(step.id)
                          ? 'text-neutral-400'
                          : 'text-neutral-600'
                      }`}
                    >
                      {stepIndex + 1}
                    </span>
                  )}
                </motion.div>

                {/* Step Label */}
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-center min-w-24">
                  <p 
                    className={`text-sm font-medium transition-colors ${
                      isStepCurrent(step.id)
                        ? 'text-blue-600'
                        : isStepCompleted(step.id)
                        ? 'text-neutral-900'
                        : 'text-neutral-500'
                    }`}
                  >
                    {step.name}
                  </p>
                  <p 
                    className={`text-xs mt-1 transition-colors ${
                      isStepCurrent(step.id)
                        ? 'text-blue-500'
                        : 'text-neutral-400'
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}