'use client';

import React from 'react';
import { CalendarIcon, MapPinIcon, UsersIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

interface EventSummaryCardProps {
  clientBrief: {
    event_type?: string;
    date?: string;
    city?: string;
    guest_count?: string;
    venue_status?: string;
  };
}

export const EventSummaryCard: React.FC<EventSummaryCardProps> = ({ clientBrief }) => {
  const summaryItems = [
    {
      icon: CalendarIcon,
      label: 'Event Type',
      value: clientBrief.event_type || 'Not specified',
      color: 'text-gray-600'
    },
    {
      icon: CalendarIcon,
      label: 'Date',
      value: clientBrief.date || 'Not specified',
      color: 'text-green-600'
    },
    {
      icon: MapPinIcon,
      label: 'City',
      value: clientBrief.city || 'Not specified',
      color: 'text-orange-600'
    },
    {
      icon: UsersIcon,
      label: 'Guest Count',
      value: clientBrief.guest_count || 'Not specified',
      color: 'text-purple-600'
    },
    {
      icon: BuildingOfficeIcon,
      label: 'Venue Status',
      value: clientBrief.venue_status || 'Not specified',
      color: 'text-gray-600'
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Event Overview</h2>
        <p className="text-sm text-gray-600">Key details from your planning session</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {summaryItems.map((item, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                {item.label}
              </div>
              <div className="text-sm font-semibold text-gray-900 break-words">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Event Summary */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Planning Summary:</span> {clientBrief.event_type || 'Event'}
            {clientBrief.date && ` on ${clientBrief.date}`}
            {clientBrief.city && ` in ${clientBrief.city}`}
            {clientBrief.guest_count && ` for ${clientBrief.guest_count} guests`}
          </p>
        </div>
      </div>
    </div>
  );
};