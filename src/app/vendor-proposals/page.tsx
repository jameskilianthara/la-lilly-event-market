'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  MapPin,
  Calendar,
  Users,
  Phone,
  Mail,
  ExternalLink,
  Award,
  Clock,
  Filter,
  ChevronDown,
  Heart,
  Share2,
  MessageCircle
} from 'lucide-react';
import ProgressIndicator from '../../components/ProgressIndicator';
import { VENDOR_PROFILES, VendorProfile } from '../../data/vendorProfiles';

interface ChecklistItem {
  name: string;
  checked: boolean;
  customNote?: string;
  category?: string;
  subcategory?: string;
}

interface ChecklistSubcategory {
  name: string;
  items: ChecklistItem[];
  customItems: ChecklistItem[];
}

interface ChecklistCategory {
  name: string;
  subcategories: ChecklistSubcategory[];
}

interface ChecklistData {
  categories: ChecklistCategory[];
}

interface EventMemory {
  event_type: string;
  date: string;
  location: string;
  guest_count: string;
  venue_status: string;
  checklist_data?: ChecklistData;
}

interface VendorProposal {
  vendor: {
    id: string;
    companyName: string;
    ownerName: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    services: string[];
    experience: string;
    portfolio: string;
    description: string;
    rating: number;
    reviewCount: number;
    completedProjects: number;
    responseTime: string;
    profileImage?: string;
  };
  proposal: {
    totalCost: number;
    items: {
      category: string;
      service: string;
      quantity: number;
      unitPrice: number;
      total: number;
      notes?: string;
    }[];
    timeline: string;
    termsAndConditions: string;
    validUntil: string;
    isNegotiable: boolean;
  };
  matchScore: number;
  featured: boolean;
}

