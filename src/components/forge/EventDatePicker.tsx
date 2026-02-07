'use client';

import React, { useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';

interface EventDatePickerProps {
  onDateSelect: (date: string) => void;
  initialDate?: string;
}

export const EventDatePicker: React.FC<EventDatePickerProps> = ({
  onDateSelect,
  initialDate = ''
}) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [error, setError] = useState('');
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  // Function to open the date picker
  const openDatePicker = () => {
    dateInputRef.current?.showPicker?.();
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get max date (2 years from now)
  const getMaxDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 2);
    return date.toISOString().split('T')[0];
  };

  // Format date for display
  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Validate selected date
  const validateDate = (dateString: string): { valid: boolean; error: string } => {
    if (!dateString) {
      return { valid: false, error: 'Please select a date' };
    }

    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return { valid: false, error: 'Event date must be in the future' };
    }

    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);

    if (selectedDate > maxDate) {
      return { valid: false, error: 'Event date must be within 2 years' };
    }

    return { valid: true, error: '' };
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    setError('');
  };

  const handleSubmit = () => {
    const validation = validateDate(selectedDate);

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    onDateSelect(selectedDate);
  };

  // Quick date suggestions
  const getQuickDates = () => {
    const dates = [];
    const today = new Date();

    // Next month
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    dates.push({
      label: 'Next month',
      value: nextMonth.toISOString().split('T')[0]
    });

    // 3 months from now
    const threeMonths = new Date(today);
    threeMonths.setMonth(threeMonths.getMonth() + 3);
    dates.push({
      label: '3 months',
      value: threeMonths.toISOString().split('T')[0]
    });

    // 6 months from now
    const sixMonths = new Date(today);
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    dates.push({
      label: '6 months',
      value: sixMonths.toISOString().split('T')[0]
    });

    return dates;
  };

  return (
    <div className="space-y-4">
      {/* Calendar Input */}
      <div className="relative">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Select your event date
        </label>

        <div className="relative group">
          {/* Clickable calendar button */}
          <button
            type="button"
            onClick={openDatePicker}
            className="absolute inset-y-0 right-0 pr-3 flex items-center z-20 cursor-pointer"
          >
            <div className="bg-gradient-to-br from-orange-500/30 to-orange-600/30 rounded-lg p-2.5 group-hover:from-orange-500/40 group-hover:to-orange-600/40 transition-all shadow-lg hover:scale-105">
              <CalendarIcon className="h-6 w-6 text-orange-400 group-hover:text-orange-300 transition-colors" />
            </div>
          </button>

          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            min={getTodayDate()}
            max={getMaxDate()}
            className="w-full pl-4 pr-20 py-4 bg-slate-700 border-2 border-slate-600 hover:border-orange-500/50 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-base cursor-pointer hover:bg-slate-700/80 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            style={{ fontSize: '16px' }} // Prevents zoom on iOS
            placeholder="Click anywhere to select date"
          />
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-400 flex items-center">
            <span className="mr-1">⚠️</span>
            {error}
          </p>
        )}
      </div>

      {/* Selected Date Preview */}
      {selectedDate && !error && (
        <div className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-3">
          <p className="text-sm text-slate-400 mb-1">Selected date:</p>
          <p className="text-white font-medium">{formatDisplayDate(selectedDate)}</p>
        </div>
      )}

      {/* Quick Date Suggestions */}
      <div className="flex flex-wrap gap-2">
        <p className="w-full text-xs text-slate-400 mb-1">Quick select:</p>
        {getQuickDates().map((quickDate, index) => (
          <button
            key={index}
            type="button"
            onClick={() => {
              setSelectedDate(quickDate.value);
              setError('');
            }}
            className="bg-slate-700 hover:bg-slate-600 border border-slate-600 px-3 py-1.5 rounded-full text-sm text-slate-200 hover:text-white transition-all font-medium shadow-sm hover:shadow-md"
          >
            {quickDate.label}
          </button>
        ))}
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedDate}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-slate-600 disabled:to-slate-700 py-3 rounded-lg text-white font-semibold transition-all duration-200 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 disabled:shadow-none"
      >
        Continue →
      </button>
    </div>
  );
};
