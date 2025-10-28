'use client';

import React from 'react';

interface ProgressBarProps {
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Checklist Progress</h3>
          <p className="text-sm text-gray-800">
            {progress.completed} of {progress.total} items completed
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-800">
            {Math.round(progress.percentage)}%
          </div>
          <div className="text-xs text-gray-600">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-gray-600 to-gray-700 transition-all duration-700 ease-out"
          style={{ width: `${progress.percentage}%` }}
        >
          <div className="h-full w-full bg-gradient-to-r from-white/20 to-transparent"></div>
        </div>
      </div>

      {/* Progress Milestones */}
      <div className="flex justify-between mt-3 text-xs text-gray-600">
        <span className={progress.percentage >= 25 ? 'text-gray-800 font-medium' : ''}>
          25%
        </span>
        <span className={progress.percentage >= 50 ? 'text-gray-800 font-medium' : ''}>
          50%
        </span>
        <span className={progress.percentage >= 75 ? 'text-gray-800 font-medium' : ''}>
          75%
        </span>
        <span className={progress.percentage >= 100 ? 'text-emerald-600 font-bold' : ''}>
          Complete
        </span>
      </div>

      {/* Encouragement Message */}
      {progress.percentage > 0 && progress.percentage < 100 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            {progress.percentage < 25 && "Great start! Keep going to build your comprehensive event plan."}
            {progress.percentage >= 25 && progress.percentage < 50 && "You're making good progress! Your event is taking shape."}
            {progress.percentage >= 50 && progress.percentage < 75 && "More than halfway there! Your planning is really coming together."}
            {progress.percentage >= 75 && progress.percentage < 100 && "Almost done! Just a few more items to complete your checklist."}
          </p>
        </div>
      )}

      {/* Completion Message */}
      {progress.percentage >= 100 && (
        <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-medium text-emerald-700">
              Congratulations! Your event checklist is complete.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};