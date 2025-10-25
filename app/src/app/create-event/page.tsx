'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Calendar, MapPin, Users, Building2, Sparkles, ArrowRight, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ClientBrief } from '@/types/blueprint';

interface BlueprintItem {
  id: string;
  label: string;
  required?: boolean;
  notes?: string;
}

interface BlueprintSection {
  id: string;
  title: string;
  description: string;
  items: BlueprintItem[];
}

const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding', icon: '💑' },
  { value: 'corporate', label: 'Corporate Event', icon: '🏢' },
  { value: 'birthday', label: 'Birthday Party', icon: '🎂' },
  { value: 'conference', label: 'Conference', icon: '🎯' },
  { value: 'other', label: 'Other', icon: '🎉' },
];

export default function CreateEventPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [clientBrief, setClientBrief] = useState<ClientBrief>({
    event_type: '',
    date: '',
    city: '',
    guest_count: '',
    venue_status: '',
  });
  const [blueprint, setBlueprint] = useState<BlueprintSection[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save every 3 seconds
  useEffect(() => {
    if (Object.values(clientBrief).some(val => val !== '')) {
      const timer = setTimeout(() => {
        // Save to localStorage
        localStorage.setItem('event_draft', JSON.stringify(clientBrief));
        setLastSaved(new Date());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [clientBrief]);

  // Load saved draft
  useEffect(() => {
    const saved = localStorage.getItem('event_draft');
    if (saved) {
      setClientBrief(JSON.parse(saved));
    }
  }, []);

  // Load blueprint when event type changes
  useEffect(() => {
    if (clientBrief.event_type) {
      // Mock blueprint loading - replace with actual API call
      setBlueprint([
        {
          id: 'venue',
          title: 'Venue & Logistics',
          description: 'Location and space requirements',
          items: [
            { id: 'venue_type', label: 'Indoor or outdoor preference?', required: true },
            { id: 'venue_size', label: 'Venue capacity requirements', required: true },
            { id: 'parking', label: 'Parking arrangements needed?', required: false },
          ],
        },
        {
          id: 'services',
          title: 'Services & Vendors',
          description: 'Professional services needed',
          items: [
            { id: 'catering', label: 'Catering and menu preferences', required: true },
            { id: 'decoration', label: 'Decoration style and theme', required: true },
            { id: 'entertainment', label: 'Entertainment requirements', required: false },
          ],
        },
      ]);
    }
  }, [clientBrief.event_type]);

  const updateBrief = (field: keyof ClientBrief, value: string) => {
    setClientBrief(prev => ({ ...prev, [field]: value }));
  };

  const estimatedBudget = clientBrief.guest_count
    ? `₹${(parseInt(clientBrief.guest_count) * 2500).toLocaleString('en-IN')} - ₹${(parseInt(clientBrief.guest_count) * 4500).toLocaleString('en-IN')}`
    : '—';

  const progress = Object.values(clientBrief).filter(val => val !== '').length;
  const totalSteps = 5;

  const handlePublish = async () => {
    // TODO: Call API to create event project
    console.log('Publishing event:', { clientBrief, blueprint });
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Plan Your Event</h1>
              <p className="text-sm text-slate-600 mt-1">Complete your event details below</p>
            </div>
            <div className="flex items-center gap-4">
              {lastSaved && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Save className="w-4 h-4" />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 w-8 rounded-full transition-colors ${
                        i < progress ? 'bg-orange-500' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-600">{progress}/{totalSteps}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Event Type */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                What type of event are you planning? *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {EVENT_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => updateBrief('event_type', type.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      clientBrief.event_type === type.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{type.icon}</div>
                    <div className="text-sm font-medium text-slate-900">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Event Details */}
            <AnimatePresence>
              {clientBrief.event_type && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4"
                >
                  {/* Date */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Event Date *
                    </label>
                    <input
                      type="date"
                      value={clientBrief.date}
                      onChange={(e) => updateBrief('date', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      City *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Mumbai, Delhi, Bangalore"
                      value={clientBrief.city}
                      onChange={(e) => updateBrief('city', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                    />
                  </div>

                  {/* Guest Count */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      <Users className="w-4 h-4 inline mr-2" />
                      Number of Guests *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 200"
                      value={clientBrief.guest_count}
                      onChange={(e) => updateBrief('guest_count', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                    />
                  </div>

                  {/* Venue Status */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      <Building2 className="w-4 h-4 inline mr-2" />
                      Venue Status *
                    </label>
                    <select
                      value={clientBrief.venue_status}
                      onChange={(e) => updateBrief('venue_status', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                    >
                      <option value="">Select status</option>
                      <option value="booked">Already Booked</option>
                      <option value="need_help">Need Help Finding</option>
                      <option value="considering">Considering Options</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Checklist Preview */}
            <AnimatePresence>
              {blueprint.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
                >
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    <Sparkles className="w-5 h-5 inline mr-2 text-orange-500" />
                    Your Event Checklist
                  </h3>
                  <div className="space-y-4">
                    {blueprint.map(section => (
                      <div key={section.id} className="border-l-4 border-orange-500 pl-4">
                        <h4 className="font-semibold text-slate-900">{section.title}</h4>
                        <p className="text-sm text-slate-600 mb-2">{section.description}</p>
                        <ul className="space-y-1">
                          {section.items.slice(0, 2).map(item => (
                            <li key={item.id} className="text-sm text-slate-700 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              {item.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Preview & Budget */}
          <div className="space-y-6">
            {/* Budget Estimator */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="text-lg font-semibold mb-2">Estimated Budget</h3>
              <div className="text-4xl font-bold mb-4">{estimatedBudget}</div>
              <p className="text-orange-100 text-sm">
                Based on {clientBrief.guest_count || '—'} guests and typical {clientBrief.event_type || 'event'} costs
              </p>
            </div>

            {/* Summary Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Event Summary</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-slate-600">Event Type</dt>
                  <dd className="font-semibold text-slate-900">{clientBrief.event_type || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">Date</dt>
                  <dd className="font-semibold text-slate-900">{clientBrief.date || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">Location</dt>
                  <dd className="font-semibold text-slate-900">{clientBrief.city || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">Guests</dt>
                  <dd className="font-semibold text-slate-900">{clientBrief.guest_count || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">Venue</dt>
                  <dd className="font-semibold text-slate-900">{clientBrief.venue_status || '—'}</dd>
                </div>
              </dl>
            </div>

            {/* Publish Button */}
            {progress === totalSteps && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handlePublish}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                Publish Event & Get Proposals
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
