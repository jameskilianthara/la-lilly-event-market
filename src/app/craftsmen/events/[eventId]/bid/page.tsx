'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  PhotoIcon,
  CalendarIcon,
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon,
  InformationCircleIcon,
  TrashIcon,
  PlusIcon,
  LightBulbIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';

// Types
interface VendorSession {
  vendorId: string;
  email: string;
  businessName?: string;
  phone?: string;
}

interface EventData {
  eventId: string;
  eventMemory: {
    event_type: string;
    date: string;
    location: string;
    guest_count: string;
    venue_status: string;
  };
  checklistData?: {
    selections: Record<string, any>;
    notes: Record<string, string>;
  };
  bids?: Bid[];
  status: string;
}

interface Bid {
  bidId: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  vendorPhone?: string;
  pricing: Record<string, { amount: number; notes: string }>;
  subtotals: Record<string, number>;
  total: number;
  coverLetter: string;
  whyPerfect: string;
  timeline: string;
  advancePayment: number;
  portfolio: string[];
  submittedAt: string;
  status: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface CategoryPricing {
  lineItems: LineItem[];
  notes: string;
}

// Market rate guidance data
const MARKET_RATES: Record<string, any> = {
  Catering: { perPerson: { min: 500, max: 2500 }, unit: 'per guest' },
  Decoration: { perEvent: { min: 50000, max: 500000 }, unit: 'per event' },
  Photography: { perDay: { min: 15000, max: 150000 }, unit: 'per day' },
  Videography: { perDay: { min: 20000, max: 200000 }, unit: 'per day' },
  Entertainment: { perEvent: { min: 25000, max: 300000 }, unit: 'per event' },
  Venue: { perDay: { min: 50000, max: 1000000 }, unit: 'per day' },
  Transportation: { perVehicle: { min: 5000, max: 50000 }, unit: 'per vehicle' },
  'Makeup & Beauty': { perPerson: { min: 5000, max: 75000 }, unit: 'per person' },
};

export default function SmartBidForm() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  // State
  const [session, setSession] = useState<VendorSession | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingBid, setExistingBid] = useState<Bid | null>(null);

  // Form state - Smart itemized pricing
  const [categoryPricing, setCategoryPricing] = useState<Record<string, CategoryPricing>>({});
  const [coverLetter, setCoverLetter] = useState('');
  const [whyPerfect, setWhyPerfect] = useState('');
  const [timeline, setTimeline] = useState('');
  const [advancePayment, setAdvancePayment] = useState('30');
  const [portfolioImages, setPortfolioImages] = useState<string[]>(['']);

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check authentication
    const sessionData = localStorage.getItem('vendor_session');
    if (!sessionData) {
      router.push(`/craftsmen/login?returnUrl=/craftsmen/events/${eventId}/bid`);
      return;
    }

    const parsedSession: VendorSession = JSON.parse(sessionData);
    setSession(parsedSession);

    // Load event
    loadEvent(parsedSession.vendorId);
  }, [eventId, router]);

  const loadEvent = (vendorId: string) => {
    setLoading(true);

    const postedEvents = JSON.parse(localStorage.getItem('posted_events') || '[]');
    const foundEvent = postedEvents.find((e: EventData) => e.eventId === eventId);

    if (!foundEvent) {
      setLoading(false);
      return;
    }

    setEvent(foundEvent);

    // Check for existing bid
    const existingBidForVendor = foundEvent.bids?.find((b: Bid) => b.vendorId === vendorId);

    if (existingBidForVendor) {
      setIsEditMode(true);
      setExistingBid(existingBidForVendor);
      prefillForm(existingBidForVendor);
    } else {
      // Initialize empty pricing for all categories
      if (foundEvent.checklistData?.selections) {
        const initialPricing: Record<string, CategoryPricing> = {};
        Object.keys(foundEvent.checklistData.selections).forEach(category => {
          initialPricing[category] = {
            lineItems: [{ id: '1', description: '', quantity: 1, unit: 'unit', unitPrice: 0 }],
            notes: ''
          };
        });
        setCategoryPricing(initialPricing);
        // Auto-expand first category
        setExpandedCategories(new Set([Object.keys(foundEvent.checklistData.selections)[0]]));
      }

      // Auto-populate portfolio links from vendor profile
      loadVendorProfileLinks(vendorId);
    }

    setLoading(false);
  };

  const loadVendorProfileLinks = (vendorId: string) => {
    // Load vendor profile from localStorage
    const vendors = JSON.parse(localStorage.getItem('active_vendors') || '[]');
    const vendorProfile = vendors.find((v: any) => v.id === vendorId);

    if (!vendorProfile) return;

    // Collect profile links
    const profileLinks: string[] = [];

    // Add website if available
    if (vendorProfile.website && vendorProfile.website.trim()) {
      profileLinks.push(vendorProfile.website.trim());
    }

    // Add Instagram if available
    if (vendorProfile.instagram && vendorProfile.instagram.trim()) {
      profileLinks.push(vendorProfile.instagram.trim());
    }

    // Add Facebook if available
    if (vendorProfile.facebook && vendorProfile.facebook.trim()) {
      profileLinks.push(vendorProfile.facebook.trim());
    }

    // Add portfolio images (first 5)
    if (vendorProfile.portfolioImages && vendorProfile.portfolioImages.length > 0) {
      const imageUrls = vendorProfile.portfolioImages
        .slice(0, 5)
        .map((img: any) => img.url)
        .filter((url: string) => url && url.trim());
      profileLinks.push(...imageUrls);
    }

    // Set portfolio images (limit to 5 total)
    if (profileLinks.length > 0) {
      const limitedLinks = profileLinks.slice(0, 5);
      // Add empty field for additional custom links if not at max
      if (limitedLinks.length < 5) {
        limitedLinks.push('');
      }
      setPortfolioImages(limitedLinks);
    }
  };

  const prefillForm = (bid: Bid) => {
    // Convert old pricing format to new line items format
    const pricingData: Record<string, CategoryPricing> = {};
    Object.entries(bid.pricing).forEach(([category, data]) => {
      pricingData[category] = {
        lineItems: [
          {
            id: '1',
            description: data.notes || category,
            quantity: 1,
            unit: 'unit',
            unitPrice: data.amount
          }
        ],
        notes: data.notes
      };
    });

    setCategoryPricing(pricingData);
    setCoverLetter(bid.coverLetter);
    setWhyPerfect(bid.whyPerfect);
    setTimeline(bid.timeline.split('T')[0]);
    setAdvancePayment(bid.advancePayment.toString());
    setPortfolioImages(bid.portfolio.length > 0 ? bid.portfolio : ['']);

    // Expand all categories with pricing
    setExpandedCategories(new Set(Object.keys(pricingData)));
  };

  // Line item management
  const addLineItem = (category: string) => {
    setCategoryPricing(prev => {
      const existing = prev[category] || { lineItems: [], notes: '' };
      const newId = (existing.lineItems.length + 1).toString();
      return {
        ...prev,
        [category]: {
          ...existing,
          lineItems: [
            ...existing.lineItems,
            { id: newId, description: '', quantity: 1, unit: 'unit', unitPrice: 0 }
          ]
        }
      };
    });
  };

  const removeLineItem = (category: string, itemId: string) => {
    setCategoryPricing(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        lineItems: prev[category].lineItems.filter(item => item.id !== itemId)
      }
    }));
  };

  const updateLineItem = (category: string, itemId: string, field: keyof LineItem, value: any) => {
    setCategoryPricing(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        lineItems: prev[category].lineItems.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const updateCategoryNotes = (category: string, notes: string) => {
    setCategoryPricing(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        notes
      }
    }));
  };

  // Calculations
  const calculateLineItemTotal = (item: LineItem): number => {
    return (item.quantity || 0) * (item.unitPrice || 0);
  };

  const calculateCategorySubtotal = (category: string): number => {
    const categoryData = categoryPricing[category];
    if (!categoryData) return 0;

    return categoryData.lineItems.reduce((sum, item) => sum + calculateLineItemTotal(item), 0);
  };

  const calculateGrandTotal = (): number => {
    return Object.keys(categoryPricing).reduce((total, category) => {
      return total + calculateCategorySubtotal(category);
    }, 0);
  };

  const calculateTaxes = (): number => {
    return calculateGrandTotal() * 0.18; // 18% GST
  };

  const calculateFinalTotal = (): number => {
    return calculateGrandTotal() + calculateTaxes();
  };

  const calculateAdvanceAmount = (): number => {
    return (calculateFinalTotal() * parseFloat(advancePayment || '0')) / 100;
  };

  // Market rate comparison
  const getMarketRateGuidance = (category: string): string => {
    const rate = MARKET_RATES[category];
    if (!rate) return '';

    const rateType = Object.keys(rate)[0];
    const rateData = rate[rateType];
    const unit = rate.unit;

    return `Market rate: ₹${rateData.min.toLocaleString('en-IN')} - ₹${rateData.max.toLocaleString('en-IN')} ${unit}`;
  };

  // Portfolio management
  const addPortfolioImage = () => {
    if (portfolioImages.length < 5) {
      setPortfolioImages([...portfolioImages, '']);
    }
  };

  const updatePortfolioImage = (index: number, url: string) => {
    const updated = [...portfolioImages];
    updated[index] = url;
    setPortfolioImages(updated);
  };

  const removePortfolioImage = (index: number) => {
    const updated = portfolioImages.filter((_, i) => i !== index);
    setPortfolioImages(updated.length > 0 ? updated : ['']);
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check pricing
    const categoriesWithPricing = Object.keys(categoryPricing).filter(
      cat => calculateCategorySubtotal(cat) > 0
    ).length;

    const totalCategories = Object.keys(categoryPricing).length;
    const requiredCategories = Math.max(3, Math.ceil(totalCategories * 0.5));

    if (categoriesWithPricing < requiredCategories) {
      newErrors.pricing = `Please provide pricing for at least ${requiredCategories} categories`;
    }

    const total = calculateGrandTotal();
    if (total <= 0) {
      newErrors.total = 'Total amount must be greater than 0';
    }

    if (!coverLetter.trim() || coverLetter.length < 50) {
      newErrors.coverLetter = 'Cover letter must be at least 50 characters';
    }

    if (!whyPerfect.trim() || whyPerfect.length < 20) {
      newErrors.whyPerfect = 'Please provide at least 20 characters';
    }

    if (!timeline) {
      newErrors.timeline = 'Please provide a timeline';
    }

    const advance = parseFloat(advancePayment);
    if (isNaN(advance) || advance < 0 || advance > 50) {
      newErrors.advancePayment = 'Advance must be between 0% and 50%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);

    try {
      // Convert line items to old pricing format for compatibility
      const pricing: Record<string, { amount: number; notes: string }> = {};
      const subtotals: Record<string, number> = {};

      Object.entries(categoryPricing).forEach(([category, data]) => {
        const subtotal = calculateCategorySubtotal(category);
        if (subtotal > 0) {
          pricing[category] = {
            amount: subtotal,
            notes: data.notes || data.lineItems.map(item =>
              `${item.description}: ${item.quantity} ${item.unit} × ₹${item.unitPrice}`
            ).join('; ')
          };
          subtotals[category] = subtotal;
        }
      });

      const validPortfolio = portfolioImages.filter(url => url.trim() !== '');

      const bid: Bid = {
        bidId: isEditMode && existingBid
          ? existingBid.bidId
          : `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        vendorId: session!.vendorId,
        vendorName: session!.businessName || 'Vendor',
        vendorEmail: session!.email,
        vendorPhone: session!.phone,
        pricing,
        subtotals,
        total: calculateGrandTotal(),
        coverLetter: coverLetter.trim(),
        whyPerfect: whyPerfect.trim(),
        timeline,
        advancePayment: parseFloat(advancePayment),
        portfolio: validPortfolio,
        submittedAt: isEditMode && existingBid
          ? existingBid.submittedAt
          : new Date().toISOString(),
        status: 'pending'
      };

      // Update storage
      const postedEvents = JSON.parse(localStorage.getItem('posted_events') || '[]');
      const eventIndex = postedEvents.findIndex((e: EventData) => e.eventId === eventId);

      if (eventIndex !== -1) {
        if (!postedEvents[eventIndex].bids) {
          postedEvents[eventIndex].bids = [];
        }

        if (isEditMode) {
          const bidIndex = postedEvents[eventIndex].bids.findIndex(
            (b: Bid) => b.vendorId === session!.vendorId
          );
          if (bidIndex !== -1) {
            postedEvents[eventIndex].bids[bidIndex] = bid;
          }
        } else {
          postedEvents[eventIndex].bids.push(bid);
        }

        localStorage.setItem('posted_events', JSON.stringify(postedEvents));
      }

      const vendorBids = JSON.parse(localStorage.getItem('vendor_bids') || '[]');
      if (isEditMode) {
        const bidIndex = vendorBids.findIndex(
          (b: any) => b.eventId === eventId && b.vendorId === session!.vendorId
        );
        if (bidIndex !== -1) {
          vendorBids[bidIndex] = { ...bid, eventId };
        } else {
          vendorBids.push({ ...bid, eventId });
        }
      } else {
        vendorBids.push({ ...bid, eventId });
      }
      localStorage.setItem('vendor_bids', JSON.stringify(vendorBids));

      setToastMessage(isEditMode ? 'Proposal updated! 🎉' : 'Proposal submitted! 🎉');
      setShowToast(true);

      setTimeout(() => {
        router.push('/craftsmen/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Failed to submit bid:', error);
      setErrors({ submit: 'Failed to submit proposal. Please try again.' });
      setSubmitting(false);
    }
  };

  const formatCategoryName = (category: string): string => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const getTimeUntilEvent = (): string => {
    if (!event) return '';
    const eventDate = new Date(event.eventMemory.date);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Event passed';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day away';
    if (diffDays < 7) return `${diffDays} days away`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks away`;
    return `${Math.floor(diffDays / 30)} months away`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
          <XMarkIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Event Not Found</h2>
          <p className="text-slate-400 mb-8">This event may have been removed or the link is incorrect.</p>
          <button
            onClick={() => router.push('/craftsmen/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const categories = event.checklistData?.selections ? Object.keys(event.checklistData.selections) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 pb-32">
      {/* Sticky Event Context Bar */}
      <div className="bg-gradient-to-r from-slate-800/98 to-slate-900/98 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {/* Top row: Back button and event ID */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.push(`/craftsmen/events/${eventId}`)}
              className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Details</span>
            </button>
            <code className="text-xs text-slate-500 font-mono">{eventId.slice(0, 16)}...</code>
          </div>

          {/* Event context strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="h-4 w-4 text-orange-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Event Type</p>
                <p className="text-sm font-semibold text-white capitalize truncate">{event.eventMemory.event_type}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="h-4 w-4 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Date</p>
                <p className="text-sm font-semibold text-white truncate">
                  {new Date(event.eventMemory.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-xs text-blue-400">{getTimeUntilEvent()}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <UserGroupIcon className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Guests</p>
                <p className="text-sm font-semibold text-white">{event.eventMemory.guest_count}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <MapPinIcon className="h-4 w-4 text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Location</p>
                <p className="text-sm font-semibold text-white truncate">{event.eventMemory.location}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <ClockIcon className="h-4 w-4 text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Competition</p>
                <p className="text-sm font-semibold text-white">{(event.bids?.length || 0)} bids</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-300 font-medium">Editing your submitted proposal</p>
                <p className="text-sm text-blue-200/80 mt-1">Changes will update your existing bid</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {(errors.pricing || errors.total || errors.submit) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <XMarkIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-medium">Please fix errors:</p>
                <ul className="text-sm text-red-200/80 mt-2 space-y-1">
                  {errors.pricing && <li>• {errors.pricing}</li>}
                  {errors.total && <li>• {errors.total}</li>}
                  {errors.submit && <li>• {errors.submit}</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout: Form + Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Main Form (2/3 width) */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {/* Smart Itemized Pricing */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-b border-orange-500/30 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center">
                    <CalculatorIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Smart Pricing Calculator</h2>
                    <p className="text-sm text-orange-200/80">Itemized breakdown with auto-calculation</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {categories.length > 0 ? (
                  categories.map(category => {
                    const isExpanded = expandedCategories.has(category);
                    const subtotal = calculateCategorySubtotal(category);
                    const selections = event.checklistData!.selections[category];
                    const marketRate = getMarketRateGuidance(category);

                    return (
                      <div
                        key={category}
                        className={`rounded-xl border overflow-hidden transition-all ${
                          subtotal > 0
                            ? 'border-orange-500/30 bg-orange-500/5'
                            : 'border-slate-600/50 bg-slate-700/20'
                        }`}
                      >
                        {/* Category Header - Collapsible */}
                        <button
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-white">
                              {formatCategoryName(category)}
                            </h3>
                            {subtotal > 0 && (
                              <span className="px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded text-xs font-semibold text-orange-300">
                                ₹{subtotal.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                          <svg
                            className={`w-5 h-5 text-slate-400 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Category Content */}
                        {isExpanded && (
                          <div className="px-5 pb-5 space-y-4 border-t border-slate-600/30">
                            {/* Client Requirements */}
                            {selections && (
                              <div className="pt-4">
                                <p className="text-xs text-slate-400 mb-2 flex items-center space-x-1">
                                  <InformationCircleIcon className="h-4 w-4" />
                                  <span>Client requirements:</span>
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(selections).map(([key, value]) => (
                                    <span
                                      key={key}
                                      className="px-2 py-1 bg-slate-600/30 text-slate-300 text-xs rounded"
                                    >
                                      {String(value)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Market Rate Guidance */}
                            {marketRate && (
                              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                <div className="flex items-start space-x-2">
                                  <LightBulbIcon className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-xs font-medium text-blue-300">Market Guidance</p>
                                    <p className="text-xs text-blue-200/80 mt-0.5">{marketRate}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Line Items */}
                            <div className="space-y-3">
                              {categoryPricing[category]?.lineItems.map((item, index) => (
                                <div
                                  key={item.id}
                                  className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30"
                                >
                                  <div className="grid grid-cols-12 gap-3 items-start">
                                    {/* Description (5 cols) */}
                                    <div className="col-span-12 sm:col-span-5">
                                      <label className="block text-xs font-medium text-slate-400 mb-1">
                                        Item Description
                                      </label>
                                      <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => updateLineItem(category, item.id, 'description', e.target.value)}
                                        placeholder="e.g., Main course buffet"
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                      />
                                    </div>

                                    {/* Quantity (2 cols) */}
                                    <div className="col-span-4 sm:col-span-2">
                                      <label className="block text-xs font-medium text-slate-400 mb-1">Qty</label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={item.quantity}
                                        onChange={(e) => updateLineItem(category, item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                      />
                                    </div>

                                    {/* Unit (2 cols) */}
                                    <div className="col-span-4 sm:col-span-2">
                                      <label className="block text-xs font-medium text-slate-400 mb-1">Unit</label>
                                      <select
                                        value={item.unit}
                                        onChange={(e) => updateLineItem(category, item.id, 'unit', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                      >
                                        <option value="unit">unit</option>
                                        <option value="guest">guest</option>
                                        <option value="hour">hour</option>
                                        <option value="day">day</option>
                                        <option value="item">item</option>
                                        <option value="set">set</option>
                                      </select>
                                    </div>

                                    {/* Unit Price (2 cols) */}
                                    <div className="col-span-4 sm:col-span-2">
                                      <label className="block text-xs font-medium text-slate-400 mb-1">Price/Unit</label>
                                      <div className="relative">
                                        <span className="absolute left-2 top-2 text-xs text-slate-500">₹</span>
                                        <input
                                          type="number"
                                          min="0"
                                          step="100"
                                          value={item.unitPrice}
                                          onChange={(e) => updateLineItem(category, item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                          className="w-full pl-5 pr-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                      </div>
                                    </div>

                                    {/* Total + Delete (1 col) */}
                                    <div className="col-span-12 sm:col-span-1 flex items-end justify-end space-x-2">
                                      {categoryPricing[category].lineItems.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => removeLineItem(category, item.id)}
                                          className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded transition-colors"
                                        >
                                          <TrashIcon className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Auto-calculated Line Total */}
                                  {(item.quantity > 0 && item.unitPrice > 0) && (
                                    <div className="mt-3 pt-3 border-t border-slate-600/30 flex justify-between items-center">
                                      <span className="text-xs text-slate-400">
                                        {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}
                                      </span>
                                      <span className="text-sm font-bold text-orange-400">
                                        = ₹{calculateLineItemTotal(item).toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}

                              {/* Add Line Item Button */}
                              <button
                                type="button"
                                onClick={() => addLineItem(category)}
                                className="w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-300 rounded-lg transition-colors font-medium text-sm flex items-center justify-center space-x-2"
                              >
                                <PlusIcon className="h-4 w-4" />
                                <span>Add Line Item</span>
                              </button>
                            </div>

                            {/* Category Notes */}
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Additional Notes (Optional)
                              </label>
                              <textarea
                                value={categoryPricing[category]?.notes || ''}
                                onChange={(e) => updateCategoryNotes(category, e.target.value)}
                                maxLength={200}
                                rows={2}
                                placeholder="Any special considerations for this category..."
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
                              />
                              <p className="text-xs text-slate-500 mt-1 text-right">
                                {(categoryPricing[category]?.notes || '').length}/200
                              </p>
                            </div>

                            {/* Category Subtotal */}
                            {subtotal > 0 && (
                              <div className="pt-4 border-t border-slate-600/50">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-slate-400">Category Subtotal:</span>
                                  <span className="text-xl font-bold text-orange-400">
                                    ₹{subtotal.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400">No categories available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Proposal Details */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Proposal Details</h2>
                  <p className="text-sm text-slate-400">Tell them why you're the best choice</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Cover Letter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Cover Letter <span className="text-orange-400">*</span>
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => {
                      setCoverLetter(e.target.value);
                      if (errors.coverLetter) setErrors(prev => ({ ...prev, coverLetter: '' }));
                    }}
                    maxLength={500}
                    rows={4}
                    placeholder="Introduce yourself and your approach to this event..."
                    className={`w-full px-4 py-3 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none ${
                      errors.coverLetter ? 'border-red-500' : 'border-slate-700'
                    }`}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-red-400">{errors.coverLetter}</p>
                    <p className="text-xs text-slate-500">{coverLetter.length}/500</p>
                  </div>
                </div>

                {/* Why Perfect */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Why You're Perfect <span className="text-orange-400">*</span>
                  </label>
                  <textarea
                    value={whyPerfect}
                    onChange={(e) => {
                      setWhyPerfect(e.target.value);
                      if (errors.whyPerfect) setErrors(prev => ({ ...prev, whyPerfect: '' }));
                    }}
                    maxLength={200}
                    rows={3}
                    placeholder="What makes you stand out for this event?"
                    className={`w-full px-4 py-3 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none ${
                      errors.whyPerfect ? 'border-red-500' : 'border-slate-700'
                    }`}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-red-400">{errors.whyPerfect}</p>
                    <p className="text-xs text-slate-500">{whyPerfect.length}/200</p>
                  </div>
                </div>

                {/* Timeline + Advance Payment Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Timeline <span className="text-orange-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={timeline}
                      min={event.eventMemory.date}
                      onChange={(e) => {
                        setTimeline(e.target.value);
                        if (errors.timeline) setErrors(prev => ({ ...prev, timeline: '' }));
                      }}
                      className={`w-full px-4 py-3 bg-slate-900/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        errors.timeline ? 'border-red-500' : 'border-slate-700'
                      }`}
                    />
                    {errors.timeline && <p className="text-xs text-red-400 mt-1">{errors.timeline}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Advance (%) <span className="text-orange-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="5"
                      value={advancePayment}
                      onChange={(e) => {
                        setAdvancePayment(e.target.value);
                        if (errors.advancePayment) setErrors(prev => ({ ...prev, advancePayment: '' }));
                      }}
                      className={`w-full px-4 py-3 bg-slate-900/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        errors.advancePayment ? 'border-red-500' : 'border-slate-700'
                      }`}
                    />
                    {errors.advancePayment && <p className="text-xs text-red-400 mt-1">{errors.advancePayment}</p>}
                    <p className="text-xs text-slate-500 mt-1">Max 50%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
                  <PhotoIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Portfolio Links & Images</h2>
                  <p className="text-sm text-slate-400">Add up to 5 images (URLs)</p>
                </div>
              </div>

              {/* Auto-populate hint */}
              {!isEditMode && portfolioImages.some(url => url.trim() !== '') && (
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <SparklesIcon className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-300">
                      Auto-populated from your profile (website, social media, portfolio). You can edit or add more links below.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {portfolioImages.map((url, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updatePortfolioImage(index, e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {portfolioImages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePortfolioImage(index)}
                        className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}

                {portfolioImages.length < 5 && (
                  <button
                    type="button"
                    onClick={addPortfolioImage}
                    className="w-full px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-300 rounded-lg transition-colors font-medium"
                  >
                    + Add Image
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Right: Running Total Sidebar (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Total Summary Card */}
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-b border-orange-500/30 p-4">
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <CurrencyRupeeIcon className="h-5 w-5 text-orange-400" />
                    <span>Proposal Summary</span>
                  </h3>
                </div>

                <div className="p-5 space-y-4">
                  {/* Category Breakdown */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categories</p>
                    {categories.map(category => {
                      const subtotal = calculateCategorySubtotal(category);
                      if (subtotal === 0) return null;
                      return (
                        <div key={category} className="flex justify-between items-center text-sm">
                          <span className="text-slate-300">{formatCategoryName(category)}</span>
                          <span className="font-semibold text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                        </div>
                      );
                    })}
                    {Object.keys(categoryPricing).every(cat => calculateCategorySubtotal(cat) === 0) && (
                      <p className="text-sm text-slate-500 italic">No pricing added yet</p>
                    )}
                  </div>

                  <div className="border-t border-slate-600/50 pt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Subtotal</span>
                      <span className="text-base font-semibold text-white">
                        ₹{calculateGrandTotal().toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">GST (18%)</span>
                      <span className="text-base font-semibold text-white">
                        ₹{calculateTaxes().toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-orange-500/30 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-medium text-slate-300">Total</span>
                      <span className="text-2xl font-bold text-orange-400">
                        ₹{calculateFinalTotal().toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Advance Payment Calculation */}
                  {parseFloat(advancePayment) > 0 && calculateFinalTotal() > 0 && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-blue-300 font-medium">Advance ({advancePayment}%)</p>
                          <p className="text-xs text-blue-200/60 mt-0.5">Due on booking</p>
                        </div>
                        <p className="text-lg font-bold text-blue-400">
                          ₹{calculateAdvanceAmount().toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={submitting || calculateGrandTotal() === 0}
                    className={`w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg ${
                      submitting || calculateGrandTotal() === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{isEditMode ? 'Updating...' : 'Submitting...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5" />
                        <span>{isEditMode ? 'Update Proposal' : 'Submit Proposal'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Tips Card */}
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start space-x-2">
                  <LightBulbIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-300 mb-2">Pro Tips</p>
                    <ul className="text-xs text-blue-200/80 space-y-1.5">
                      <li>• Break down pricing by line items for clarity</li>
                      <li>• Use market rate guidance to stay competitive</li>
                      <li>• Add detailed descriptions to justify costs</li>
                      <li>• Include buffer for unexpected expenses</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-emerald-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3">
            <CheckCircleIcon className="h-6 w-6" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
