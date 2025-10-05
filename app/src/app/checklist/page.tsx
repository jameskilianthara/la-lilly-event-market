'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ChevronDownIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
  PaintBrushIcon,
  MusicalNoteIcon,
  CakeIcon,
  CameraIcon,
  TruckIcon,
  PresentationChartBarIcon,
  MegaphoneIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

interface ChecklistItem {
  id: string;
  question: string;
  type: 'radio' | 'select' | 'checkbox';
  options: string[];
}

interface ChecklistCategory {
  id: string;
  title: string;
  icon: string;
  items: ChecklistItem[];
  additionalNotes?: boolean;
}

interface ChecklistData {
  eventType: string;
  displayName: string;
  categories: ChecklistCategory[];
}

// Icon mapping for categories
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  '🏛️': BuildingOffice2Icon,
  '🎨': PaintBrushIcon,
  '🎭': MusicalNoteIcon,
  '🍽️': CakeIcon,
  '📸': CameraIcon,
  '🚗': TruckIcon,
  '🏢': BuildingOffice2Icon,
  '🎯': PresentationChartBarIcon,
  '🎤': MusicalNoteIcon,
  '☕': CakeIcon,
  '👥': HomeIcon,
  '🎉': SparklesIcon,
  '🏠': HomeIcon,
  '🎪': MusicalNoteIcon,
  '🍰': CakeIcon,
  '✨': SparklesIcon,
  '🏗️': WrenchScrewdriverIcon,
  '🛠️': WrenchScrewdriverIcon,
  '📢': MegaphoneIcon,
  '📦': TruckIcon,
};