// Generate comprehensive proposals from vendor profiles based on selected checklist items
const generateProposalFromVendor = (vendor: VendorProfile, eventType: string, guestCount: string, checklistItems: ChecklistItem[] = []): VendorProposal => {
  const guests = parseInt(guestCount) || 150;
  
  // Select appropriate package based on guest count and event type
  let selectedPackage = vendor.packageOptions[0]; // Default to first package
  if (guests > 200) {
    selectedPackage = vendor.packageOptions[vendor.packageOptions.length - 1]; // Premium for large events
  } else if (guests > 100) {
    selectedPackage = vendor.packageOptions[Math.min(1, vendor.packageOptions.length - 1)]; // Mid-tier
  }

  // Create service mapping based on checklist items
  const serviceMapping = {
    // Venue & Decor services
    'venue': 'Venue Management & Coordination',
    'decoration': 'Complete Event Decoration',
    'stage': 'Stage Design & Setup',
    'mandap': 'Mandap Design & Installation',
    'lighting': 'Professional Lighting Design',
    'floral': 'Floral Arrangements & Decor',
    'entrance': 'Entrance & Reception Decor',
    'seating': 'Seating Arrangement & Setup',
    
    // Catering & Food services
    'catering': 'Complete Catering Services',
    'menu': 'Menu Planning & Execution',
    'bar': 'Bar Setup & Service',
    'cake': 'Wedding Cake & Desserts',
    'breakfast': 'Breakfast Service',
    'lunch': 'Lunch Service', 
    'dinner': 'Dinner Service',
    'snacks': 'Snacks & Refreshments',
    
    // Photography & Video services
    'photography': 'Professional Photography',
    'videography': 'Wedding Videography',
    'candid': 'Candid Photography',
    'pre-wedding': 'Pre-wedding Shoot',
    'drone': 'Drone Photography & Video',
    'album': 'Wedding Album Design',
    'editing': 'Video Editing & Production',
    
    // Entertainment & Music services
    'dj': 'DJ Services & Sound System',
    'band': 'Live Music & Band',
    'sound': 'Sound System Setup',
    'music': 'Music Coordination',
    'dance': 'Dance Performance Coordination',
    'entertainment': 'Entertainment Management',
    
    // Transportation & Logistics
    'transport': 'Guest Transportation',
    'accommodation': 'Guest Accommodation Coordination',
    'parking': 'Parking Management',
    'security': 'Event Security Services',
    'coordination': 'Day-of Event Coordination',
    
    // Beauty & Styling
    'makeup': 'Bridal Makeup & Styling',
    'hair': 'Hair Styling Services',
    'mehendi': 'Mehendi Artist Coordination',
    'costume': 'Costume & Attire Coordination',
    
    // Documentation & Legal
    'invitation': 'Invitation Design & Printing',
    'permits': 'Permits & Legal Documentation',
    'insurance': 'Event Insurance Coordination',
    
    // Additional Services
    'gifts': 'Guest Gifts & Favors',
    'welcome': 'Guest Welcome Services',
    'cleanup': 'Post-event Cleanup',
    'backup': 'Backup & Contingency Planning'
  };

  // Generate proposal items based on selected checklist items
  const proposalItems = [];
  let totalCost = 0;
  
  if (checklistItems.length > 0) {
    // Match checklist items to services
    const matchedServices = new Set();
    
    checklistItems.forEach(item => {
      const itemName = item.name.toLowerCase();
      
      // Find matching services
      for (const [key, serviceName] of Object.entries(serviceMapping)) {
        if (itemName.includes(key) && !matchedServices.has(serviceName)) {
          matchedServices.add(serviceName);
          
          // Calculate pricing based on service type and guest count
          let basePrice = selectedPackage.price * 0.1; // Base 10% of package price
          let quantity = 1;
          
          // Adjust pricing for specific services
          if (key.includes('catering') || key.includes('food') || key.includes('menu')) {
            quantity = guests;
            basePrice = Math.floor(selectedPackage.price * 0.3 / guests); // 30% of package for catering
          } else if (key.includes('photography') || key.includes('video')) {
            basePrice = selectedPackage.price * 0.15; // 15% for photo/video
          } else if (key.includes('decoration') || key.includes('venue')) {
            basePrice = selectedPackage.price * 0.2; // 20% for venue/decor
          } else if (key.includes('music') || key.includes('dj') || key.includes('entertainment')) {
            basePrice = selectedPackage.price * 0.08; // 8% for entertainment
          }
          
          const itemTotal = basePrice * quantity;
          totalCost += itemTotal;
          
          proposalItems.push({
            category: item.category || 'Event Services',
            service: serviceName,
            quantity,
            unitPrice: basePrice,
            total: itemTotal,
            notes: item.customNote || `${serviceName} as per checklist requirements`
          });
        }
      }
    });
  }
  
  // If no specific items matched, use default comprehensive services
  if (proposalItems.length === 0) {
    vendor.services.forEach((service, index) => {
      const basePrice = selectedPackage.price * 0.15 * (index + 1);
      const quantity = service.toLowerCase().includes('catering') ? guests : 1;
      const unitPrice = service.toLowerCase().includes('catering') ? basePrice / guests : basePrice;
      
      proposalItems.push({
        category: service.includes('Wedding Planning') ? 'Event Management' : 
                 service.includes('Photography') ? 'Photography & Video' :
                 service.includes('Venue') ? 'Venue & Decor' :
                 service.includes('Catering') ? 'Catering & Food' : 'Additional Services',
        service,
        quantity,
        unitPrice,
        total: basePrice,
        notes: index === 0 ? `Complete ${eventType.toLowerCase()} service included` : undefined
      });
    });
    totalCost = selectedPackage.price;
  }

  // Add coordination fee if not included
  if (!proposalItems.some(item => item.service.toLowerCase().includes('coordination'))) {
    const coordinationFee = totalCost * 0.1;
    proposalItems.push({
      category: 'Event Management',
      service: 'Event Coordination & Management',
      quantity: 1,
      unitPrice: coordinationFee,
      total: coordinationFee,
      notes: 'Complete event coordination and on-day management'
    });
    totalCost += coordinationFee;
  }

  // Calculate match score based on how many checklist items we can fulfill
  const checklistItemCount = checklistItems.length;
  const fulfilledItemCount = proposalItems.length;
  const baseMatchScore = checklistItemCount > 0 ? 
    Math.min(95, 60 + (fulfilledItemCount / checklistItemCount * 30)) : 80;
  const matchScore = Math.min(95, baseMatchScore + (vendor.rating - 4) * 5 + Math.random() * 5);

  return {
    vendor: {
      id: vendor.id,
      companyName: vendor.companyName,
      ownerName: vendor.ownerName,
      email: vendor.email,
      phone: vendor.phone,
      city: vendor.city,
      state: vendor.state,
      services: vendor.services,
      experience: vendor.experience,
      portfolio: vendor.website || '',
      description: vendor.description,
      rating: vendor.rating,
      reviewCount: vendor.reviewCount,
      completedProjects: vendor.completedProjects,
      responseTime: vendor.responseTime,
      profileImage: vendor.profileImage
    },
    proposal: {
      totalCost: Math.round(totalCost),
      items: proposalItems,
      timeline: vendor.availability.bookingLead,
      termsAndConditions: '40% advance, 40% before event, 20% on completion. Includes coordination and management.',
      validUntil: '14 days from proposal date',
      isNegotiable: true
    },
    matchScore: Math.round(matchScore),
    featured: vendor.rating >= 4.7 && vendor.completedProjects > 50
  };
};

