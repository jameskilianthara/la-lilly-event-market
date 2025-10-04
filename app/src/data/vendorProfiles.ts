// Comprehensive event management companies - End-to-end service providers

export interface VendorProfile {
  id: string;
  companyName: string;
  ownerName: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  website?: string;
  city: string;
  state: string;
  services: string[];
  specialties: string[];
  experience: string;
  rating: number;
  reviewCount: number;
  completedProjects: number;
  responseTime: string;
  startingPrice: number;
  profileImage: string;
  portfolioImages: {
    id: string;
    url: string;
    title: string;
    description: string;
    category: string;
    eventType: string;
  }[];
  reviews: {
    id: string;
    clientName: string;
    rating: number;
    comment: string;
    eventType: string;
    date: string;
  }[];
  certifications: string[];
  awards: string[];
  socialMedia: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
  };
  availability: {
    nextAvailable: string;
    bookingLead: string;
  };
  packageOptions: {
    name: string;
    price: number;
    description: string;
    includes: string[];
  }[];
}

export const VENDOR_PROFILES: VendorProfile[] = [
  {
    id: 'vendor-001',
    companyName: 'Royal Events Mumbai',
    ownerName: 'Priya Sharma',
    tagline: 'Complete Wedding & Event Management Solutions',
    description: 'Royal Events Mumbai is a full-service event management company specializing in end-to-end wedding and celebration planning. We handle everything from venue selection and decor to catering, photography, entertainment, and coordination - ensuring a seamless, stress-free experience for our clients. With over 8 years of expertise and a network of trusted partners, we deliver exceptional results.',
    email: 'priya@royaleventsmumbai.com',
    phone: '+91 98765 43210',
    website: 'https://royaleventsmumbai.com',
    city: 'Mumbai',
    state: 'Maharashtra',
    services: ['Complete Wedding Planning', 'End-to-End Event Coordination', 'Venue & Vendor Management', 'Day-of Coordination', 'Destination Wedding Planning'],
    specialties: ['Traditional Indian Weddings', 'Destination Weddings', 'Corporate Events', 'Luxury Celebrations'],
    experience: '8+ years',
    rating: 4.8,
    reviewCount: 127,
    completedProjects: 89,
    responseTime: '< 2 hours',
    startingPrice: 250000,
    profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    portfolioImages: [
      {
        id: 'img-001',
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
        title: 'Grand Palace Wedding',
        description: 'Complete end-to-end wedding planning with luxury mandap, catering for 500 guests, photography, and entertainment',
        category: 'Wedding Management',
        eventType: 'Wedding'
      },
      {
        id: 'img-002',
        url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
        title: 'Destination Wedding Coordination',
        description: 'Full destination wedding management including travel, accommodation, and event coordination',
        category: 'Destination Management',
        eventType: 'Wedding'
      },
      {
        id: 'img-003',
        url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=800',
        title: 'Corporate Event Management',
        description: 'Complete corporate event planning including venue, catering, AV setup, and guest management',
        category: 'Corporate Events',
        eventType: 'Corporate'
      },
      {
        id: 'img-004',
        url: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800',
        title: 'Reception Coordination',
        description: 'Evening reception planning with entertainment, dining, and guest coordination services',
        category: 'Reception Management',
        eventType: 'Wedding'
      },
      {
        id: 'img-005',
        url: 'https://images.unsplash.com/photo-1546450840-ecad7367cc93?w=800',
        title: 'Luxury Event Setup',
        description: 'Premium event management with high-end decor, gourmet catering, and VIP services',
        category: 'Luxury Events',
        eventType: 'Celebration'
      }
    ],
    reviews: [
      {
        id: 'rev-001',
        clientName: 'Aditi & Vikram',
        rating: 5,
        comment: 'Royal Events made our wedding absolutely perfect! They handled everything from venue booking to the last dance. Professional, reliable, and creative team.',
        eventType: 'Wedding',
        date: '2024-01-15'
      },
      {
        id: 'rev-002',
        clientName: 'TechCorp Solutions',
        rating: 5,
        comment: 'Exceptional corporate event management. They coordinated our annual conference flawlessly - from logistics to catering to entertainment.',
        eventType: 'Corporate Conference',
        date: '2024-02-08'
      }
    ],
    certifications: ['Certified Wedding Planner', 'Event Management Professional', 'Hospitality Management'],
    awards: ['Best Wedding Planner 2023 - Mumbai', 'Excellence in Event Management'],
    socialMedia: {
      instagram: '@royaleventsmumbai',
      facebook: 'Royal Events Mumbai'
    },
    availability: {
      nextAvailable: '2024-04-15',
      bookingLead: '3-4 months'
    },
    packageOptions: [
      {
        name: 'Classic Wedding Package',
        price: 350000,
        description: 'Complete wedding planning and coordination',
        includes: ['Venue selection & booking', 'Complete decor & styling', 'Photography & videography', 'Catering coordination', 'Entertainment booking', 'Guest management', 'Day-of coordination']
      },
      {
        name: 'Luxury Wedding Package',
        price: 650000,
        description: 'Premium luxury wedding with VIP services',
        includes: ['Premium venue booking', 'Designer decor & lighting', 'Professional photography team', 'Multi-cuisine catering', 'Live entertainment', 'Concierge services', 'Complete event management']
      },
      {
        name: 'Destination Wedding Package',
        price: 850000,
        description: 'Complete destination wedding management',
        includes: ['Destination venue booking', 'Travel & accommodation', 'Complete event planning', 'Local vendor coordination', 'Guest experience management', 'Multi-day event coordination']
      }
    ]
  },
  {
    id: 'vendor-002',
    companyName: 'Dreamweavers Events',
    ownerName: 'Rajesh Kumar',
    tagline: 'Your Complete Event Partner',
    description: 'Dreamweavers Events is a premier event management company with over a decade of experience in creating memorable celebrations. We provide comprehensive event solutions from concept to execution, handling all aspects including venue selection, catering, decor, entertainment, and guest coordination. Our team ensures every detail is perfect while you enjoy your special day.',
    email: 'rajesh@dreamweavers.in',
    phone: '+91 87654 32109',
    website: 'https://dreamweavers.in',
    city: 'Delhi',
    state: 'Delhi',
    services: ['Full Event Planning', 'Corporate Event Management', 'Wedding Coordination', 'Party Planning & Execution', 'Venue & Vendor Management'],
    specialties: ['Contemporary Weddings', 'Corporate Events', 'Birthday Celebrations', 'Anniversary Parties'],
    experience: '10+ years',
    rating: 4.6,
    reviewCount: 89,
    completedProjects: 156,
    responseTime: '< 4 hours',
    startingPrice: 180000,
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    portfolioImages: [
      {
        id: 'img-006',
        url: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800',
        title: 'Modern Wedding Management',
        description: 'Complete modern wedding coordination with contemporary styling and full-service planning',
        category: 'Wedding Management',
        eventType: 'Wedding'
      },
      {
        id: 'img-007',
        url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
        title: 'Corporate Conference Setup',
        description: 'End-to-end corporate event management including venue, catering, and technical coordination',
        category: 'Corporate Events',
        eventType: 'Corporate'
      },
      {
        id: 'img-008',
        url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
        title: 'Milestone Birthday Celebration',
        description: 'Complete party planning and execution for special birthday celebrations',
        category: 'Party Management',
        eventType: 'Birthday'
      },
      {
        id: 'img-009',
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        title: 'Anniversary Event Coordination',
        description: 'Full-service anniversary celebration planning with venue and entertainment management',
        category: 'Celebration Management',
        eventType: 'Anniversary'
      }
    ],
    reviews: [
      {
        id: 'rev-003',
        clientName: 'Meera & Suresh',
        rating: 5,
        comment: 'Dreamweavers handled our 25th anniversary celebration beautifully. Every detail was perfect and the coordination was flawless!',
        eventType: 'Anniversary Party',
        date: '2024-01-20'
      }
    ],
    certifications: ['Certified Event Planner', 'Corporate Event Management', 'Hospitality Professional'],
    awards: ['Best Event Management Company 2023 - Delhi', 'Innovation in Event Design'],
    socialMedia: {
      instagram: '@dreamweaversevents',
      facebook: 'Dreamweavers Events Delhi'
    },
    availability: {
      nextAvailable: '2024-03-10',
      bookingLead: '2-3 months'
    },
    packageOptions: [
      {
        name: 'Essential Event Package',
        price: 220000,
        description: 'Complete event planning with all essentials covered',
        includes: ['Venue coordination', 'Catering management', 'Basic decor & styling', 'Entertainment booking', 'Guest coordination', 'Day-of management']
      },
      {
        name: 'Premium Event Package',
        price: 380000,
        description: 'Enhanced event planning with premium services',
        includes: ['Premium venue selection', 'Gourmet catering coordination', 'Designer decor & lighting', 'Professional entertainment', 'Complete guest services', 'Multi-day coordination']
      }
    ]
  },
  {
    id: 'vendor-003',
    companyName: 'Elegant Occasions',
    ownerName: 'Kavya Reddy',
    tagline: 'End-to-End Event Excellence',
    description: 'Elegant Occasions specializes in comprehensive event management services, creating extraordinary experiences for weddings, corporate events, and celebrations. Our full-service approach covers every aspect from initial planning to final execution, ensuring seamless coordination and memorable moments. With expertise in both traditional and contemporary events, we bring your vision to life.',
    email: 'kavya@elegantoccasions.in',
    phone: '+91 98765 12340',
    website: 'https://elegantoccasions.in',
    city: 'Bangalore',
    state: 'Karnataka',
    services: ['Wedding Management', 'Corporate Event Planning', 'Social Event Coordination', 'Venue & Vendor Coordination', 'Complete Event Execution'],
    specialties: ['South Indian Weddings', 'Tech Corporate Events', 'Cultural Celebrations', 'Garden Parties'],
    experience: '6+ years',
    rating: 4.7,
    reviewCount: 94,
    completedProjects: 78,
    responseTime: '< 3 hours',
    startingPrice: 200000,
    profileImage: 'https://images.unsplash.com/photo-1494790108755-2616c1393587?w=400',
    portfolioImages: [
      {
        id: 'img-010',
        url: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800',
        title: 'Traditional Wedding Coordination',
        description: 'Complete South Indian wedding management with traditional rituals and modern coordination',
        category: 'Wedding Management',
        eventType: 'Wedding'
      },
      {
        id: 'img-011',
        url: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=800',
        title: 'Tech Conference Management',
        description: 'Full-service corporate event planning for technology conferences and product launches',
        category: 'Corporate Events',
        eventType: 'Corporate'
      },
      {
        id: 'img-012',
        url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
        title: 'Cultural Festival Coordination',
        description: 'End-to-end management of cultural celebrations and traditional festivals',
        category: 'Cultural Events',
        eventType: 'Festival'
      },
      {
        id: 'img-013',
        url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800',
        title: 'Garden Party Management',
        description: 'Complete outdoor event coordination with weather contingency and full logistics',
        category: 'Outdoor Events',
        eventType: 'Party'
      }
    ],
    reviews: [
      {
        id: 'rev-004',
        clientName: 'Ramesh & Lakshmi',
        rating: 5,
        comment: 'Kavya managed our traditional wedding perfectly. She coordinated with the temple, handled all vendors, and ensured everything went smoothly.',
        eventType: 'Traditional Wedding',
        date: '2024-02-12'
      }
    ],
    certifications: ['Wedding Planning Professional', 'Event Management Specialist', 'Cultural Event Coordinator'],
    awards: ['Rising Star Event Planner 2023', 'Best Traditional Wedding Coordination'],
    socialMedia: {
      instagram: '@elegantoccasions',
      facebook: 'Elegant Occasions Bangalore'
    },
    availability: {
      nextAvailable: '2024-03-25',
      bookingLead: '2-3 months'
    },
    packageOptions: [
      {
        name: 'Traditional Wedding Package',
        price: 280000,
        description: 'Complete traditional wedding management',
        includes: ['Temple/venue coordination', 'Ritual planning', 'Traditional decor', 'Catering coordination', 'Photography arrangement', 'Guest management', 'Complete event coordination']
      },
      {
        name: 'Modern Celebration Package',
        price: 320000,
        description: 'Contemporary event planning with traditional touches',
        includes: ['Modern venue selection', 'Contemporary styling', 'Fusion catering', 'Entertainment coordination', 'Social media coverage', 'Guest experience management']
      }
    ]
  },
  {
    id: 'vendor-004',
    companyName: 'Premier Celebrations',
    ownerName: 'Arjun Malhotra',
    tagline: 'Complete Event Solutions Under One Roof',
    description: 'Premier Celebrations is your one-stop solution for all event management needs. We specialize in delivering comprehensive event services from conceptualization to execution. Our experienced team handles weddings, corporate events, and social celebrations with meticulous attention to detail, ensuring every aspect is perfectly coordinated for an unforgettable experience.',
    email: 'arjun@premiercelebrations.com',
    phone: '+91 99887 65432',
    website: 'https://premiercelebrations.com',
    city: 'Chennai',
    state: 'Tamil Nadu',
    services: ['Complete Wedding Planning', 'Corporate Event Management', 'Social Celebration Coordination', 'Destination Event Planning', 'Multi-Day Event Management'],
    specialties: ['Tamil Weddings', 'Corporate Launches', 'Beach Destinations', 'Heritage Venues'],
    experience: '12+ years',
    rating: 4.9,
    reviewCount: 142,
    completedProjects: 201,
    responseTime: '< 1 hour',
    startingPrice: 300000,
    profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
    portfolioImages: [
      {
        id: 'img-014',
        url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800',
        title: 'Beach Destination Wedding',
        description: 'Complete destination wedding management at beachfront location with full logistics coordination',
        category: 'Destination Management',
        eventType: 'Wedding'
      },
      {
        id: 'img-015',
        url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
        title: 'Heritage Venue Coordination',
        description: 'Full-service event management at heritage palaces and traditional venues',
        category: 'Heritage Events',
        eventType: 'Wedding'
      },
      {
        id: 'img-016',
        url: 'https://images.unsplash.com/photo-1505236273191-e8872706cd2c?w=800',
        title: 'Product Launch Management',
        description: 'End-to-end corporate product launch with media coordination and guest management',
        category: 'Corporate Events',
        eventType: 'Launch'
      },
      {
        id: 'img-017',
        url: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800',
        title: 'Multi-Day Celebration',
        description: 'Complete coordination of multi-day wedding celebrations with seamless event flow',
        category: 'Wedding Management',
        eventType: 'Wedding'
      }
    ],
    reviews: [
      {
        id: 'rev-005',
        clientName: 'Divya & Karthik',
        rating: 5,
        comment: 'Premier Celebrations managed our 3-day wedding flawlessly. From the engagement to reception, every event was perfectly coordinated. Highly recommended!',
        eventType: 'Multi-day Wedding',
        date: '2024-01-28'
      }
    ],
    certifications: ['Master Event Planner', 'Destination Wedding Specialist', 'Corporate Event Professional'],
    awards: ['Top Event Management Company 2023 - Chennai', 'Excellence in Destination Weddings'],
    socialMedia: {
      instagram: '@premiercelebrations',
      facebook: 'Premier Celebrations Chennai'
    },
    availability: {
      nextAvailable: '2024-05-20',
      bookingLead: '4-6 months'
    },
    packageOptions: [
      {
        name: 'Heritage Wedding Package',
        price: 450000,
        description: 'Complete wedding management at heritage venues',
        includes: ['Heritage venue booking', 'Traditional decor coordination', 'Multi-cuisine catering', 'Cultural entertainment', 'Photography & videography', 'Guest accommodation', 'Complete event management']
      },
      {
        name: 'Destination Wedding Package',
        price: 750000,
        description: 'Full destination wedding coordination',
        includes: ['Destination venue selection', 'Travel coordination', 'Accommodation management', 'Local vendor coordination', 'Multi-day event planning', 'Guest experience management', 'Complete logistics handling']
      }
    ]
  },
  {
    id: 'vendor-005',
    companyName: 'Complete Celebrations',
    ownerName: 'Neha Agarwal',
    tagline: 'From Vision to Reality - Complete Event Management',
    description: 'Complete Celebrations is a full-service event management company dedicated to turning your dreams into reality. We handle every aspect of event planning and execution, from intimate gatherings to grand celebrations. Our comprehensive services include venue selection, vendor coordination, catering management, and day-of coordination, ensuring a stress-free experience for our clients.',
    email: 'neha@completecelebrations.in',
    phone: '+91 98123 45670',
    website: 'https://completecelebrations.in',
    city: 'Pune',
    state: 'Maharashtra',
    services: ['Full-Service Event Planning', 'Wedding Coordination', 'Corporate Event Management', 'Birthday & Anniversary Planning', 'Vendor Management & Coordination'],
    specialties: ['Marathi Weddings', 'Corporate Retreats', 'Milestone Celebrations', 'Intimate Gatherings'],
    experience: '9+ years',
    rating: 4.8,
    reviewCount: 118,
    completedProjects: 134,
    responseTime: '< 2 hours',
    startingPrice: 220000,
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    portfolioImages: [
      {
        id: 'img-018',
        url: 'https://images.unsplash.com/photo-1519167758481-83f29c1fe8cf?w=800',
        title: 'Traditional Marathi Wedding',
        description: 'Complete coordination of traditional Marathi wedding with cultural rituals and modern amenities',
        category: 'Wedding Management',
        eventType: 'Wedding'
      },
      {
        id: 'img-019',
        url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800',
        title: 'Corporate Retreat Management',
        description: 'End-to-end planning and execution of corporate retreats with team building and accommodation',
        category: 'Corporate Events',
        eventType: 'Corporate'
      },
      {
        id: 'img-020',
        url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
        title: 'Golden Anniversary Celebration',
        description: 'Complete milestone anniversary planning with family coordination and traditional celebrations',
        category: 'Anniversary Events',
        eventType: 'Anniversary'
      }
    ],
    reviews: [
      {
        id: 'rev-006',
        clientName: 'Priya & Amit',
        rating: 5,
        comment: 'Neha coordinated our wedding beautifully! She managed everything from venue booking to the final send-off. Professional and caring service.',
        eventType: 'Wedding',
        date: '2024-02-05'
      }
    ],
    certifications: ['Certified Wedding Planner', 'Event Management Professional', 'Cultural Event Specialist'],
    awards: ['Excellence in Wedding Planning 2023', 'Best Event Coordination Services'],
    socialMedia: {
      instagram: '@completecelebrations',
      facebook: 'Complete Celebrations Pune'
    },
    availability: {
      nextAvailable: '2024-04-08',
      bookingLead: '3-4 months'
    },
    packageOptions: [
      {
        name: 'Complete Wedding Package',
        price: 350000,
        description: 'Full wedding planning and coordination service',
        includes: ['Venue selection & booking', 'Complete vendor coordination', 'Catering management', 'Decor & styling', 'Photography coordination', 'Day-of management', 'Guest coordination']
      },
      {
        name: 'Corporate Event Package',
        price: 280000,
        description: 'Comprehensive corporate event management',
        includes: ['Venue coordination', 'Catering & hospitality', 'AV & technical setup', 'Guest management', 'Activity coordination', 'Complete event execution']
      }
    ]
  }
];

export const getVendorById = (id: string): VendorProfile | undefined => {
  return VENDOR_PROFILES.find(vendor => vendor.id === id);
};

export const getVendorsByService = (service: string): VendorProfile[] => {
  return VENDOR_PROFILES.filter(vendor => 
    vendor.services.includes(service)
  );
};

export const getVendorsByLocation = (city: string): VendorProfile[] => {
  return VENDOR_PROFILES.filter(vendor => 
    vendor.city.toLowerCase() === city.toLowerCase()
  );
};

export { VENDOR_PROFILES as vendorProfiles };
export default VENDOR_PROFILES;