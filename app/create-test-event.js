// EventFoundry - Create Rich Test Event with Detailed Requirements
// Run this script in your browser console to create a test event

(function createRichTestEvent() {
  // Create rich test event with detailed requirements
  const mockEvent = {
    eventId: 'event-test-rich-' + Date.now(),
    eventMemory: {
      event_type: 'Wedding',
      date: '2026-03-15',
      location: 'Mumbai, Juhu Beach',
      guest_count: '250',
      venue_status: 'booked'
    },

    checklistData: {
      selections: {
        'Catering': {
          'menu_type': 'Vegetarian',
          'courses': '3-course dinner',
          'beverages': 'Welcome drinks',
          'live_counters': 'Yes'
        },
        'Decoration': {
          'theme': 'Beach + Traditional',
          'stage': 'Yes',
          'entrance': 'Archway',
          'florals': 'Premium'
        },
        'Entertainment': {
          'live_band': 'Yes',
          'dj': 'Yes',
          'sound_system': 'Premium'
        },
        'Photography': {
          'pre_wedding': 'Yes',
          'wedding_day': 'Full coverage',
          'video': 'Cinematic',
          'drone': 'Yes'
        },
        'Logistics': {
          'transportation': 'Shuttle service',
          'accommodation': 'Hotel blocks',
          'coordination': 'Full service'
        }
      },
      notes: {
        'Catering': 'Strictly vegetarian menu required. Must include Jain-friendly options for 30 guests (no onion/garlic). Need live dosa counter and chaat station. This is critical for our event.',
        'Decoration': 'Beach theme with traditional Indian touch. Colors must be gold, ivory, and coral pink. Must incorporate marigolds. Need weather backup plan for rain - this is essential.',
        'Entertainment': 'Need live band for ceremony (classical Indian music). DJ for reception (Bollywood + international). Must handle beach acoustics. Noise curfew at 11 PM - this is mandatory.',
        'Photography': 'Want beach sunset photos. Need drone clearance arranged by vendor. Would prefer delivery of edited photos within 2 weeks, video within 4 weeks.',
        'Logistics': '50 outstation guests need hotel accommodation. Shuttle service required from 3 pickup points to venue.'
      }
    },

    additionalNotes: 'This is our dream wedding and we want it to be perfect. Budget is flexible for the right event company. Most important: smooth coordination and backup plans for weather. We are first-time event planners so need guidance throughout the process. Please ensure all vendors are coordinated by one point of contact.',

    referenceImages: [
      'https://images.unsplash.com/photo-1519167758481-83f29da8c3b8?w=800',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800'
    ],

    status: 'open',
    postedAt: new Date().toISOString(),
    bids: []
  };

  // Save to posted_events
  const events = JSON.parse(localStorage.getItem('posted_events') || '[]');

  // Check if test event already exists
  const existingIndex = events.findIndex(e => e.eventId && e.eventId.startsWith('event-test-rich-'));
  if (existingIndex >= 0) {
    // Replace existing test event
    events[existingIndex] = mockEvent;
    console.log('📝 Updated existing test event');
  } else {
    // Add new test event
    events.push(mockEvent);
    console.log('✅ Created new test event');
  }

  localStorage.setItem('posted_events', JSON.stringify(events));

  console.log('');
  console.log('🎉 Rich test event created successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Event ID:', mockEvent.eventId);
  console.log('Event Type:', mockEvent.eventMemory.event_type);
  console.log('Location:', mockEvent.eventMemory.location);
  console.log('Guest Count:', mockEvent.eventMemory.guest_count);
  console.log('Categories with Requirements:', Object.keys(mockEvent.checklistData.notes).length);
  console.log('Reference Images:', mockEvent.referenceImages.length);
  console.log('');
  console.log('🔗 Navigate to:');
  console.log('   /craftsmen/events/' + mockEvent.eventId);
  console.log('');
  console.log('📋 Test Features:');
  console.log('   ✅ Priority-based highlighting (must, required, essential)');
  console.log('   ✅ Keyword highlighting in text');
  console.log('   ✅ Requirements acknowledgment checklist');
  console.log('   ✅ Overall notes section');
  console.log('   ✅ Reference images gallery');
  console.log('   ✅ Category-based expandable sections');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return mockEvent;
})();