// User Journey Steps
const JOURNEY_STEPS = [
  { id: 'planning', name: 'Planning', description: 'Event details' },
  { id: 'checklist', name: 'Checklist', description: 'Requirements' },
  { id: 'proposals', name: 'Proposals', description: 'Vendor bids' },
  { id: 'selection', name: 'Selection', description: 'Final choice' }
];

export default function VendorProposalsPage() {
  const [eventMemory, setEventMemory] = useState<EventMemory | null>(null);
  const [proposals, setProposals] = useState<VendorProposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<VendorProposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<VendorProposal | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'match' | 'price' | 'rating'>('match');
  const [showFilters, setShowFilters] = useState(false);
  const [_budgetRange, _setBudgetRange] = useState<[number, number]>([0, 1000000]);
  const [_selectedServices, _setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    // Load event memory
    const saved = localStorage.getItem('lalilly-event-memory');
    if (!saved) {
      window.location.href = '/plan';
      return;
    }

    const memory: EventMemory = JSON.parse(saved);
    setEventMemory(memory);

    // Extract selected checklist items from the memory
    const selectedChecklistItems: ChecklistItem[] = [];
    if (memory.checklist_data && memory.checklist_data.categories) {
      memory.checklist_data.categories.forEach(category => {
        category.subcategories.forEach(subcategory => {
          // Add checked items from regular items
          subcategory.items.filter(item => item.checked).forEach(item => {
            selectedChecklistItems.push({
              ...item,
              category: category.name,
              subcategory: subcategory.name
            });
          });
          
          // Add checked items from custom items
          subcategory.customItems.filter(item => item.checked).forEach(item => {
            selectedChecklistItems.push({
              ...item,
              category: category.name,
              subcategory: subcategory.name
            });
          });
        });
      });
    }

    // Generate proposals from all vendor profiles using selected checklist items
    const allProposals = VENDOR_PROFILES.map(vendor => 
      generateProposalFromVendor(vendor, memory.event_type, memory.guest_count, selectedChecklistItems)
    );

    // Filter by location with flexible matching
    const locationFilter = memory.location.toLowerCase();
    const cityFromLocation = locationFilter.split(',')[0].trim();
    
    let relevantProposals = allProposals;
    
    // Try to match city, but if no matches found, show all (companies can travel)
    const cityMatchedProposals = allProposals.filter(proposal => {
      const vendorCity = proposal.vendor.city.toLowerCase();
      const vendorState = proposal.vendor.state.toLowerCase();
      return vendorCity.includes(cityFromLocation) || 
             cityFromLocation.includes(vendorCity) ||
             vendorState.includes(locationFilter) ||
             locationFilter.includes(vendorState);
    });
    
    if (cityMatchedProposals.length > 0) {
      relevantProposals = cityMatchedProposals;
    }
    
    // Sort by match score and featured status
    relevantProposals.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.matchScore - a.matchScore;
    });
    
    setProposals(relevantProposals);
    setFilteredProposals(relevantProposals);
  }, []);

  const handleSort = (newSortBy: 'match' | 'price' | 'rating') => {
    setSortBy(newSortBy);
    const sorted = [...filteredProposals].sort((a, b) => {
      switch (newSortBy) {
        case 'match':
          return b.matchScore - a.matchScore;
        case 'price':
          return a.proposal.totalCost - b.proposal.totalCost;
        case 'rating':
          return b.vendor.rating - a.vendor.rating;
        default:
          return 0;
      }
    });
    setFilteredProposals(sorted);
  };

  const toggleFavorite = (vendorId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(vendorId)) {
      newFavorites.delete(vendorId);
    } else {
      newFavorites.add(vendorId);
    }
    setFavorites(newFavorites);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!eventMemory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading your vendor proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white pt-16">

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <ProgressIndicator 
            steps={JOURNEY_STEPS}
            currentStep="proposals"
            completedSteps={['planning', 'checklist']}
          />
        </div>

        {/* Event Summary */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Event Management Proposals for Your {eventMemory.event_type}</h1>
              <div className="flex items-center gap-4 text-blue-100">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {eventMemory.date}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {eventMemory.location}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {eventMemory.guest_count} guests
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{filteredProposals.length}</div>
              <div className="text-blue-100">Matched Event Companies</div>
            </div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:border-blue-400 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value as 'match' | 'price' | 'rating')}
                className="px-3 py-2 border border-neutral-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="match">Best Match</option>
                <option value="price">Lowest Price</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-neutral-600">
            Showing {filteredProposals.length} of {proposals.length} vendors
          </div>
        </div>

        {/* Event Company Proposals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProposals.map((proposalData) => (
            <motion.div
              key={proposalData.vendor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-2xl border transition-all duration-300 hover:shadow-xl overflow-hidden ${
                proposalData.featured 
                  ? 'border-blue-400 ring-2 ring-blue-100 shadow-lg' 
                  : 'border-neutral-200 hover:border-blue-300'
              }`}
            >
              {proposalData.featured && (
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 text-sm font-medium">
                  ⭐ Featured Partner
                </div>
              )}

              <div className="p-6">
                {/* Company Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-neutral-900">{proposalData.vendor.companyName}</h3>
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs">
                        <Star className="w-3 h-3 fill-current" />
                        {proposalData.vendor.rating}
                      </div>
                    </div>
                    <p className="text-sm text-neutral-600 mb-1">by {proposalData.vendor.ownerName}</p>
                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      <span>{proposalData.vendor.reviewCount} reviews</span>
                      <span>•</span>
                      <span>{proposalData.vendor.completedProjects} projects</span>
                      <span>•</span>
                      <span>Responds in {proposalData.vendor.responseTime}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFavorite(proposalData.vendor.id)}
                    className={`p-2 rounded-full transition-colors ${
                      favorites.has(proposalData.vendor.id)
                        ? 'bg-red-100 text-red-600'
                        : 'bg-neutral-100 text-neutral-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${favorites.has(proposalData.vendor.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Match Score */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-neutral-600">Match Score</span>
                    <span className="font-medium text-blue-600">{proposalData.matchScore}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${proposalData.matchScore}%` }}
                    />
                  </div>
                </div>

                {/* Services */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {proposalData.vendor.services.slice(0, 3).map(service => (
                      <span key={service} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg">
                        {service}
                      </span>
                    ))}
                    {proposalData.vendor.services.length > 3 && (
                      <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-lg">
                        +{proposalData.vendor.services.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Proposal Summary */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-600">Total Proposal</span>
                    <div className="text-right">
                      <div className="font-bold text-lg text-neutral-900">
                        {formatCurrency(proposalData.proposal.totalCost)}
                      </div>
                      {proposalData.proposal.isNegotiable && (
                        <span className="text-xs text-green-600">Negotiable</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500 mb-2">
                    {proposalData.proposal.items.length} services • Valid for {proposalData.proposal.validUntil}
                  </div>
                  <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                    ✓ Covers your checklist requirements
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setSelectedProposal(proposalData)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 text-sm"
                  >
                    View Details
                  </button>
                  <button 
                    title="Contact Company"
                    className="px-4 py-3 border border-neutral-300 text-neutral-700 rounded-xl font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button 
                    title="Share Proposal"
                    className="px-4 py-3 border border-neutral-300 text-neutral-700 rounded-xl font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 text-sm"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProposals.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Event Companies Found</h3>
            <p className="text-neutral-600 mb-4">
              We couldn&apos;t find any event management companies matching your criteria in {eventMemory.location}. Our partner companies can travel to your location for comprehensive event services.
            </p>
            <Link
              href="/checklist"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Checklist
            </Link>
          </div>
        )}

        {/* Proposal Detail Modal */}
        <AnimatePresence>
          {selectedProposal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedProposal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b border-neutral-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-2">
                        {selectedProposal.vendor.companyName}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-neutral-600">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          {selectedProposal.vendor.rating} ({selectedProposal.vendor.reviewCount} reviews)
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {selectedProposal.vendor.city}, {selectedProposal.vendor.state}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {selectedProposal.vendor.responseTime}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedProposal(null)}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Proposal Details */}
                    <div className="lg:col-span-2">
                      <h4 className="font-semibold text-neutral-900 mb-4">Detailed Proposal</h4>
                      <div className="space-y-3">
                        {selectedProposal.proposal.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-neutral-900">{item.service}</div>
                              <div className="text-sm text-neutral-600">{item.category}</div>
                              {item.notes && (
                                <div className="text-xs text-neutral-500 mt-1">{item.notes}</div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-neutral-900">
                                {formatCurrency(item.total)}
                              </div>
                              {item.quantity > 1 && (
                                <div className="text-xs text-neutral-500">
                                  {item.quantity} × {formatCurrency(item.unitPrice)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        <div className="border-t border-neutral-200 pt-3">
                          <div className="flex items-center justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="text-blue-600">
                              {formatCurrency(selectedProposal.proposal.totalCost)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Company Info */}
                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-4">Company Information</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-neutral-600 mb-1">About</div>
                          <p className="text-sm text-neutral-900">{selectedProposal.vendor.description}</p>
                        </div>
                        
                        <div>
                          <div className="text-sm text-neutral-600 mb-1">Experience</div>
                          <p className="text-sm text-neutral-900">{selectedProposal.vendor.experience} years</p>
                        </div>
                        
                        <div>
                          <div className="text-sm text-neutral-600 mb-1">Contact</div>
                          <div className="space-y-2">
                            <a
                              href={`mailto:${selectedProposal.vendor.email}`}
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              <Mail className="w-4 h-4" />
                              {selectedProposal.vendor.email}
                            </a>
                            <a
                              href={`tel:${selectedProposal.vendor.phone}`}
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              <Phone className="w-4 h-4" />
                              {selectedProposal.vendor.phone}
                            </a>
                            {selectedProposal.vendor.portfolio && (
                              <a
                                href={selectedProposal.vendor.portfolio}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                              >
                                <ExternalLink className="w-4 h-4" />
                                View Portfolio
                              </a>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-neutral-600 mb-2">Services</div>
                          <div className="flex flex-wrap gap-1">
                            {selectedProposal.vendor.services.map(service => (
                              <span key={service} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Terms */}
                  <div className="mt-6 pt-6 border-t border-neutral-200">
                    <h4 className="font-semibold text-neutral-900 mb-2">Terms & Conditions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-neutral-600">Payment:</span> {selectedProposal.proposal.termsAndConditions}
                      </div>
                      <div>
                        <span className="text-neutral-600">Timeline:</span> {selectedProposal.proposal.timeline}
                      </div>
                      <div>
                        <span className="text-neutral-600">Valid Until:</span> {selectedProposal.proposal.validUntil}
                      </div>
                      <div>
                        <span className="text-neutral-600">Negotiable:</span> {selectedProposal.proposal.isNegotiable ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t border-neutral-200 flex gap-3">
                  <button
                    onClick={() => setSelectedProposal(null)}
                    className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-700 rounded-xl font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                  >
                    Close
                  </button>
                  <button className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105">
                    Accept Proposal
                  </button>
                  <button className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105">
                    Contact Company
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}