export default function ChecklistPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventType = searchParams.get('type') || 'wedding';

  const [checklist, setChecklist] = useState<ChecklistData | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selections, setSelections] = useState<Record<string, any>>({});
  const [categoryNotes, setCategoryNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChecklist();
    loadFromLocalStorage();
  }, [eventType]);

  const loadChecklist = async () => {
    try {
      const response = await fetch(`/data/checklists/${eventType}.json`);
      if (!response.ok) throw new Error('Checklist not found');
      const data = await response.json();
      setChecklist(data);
      // Expand first category by default
      if (data.categories.length > 0) {
        setExpandedCategories(new Set([data.categories[0].id]));
      }
    } catch (error) {
      console.error('Error loading checklist:', error);
      // Fallback to wedding if type not found
      if (eventType !== 'wedding') {
        const response = await fetch('/data/checklists/wedding.json');
        const data = await response.json();
        setChecklist(data);
        if (data.categories.length > 0) {
          setExpandedCategories(new Set([data.categories[0].id]));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem(`checklist_${eventType}`);
    if (saved) {
      const { selections: savedSelections, notes: savedNotes } = JSON.parse(saved);
      setSelections(savedSelections || {});
      setCategoryNotes(savedNotes || {});
    }
  };

  const saveToLocalStorage = (newSelections: Record<string, any>, newNotes: Record<string, string>) => {
    localStorage.setItem(`checklist_${eventType}`, JSON.stringify({
      selections: newSelections,
      notes: newNotes
    }));
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

  const handleSelectionChange = (itemId: string, value: any, type: string) => {
    const newSelections = { ...selections };

    if (type === 'checkbox') {
      const current = newSelections[itemId] || [];
      if (current.includes(value)) {
        newSelections[itemId] = current.filter((v: string) => v !== value);
      } else {
        newSelections[itemId] = [...current, value];
      }
    } else {
      newSelections[itemId] = value;
    }

    setSelections(newSelections);
    saveToLocalStorage(newSelections, categoryNotes);
  };

  const handleNotesChange = (categoryId: string, notes: string) => {
    const newNotes = { ...categoryNotes, [categoryId]: notes };
    setCategoryNotes(newNotes);
    saveToLocalStorage(selections, newNotes);
  };

  const getCategoryCompletion = (category: ChecklistCategory) => {
    const answeredItems = category.items.filter(item => {
      const value = selections[item.id];
      if (item.type === 'checkbox') {
        return value && value.length > 0;
      }
      return value && value.length > 0;
    }).length;

    return category.items.length > 0 ? Math.round((answeredItems / category.items.length) * 100) : 0;
  };

  const getOverallProgress = () => {
    if (!checklist) return 0;
    const totalItems = checklist.categories.reduce((sum, cat) => sum + cat.items.length, 0);
    const answeredItems = Object.keys(selections).filter(key => {
      const value = selections[key];
      if (Array.isArray(value)) return value.length > 0;
      return value && value.length > 0;
    }).length;
    return totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0;
  };

  const hasAnySelections = () => {
    return Object.keys(selections).some(key => {
      const value = selections[key];
      if (Array.isArray(value)) return value.length > 0;
      return value && value.length > 0;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-200 text-lg font-medium">Forging your checklist...</p>
        </div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4 font-semibold">Checklist not found</p>
          <button
            onClick={() => router.push('/forge')}
            className="text-orange-400 hover:text-orange-300 underline font-medium"
          >
            Return to Event Forge
          </button>
        </div>
      </div>
    );
  }

  const overallProgress = getOverallProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                {checklist.displayName}
              </h1>
              <p className="text-slate-300 mt-2 text-sm sm:text-base">Customize your event forge requirements</p>
            </div>
            <button
              onClick={() => router.push('/forge')}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg transition-all duration-200 border border-slate-600/50 hover:border-slate-500"
            >
              <ArrowRightIcon className="h-4 w-4 rotate-180" />
              <span className="text-sm font-medium">Back to Forge</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-300">Forge Progress</span>
              <span className="text-sm font-bold text-orange-400">{overallProgress}%</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden border border-slate-600/50">
              <div
                className="h-full bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {checklist.categories.map((category, index) => {
            const isExpanded = expandedCategories.has(category.id);
            const completion = getCategoryCompletion(category);
            const IconComponent = iconMap[category.icon] || BuildingOffice2Icon;

            return (
              <div
                key={category.id}
                className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-6 sm:p-8 hover:bg-slate-700/20 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-4 sm:space-x-6">
                    <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <IconComponent className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                      {completion === 100 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-slate-800">
                          <CheckCircleIcon className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-orange-400 transition-colors duration-200">
                          {category.title}
                        </h3>
                        {completion > 0 && completion < 100 && (
                          <span className="text-xs sm:text-sm bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full font-bold border border-orange-500/30">
                            {completion}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">{category.items.length} requirements</p>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`h-7 w-7 text-slate-400 group-hover:text-orange-400 transition-all duration-300 ${
                      isExpanded ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                </button>

                {/* Category Content */}
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                  }`}
                >
                  <div className="border-t border-slate-700/50 bg-slate-800/30 p-6 sm:p-8">
                    <div className="space-y-8">
                      {/* Selection Items */}
                      <div className="space-y-6">
                        {category.items.map((item) => (
                          <div key={item.id} className="space-y-3">
                            <label className="block text-sm sm:text-base font-semibold text-slate-200">
                              {item.question}
                            </label>

                            {/* Radio Buttons */}
                            {item.type === 'radio' && (
                              <div className="space-y-2">
                                {item.options.map((option) => (
                                  <label
                                    key={option}
                                    className={`flex items-center space-x-3 p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                                      selections[item.id] === option
                                        ? 'bg-orange-500/20 border-orange-500/50 shadow-lg shadow-orange-500/10'
                                        : 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={item.id}
                                      value={option}
                                      checked={selections[item.id] === option}
                                      onChange={(e) => handleSelectionChange(item.id, e.target.value, 'radio')}
                                      className="w-5 h-5 text-orange-600 bg-slate-700 border-slate-500 focus:ring-orange-500 focus:ring-2 focus:ring-offset-0"
                                    />
                                    <span className={`text-sm sm:text-base ${selections[item.id] === option ? 'text-white font-medium' : 'text-slate-300'}`}>
                                      {option}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {/* Select Dropdown */}
                            {item.type === 'select' && (
                              <select
                                value={selections[item.id] || ''}
                                onChange={(e) => handleSelectionChange(item.id, e.target.value, 'select')}
                                className={`w-full px-4 py-4 rounded-xl border transition-all duration-200 text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                                  selections[item.id]
                                    ? 'bg-orange-500/20 border-orange-500/50 text-white'
                                    : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/70'
                                }`}
                              >
                                <option value="" className="bg-slate-800 text-slate-300">Select an option...</option>
                                {item.options.map((option) => (
                                  <option key={option} value={option} className="bg-slate-800 text-white">
                                    {option}
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* Checkboxes */}
                            {item.type === 'checkbox' && (
                              <div className="space-y-2">
                                {item.options.map((option) => {
                                  const isChecked = (selections[item.id] || []).includes(option);
                                  return (
                                    <label
                                      key={option}
                                      className={`flex items-center space-x-3 p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                                        isChecked
                                          ? 'bg-orange-500/20 border-orange-500/50 shadow-lg shadow-orange-500/10'
                                          : 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        value={option}
                                        checked={isChecked}
                                        onChange={() => handleSelectionChange(item.id, option, 'checkbox')}
                                        className="w-5 h-5 text-orange-600 bg-slate-700 border-slate-500 rounded focus:ring-orange-500 focus:ring-2 focus:ring-offset-0"
                                      />
                                      <span className={`text-sm sm:text-base ${isChecked ? 'text-white font-medium' : 'text-slate-300'}`}>
                                        {option}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Additional Notes - Clearly Separated */}
                      {category.additionalNotes && (
                        <div className="pt-6 mt-6 border-t border-slate-600/50">
                          <div className="bg-gradient-to-br from-blue-900/40 to-slate-800/40 rounded-xl p-6 border border-blue-700/30">
                            <label className="block mb-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <WrenchScrewdriverIcon className="h-5 w-5 text-orange-400" />
                                <span className="text-base sm:text-lg font-bold text-orange-400">
                                  Additional Requirements & Custom Notes
                                </span>
                              </div>
                              <span className="text-xs sm:text-sm text-slate-400 block">
                                Add any specific requirements or customizations for {category.title.toLowerCase()}
                              </span>
                            </label>
                            <textarea
                              value={categoryNotes[category.id] || ''}
                              onChange={(e) => handleNotesChange(category.id, e.target.value)}
                              placeholder={`Add any specific requirements or customizations for ${category.title.toLowerCase()}...`}
                              rows={4}
                              className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 resize-none text-sm sm:text-base"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Button */}
        {hasAnySelections() && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => router.push('/blueprint/review')}
              className="group flex items-center space-x-3 px-10 py-5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 hover:from-orange-600 hover:via-orange-700 hover:to-orange-600 text-white font-bold rounded-2xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 border border-orange-400/50"
            >
              <span className="text-lg">Continue to Blueprint Review</span>
              <ArrowRightIcon className="h-6 w-6 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        )}

        {/* Empty State Message */}
        {!hasAnySelections() && (
          <div className="mt-10 text-center p-8 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-2xl border border-orange-500/30 backdrop-blur-sm">
            <SparklesIcon className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <p className="text-orange-300 font-semibold text-lg">
              Start forging your event by selecting requirements from the categories above
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
