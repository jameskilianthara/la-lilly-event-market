/**
 * Dynamic Checklist Item Component
 * Conditionally renders checklist questions based on dependencies
 */

'use client';

import { useState, useEffect } from 'react';

export interface DependencyCondition {
  questionId: string;
  triggerValue: string | string[];
}

export interface DynamicChecklistItemProps {
  id: string;
  question: string;
  type: 'text' | 'radio' | 'select' | 'checkbox' | 'text_with_autocomplete' | 'dynamic_venue_selector';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  dependsOn?: DependencyCondition;
  children?: React.ReactNode;
  currentAnswers: Record<string, any>;
  onAnswer: (questionId: string, answer: any) => void;
  autocompleteSource?: string;
}

const DynamicChecklistItem: React.FC<DynamicChecklistItemProps> = ({
  id,
  question,
  type,
  options,
  placeholder,
  required,
  dependsOn,
  children,
  currentAnswers,
  onAnswer,
  autocompleteSource
}) => {
  const [value, setValue] = useState<any>(currentAnswers[id] || '');
  const [showChildren, setShowChildren] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Check if this item should be visible based on dependencies
  const shouldShow = (): boolean => {
    if (!dependsOn) return true;

    const parentValue = currentAnswers[dependsOn.questionId];
    if (!parentValue) return false;

    if (Array.isArray(dependsOn.triggerValue)) {
      return dependsOn.triggerValue.includes(parentValue);
    }

    return parentValue === dependsOn.triggerValue;
  };

  // Handle autocomplete search
  const handleAutocompleteSearch = async (searchQuery: string) => {
    if (!autocompleteSource || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(autocompleteSource, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, maxResults: 5 })
      });

      const data = await response.json();
      setSuggestions(data.results || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Autocomplete search failed:', error);
      setSuggestions([]);
    }
  };

  // Handle value change
  const handleValueChange = (newValue: any) => {
    setValue(newValue);
    onAnswer(id, newValue);

    // Check if this answer triggers child questions
    if (children && newValue) {
      setShowChildren(true);
    } else {
      setShowChildren(false);
    }
  };

  // Handle autocomplete selection
  const handleSuggestionSelect = (suggestion: any) => {
    const selectedValue = suggestion.basic_info?.official_name || suggestion.name;
    setValue(selectedValue);
    onAnswer(id, {
      name: selectedValue,
      venue_data: suggestion
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  if (!shouldShow()) {
    return null;
  }

  return (
    <div className="dynamic-checklist-item mb-6">
      <label className="block text-sm font-medium text-gray-200 mb-2">
        {question}
        {required && <span className="text-pink-500 ml-1">*</span>}
      </label>

      {/* Text Input */}
      {type === 'text' && (
        <input
          type="text"
          value={value}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
          required={required}
        />
      )}

      {/* Text with Autocomplete */}
      {type === 'text_with_autocomplete' && (
        <div className="relative">
          <input
            type="text"
            value={value?.name || value || ''}
            onChange={(e) => {
              const newValue = e.target.value;
              setValue(newValue);
              handleAutocompleteSearch(newValue);
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
            required={required}
          />

          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-700 border-b border-gray-700 last:border-b-0"
                >
                  <div className="font-medium text-white">
                    {suggestion.basic_info?.official_name || suggestion.name}
                  </div>
                  {suggestion.location?.address && (
                    <div className="text-xs text-gray-400 mt-1">
                      {suggestion.location.address}
                    </div>
                  )}
                  {suggestion.capacity?.event_spaces?.[0] && (
                    <div className="text-xs text-gray-400 mt-1">
                      Capacity: {suggestion.capacity.event_spaces[0].min_guests}-
                      {suggestion.capacity.event_spaces[0].max_guests} guests
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Radio Options */}
      {type === 'radio' && options && (
        <div className="space-y-2">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center space-x-3 p-3 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer hover:border-pink-500"
            >
              <input
                type="radio"
                name={id}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => handleValueChange(e.target.value)}
                className="w-4 h-4 text-pink-600 bg-gray-700 border-gray-600 focus:ring-pink-500"
              />
              <span className="text-white">{option.label}</span>
            </label>
          ))}
        </div>
      )}

      {/* Select Dropdown */}
      {type === 'select' && options && (
        <select
          value={value}
          onChange={(e) => handleValueChange(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
          required={required}
        >
          <option value="">Select an option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {/* Checkbox */}
      {type === 'checkbox' && (
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleValueChange(e.target.checked)}
            className="w-4 h-4 text-pink-600 bg-gray-700 border-gray-600 rounded focus:ring-pink-500"
          />
          <span className="text-white">{question}</span>
        </label>
      )}

      {/* Children (dependent questions) */}
      {showChildren && children && (
        <div className="mt-4 pl-6 border-l-2 border-pink-500/30">
          {children}
        </div>
      )}
    </div>
  );
};

export default DynamicChecklistItem;
