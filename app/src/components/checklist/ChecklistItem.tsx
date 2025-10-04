'use client';

import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

interface ItemType {
  id: string;
  question: string;
  type: string;
  options?: string[];
  placeholder?: string;
}

interface ChecklistItemProps {
  item: ItemType;
  value: string | string[] | boolean;
  onChange: (value: string | string[] | boolean) => void;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({ item, value, onChange }) => {
  const renderInput = () => {
    switch (item.type) {
      case 'checkbox':
        return (
          <div className="space-y-2">
            {item.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={Array.isArray(value) ? value.includes(option) : false}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter(v => v !== option);
                      onChange(newValues);
                    }}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    Array.isArray(value) && value.includes(option)
                      ? 'bg-gray-700 border-gray-700'
                      : 'border-gray-300 group-hover:border-gray-400'
                  }`}>
                    {Array.isArray(value) && value.includes(option) && (
                      <CheckIcon className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                <span className="text-gray-800 group-hover:text-gray-900 transition-colors">
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {item.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="radio"
                    name={item.id}
                    checked={value === option}
                    onChange={() => onChange(option)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    value === option
                      ? 'bg-gray-700 border-gray-700'
                      : 'border-gray-300 group-hover:border-gray-400'
                  }`}>
                    {value === option && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>
                <span className="text-gray-800 group-hover:text-gray-900 transition-colors">
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          >
            <option value="">Please select an option</option>
            {item.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'text':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={item.placeholder}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={item.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-6 h-6 mt-1">
          {/* Completion indicator */}
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
            value && (
              (Array.isArray(value) && value.length > 0) ||
              (!Array.isArray(value) && value.toString().trim() !== '')
            )
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-gray-300'
          }`}>
            {value && (
              (Array.isArray(value) && value.length > 0) ||
              (!Array.isArray(value) && value.toString().trim() !== '')
            ) && (
              <CheckIcon className="w-4 h-4 text-white" />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 mb-3">{item.question}</h4>
          {renderInput()}
        </div>
      </div>
    </div>
  );
};