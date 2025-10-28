/**
 * Development Mode Helpers
 * Pre-populate test data for faster development and testing
 */

export const isDevelopment = process.env.NODE_ENV === 'development';

export const DEV_TEST_VENDORS = [
  {
    id: 'vnd_dev_001',
    companyInfo: {
      companyName: 'Kerala Events Pro',
      businessType: 'Private Limited',
      yearsInBusiness: '8',
      gstNumber: '32AAAAA0000A1Z5',
      website: 'https://keralaeventspro.com'
    },
    contactInfo: {
      contactName: 'Rajesh Kumar',
      designation: 'Founder & CEO',
      mobile: '9999999991',
      whatsapp: '9999999991',
      email: 'vendor1@test.com',
      address: 'MG Road, Kochi, Kerala - 682001'
    },
    services: {
      serviceAreas: ['Kochi/Ernakulam', 'Thiruvananthapuram', 'All Kerala'],
      eventTypes: ['Destination Weddings', 'Traditional Weddings', 'Corporate Events & Conferences'],
      eventCapacity: 'all_sizes',
      teamSize: '25',
      description: 'Full-service event management company specializing in weddings and corporate events across Kerala.'
    },
    portfolio: {
      images: [],
      notableEvents: 'Tech Summit 2024 (500 guests), Luxury Wedding at Backwaters (300 guests)',
      testimonials: 'Excellent service and attention to detail - Client XYZ',
      hasInsurance: true,
      monthlyCapacity: '8',
      acceptedTerms: true
    },
    status: 'approved',
    approvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'vnd_dev_002',
    companyInfo: {
      companyName: 'Malabar Event Masters',
      businessType: 'Partnership',
      yearsInBusiness: '12',
      gstNumber: '32BBBBB0000B1Z5',
      website: 'https://malabareventmasters.com'
    },
    contactInfo: {
      contactName: 'Priya Menon',
      designation: 'Operations Manager',
      mobile: '9999999992',
      whatsapp: '9999999992',
      email: 'vendor2@test.com',
      address: 'Calicut Road, Kozhikode, Kerala - 673001'
    },
    services: {
      serviceAreas: ['Kozhikode', 'Kannur', 'Thrissur'],
      eventTypes: ['Cultural Events & Festivals', 'Social Celebrations (Birthdays, Anniversaries)', 'Traditional Weddings'],
      eventCapacity: 'large',
      teamSize: '18',
      description: 'Specializing in traditional Kerala events and cultural festivals with authentic touch.'
    },
    portfolio: {
      images: [],
      notableEvents: 'Onam Festival 2024 (800 guests), Traditional Wedding Series',
      testimonials: 'Best traditional event organizers in Kerala',
      hasInsurance: true,
      monthlyCapacity: '6',
      acceptedTerms: true
    },
    status: 'approved',
    approvedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'vnd_dev_003',
    companyInfo: {
      companyName: 'South India Event Solutions',
      businessType: 'Private Limited',
      yearsInBusiness: '5',
      gstNumber: '32CCCCC0000C1Z5',
      website: 'https://sievents.com'
    },
    contactInfo: {
      contactName: 'Arun Krishnan',
      designation: 'Director',
      mobile: '9999999993',
      whatsapp: '9999999993',
      email: 'vendor3@test.com',
      address: 'Statue Junction, Thiruvananthapuram, Kerala - 695001'
    },
    services: {
      serviceAreas: ['Thiruvananthapuram', 'Kollam', 'All Kerala'],
      eventTypes: ['Corporate Events & Conferences', 'Product Launches', 'Destination Weddings'],
      eventCapacity: 'very_large',
      teamSize: '30',
      description: 'Corporate event specialists with pan-Kerala presence and international standards.'
    },
    portfolio: {
      images: [],
      notableEvents: 'Annual Tech Conference (600 guests), Luxury Product Launch',
      testimonials: 'Professional and reliable - Corporate Client ABC',
      hasInsurance: true,
      monthlyCapacity: '10',
      acceptedTerms: true
    },
    status: 'approved',
    approvedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const DEV_TEST_EVENTS = [
  {
    id: 'evt_dev_001',
    title: 'Grand Destination Wedding in Kochi',
    eventType: 'Destination Wedding',
    date: '2025-08-15',
    location: 'Kochi, Kerala',
    city: 'Kochi',
    guestCount: 300,
    budgetRange: '₹12-18L',
    status: 'open',
    postedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    bidsCount: 4,
    description: 'Looking for full-service event management for a 3-day luxury destination wedding at Kochi backwaters. Includes accommodation, catering, entertainment, and decor.'
  },
  {
    id: 'evt_dev_002',
    title: 'Tech Company Annual Summit',
    eventType: 'Corporate Event',
    date: '2025-09-20',
    location: 'Thiruvananthapuram, Kerala',
    city: 'Thiruvananthapuram',
    guestCount: 500,
    budgetRange: '₹20-25L',
    status: 'open',
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    bidsCount: 7,
    description: '2-day corporate tech summit with keynote speakers, breakout sessions, networking events, and gala dinner. Requires AV setup, stage management, and hospitality.'
  }
];

/**
 * Initialize development test data
 * Call this on app initialization in development mode
 */
export const initDevData = () => {
  if (!isDevelopment) return;

  // Check if already initialized
  const devInitialized = localStorage.getItem('dev_data_initialized');
  if (devInitialized === 'true') return;

  // Initialize active vendors
  const existingVendors = JSON.parse(localStorage.getItem('active_vendors') || '[]');
  if (existingVendors.length === 0) {
    localStorage.setItem('active_vendors', JSON.stringify(DEV_TEST_VENDORS));
    console.log('✅ DEV: Initialized test vendor accounts');
  }

  // Initialize posted events
  const existingEvents = JSON.parse(localStorage.getItem('posted_events') || '[]');
  if (existingEvents.length === 0) {
    localStorage.setItem('posted_events', JSON.stringify(DEV_TEST_EVENTS));
    console.log('✅ DEV: Initialized test events');
  }

  // Mark as initialized
  localStorage.setItem('dev_data_initialized', 'true');

  console.log('🚀 DEV MODE ACTIVE');
  console.log('Test credentials:');
  console.log('  Email: vendor1@test.com, Mobile: 9999999991');
  console.log('  Email: vendor2@test.com, Mobile: 9999999992');
  console.log('  Email: vendor3@test.com, Mobile: 9999999993');
  console.log('Quick login: Add ?dev=true to dashboard URL');
};

/**
 * Create auto-login session for development
 * Use vendorId from test vendors
 */
export const createDevSession = (vendorId: string = 'vnd_dev_001') => {
  if (!isDevelopment) return false;

  const vendors = JSON.parse(localStorage.getItem('active_vendors') || '[]');
  const vendor = vendors.find((v: any) => v.id === vendorId);

  if (!vendor) {
    console.error('❌ DEV: Vendor not found:', vendorId);
    return false;
  }

  const session = {
    vendorId: vendor.id,
    email: vendor.contactInfo.email,
    companyName: vendor.companyInfo.companyName,
    loginTime: new Date().toISOString()
  };

  localStorage.setItem('vendor_session', JSON.stringify(session));
  console.log('✅ DEV: Auto-login session created for:', vendor.companyInfo.companyName);
  return true;
};

/**
 * Check URL params for dev mode bypass
 */
export const checkDevBypass = () => {
  if (!isDevelopment) return false;

  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  const devMode = params.get('dev');

  if (devMode === 'true') {
    createDevSession();
    return true;
  }

  return false;
};

/**
 * Clear all dev data (useful for testing fresh state)
 */
export const clearDevData = () => {
  if (!isDevelopment) return;

  localStorage.removeItem('active_vendors');
  localStorage.removeItem('posted_events');
  localStorage.removeItem('vendor_signups');
  localStorage.removeItem('vendor_bids');
  localStorage.removeItem('vendor_session');
  localStorage.removeItem('dev_data_initialized');

  console.log('🗑️ DEV: All test data cleared');
};

// Expose helper functions to window for console access in dev
if (isDevelopment && typeof window !== 'undefined') {
  (window as any).devHelpers = {
    initDevData,
    createDevSession,
    clearDevData,
    testVendors: DEV_TEST_VENDORS,
    testEvents: DEV_TEST_EVENTS
  };
}
