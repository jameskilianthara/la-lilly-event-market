// Sample comprehensive proposals from event management companies
// Based on: Priya & Arjun's Traditional Wedding - March 15, 2025, Mumbai, 300 guests, ₹8-12L budget

export interface ProposalPackage {
  packageName: string;
  totalCost: number;
  description: string;
  includes: string[];
  timeline: string;
  teamAssigned: string[];
}

export interface DetailedProposal {
  companyId: string;
  companyName: string;
  ownerName: string;
  rating: number;
  reviewCount: number;
  responseTime: string;
  
  // Company approach
  personalMessage: string;
  whyChooseUs: string[];
  
  // Multiple package options
  packages: ProposalPackage[];
  
  // Detailed breakdown for recommended package
  detailedBreakdown: {
    category: string;
    items: {
      service: string;
      description: string;
      cost: number;
      included: boolean;
    }[];
    subtotal: number;
  }[];
  
  // Value additions
  complimentaryServices: string[];
  upgradeOptions: {
    service: string;
    additionalCost: number;
    description: string;
  }[];
  
  // Logistics & Timeline
  timeline: {
    phase: string;
    duration: string;
    activities: string[];
  }[];
  
  // Terms
  paymentSchedule: {
    phase: string;
    percentage: number;
    amount: number;
    dueDate: string;
  }[];
  
  validUntil: string;
  termsHighlights: string[];
}

export const SAMPLE_COMPREHENSIVE_PROPOSALS: DetailedProposal[] = [
  {
    companyId: 'royal-events-mumbai',
    companyName: 'Royal Events Mumbai',
    ownerName: 'Priya Sharma',
    rating: 4.8,
    reviewCount: 127,
    responseTime: '< 2 hours',
    
    personalMessage: "Namaste Priya & Arjun! We're honored you're considering us for your special day. After reviewing your requirements, we've crafted a comprehensive proposal that honors traditional values while ensuring modern convenience. Our 8+ years of experience in Mumbai weddings means we know exactly how to make your March wedding magical while managing the seasonal logistics perfectly.",
    
    whyChooseUs: [
      "8+ years specializing in traditional Indian weddings in Mumbai",
      "Complete end-to-end management - single point of contact",
      "Pre-vetted network of premium vendors and venues",
      "Dedicated wedding coordinator assigned from booking to completion",
      "Crisis management expertise with 24/7 support during event week",
      "Transparent pricing with no hidden costs"
    ],
    
    packages: [
      {
        packageName: "Classic Traditional Wedding",
        totalCost: 850000,
        description: "Complete wedding management with all essentials covered",
        includes: [
          "Venue selection & booking (wedding + reception)",
          "Complete mandap setup with traditional decor",
          "Full catering coordination (300 guests)",
          "Photography & videography (8 hours)",
          "Live music coordination & DJ services",
          "Floral arrangements for all ceremonies",
          "Day-of coordination team (5 coordinators)",
          "Guest coordination & hospitality"
        ],
        timeline: "3 months comprehensive planning",
        teamAssigned: ["Lead Coordinator", "Decor Specialist", "Catering Manager", "Logistics Team"]
      },
      {
        packageName: "Premium Royal Wedding",
        totalCost: 1200000,
        description: "Luxury wedding experience with premium services",
        includes: [
          "Premium venue selection (heritage/5-star properties)",
          "Designer mandap with gold & floral themes",
          "Gourmet multi-cuisine catering with live counters",
          "Professional photography & cinematic videography",
          "Live band + classical musicians + DJ",
          "Designer floral arrangements & stage setup",
          "Mehendi ceremony complete coordination",
          "Guest accommodation assistance",
          "Transportation coordination",
          "Dedicated hospitality team (8 coordinators)",
          "Welcome gifts & personalized touches"
        ],
        timeline: "4 months comprehensive planning",
        teamAssigned: ["Senior Wedding Planner", "Design Director", "Premium Catering Chef", "Hospitality Manager"]
      }
    ],
    
    detailedBreakdown: [
      {
        category: "Venue & Space Management",
        items: [
          {
            service: "Wedding Venue Booking",
            description: "Premium banquet hall booking including negotiation and contract management",
            cost: 200000,
            included: true
          },
          {
            service: "Reception Venue Coordination",
            description: "Same/separate venue for evening reception with setup coordination",
            cost: 100000,
            included: true
          },
          {
            service: "Mehendi Venue Setup",
            description: "Intimate venue arrangement for mehendi ceremony with traditional decor",
            cost: 50000,
            included: true
          }
        ],
        subtotal: 350000
      },
      {
        category: "Decor & Styling",
        items: [
          {
            service: "Traditional Mandap Setup",
            description: "Authentic wooden mandap with marigold & rose decorations, sacred fire setup",
            cost: 120000,
            included: true
          },
          {
            service: "Stage & Backdrop Design",
            description: "Reception stage with floral backdrop and couple seating arrangement",
            cost: 80000,
            included: true
          },
          {
            service: "Entrance & Pathway Decor",
            description: "Traditional torans, rangoli, and pathway flower decorations",
            cost: 60000,
            included: true
          }
        ],
        subtotal: 260000
      },
      {
        category: "Catering & Food Management",
        items: [
          {
            service: "Complete Wedding Feast",
            description: "Traditional vegetarian menu (300 guests) with live counters and regional specialties",
            cost: 180000,
            included: true
          },
          {
            service: "Mehendi Light Refreshments",
            description: "Snacks, chai, and light refreshments for mehendi ceremony",
            cost: 25000,
            included: true
          },
          {
            service: "Welcome Drinks & Appetizers",
            description: "Traditional welcome drinks and appetizer service for guests",
            cost: 35000,
            included: true
          }
        ],
        subtotal: 240000
      }
    ],
    
    complimentaryServices: [
      "Complimentary pre-wedding venue visit with couple",
      "Free menu tasting session for families",
      "Traditional brass band coordination for baraat",
      "Basic sound system for ceremonies",
      "Parking coordination and valet service",
      "Basic backdrop for photography"
    ],
    
    upgradeOptions: [
      {
        service: "Heritage Palace Venue",
        additionalCost: 150000,
        description: "Upgrade to premium heritage palace venue with royal ambiance"
      },
      {
        service: "Pre-wedding Shoot Coordination",
        additionalCost: 50000,
        description: "Complete pre-wedding shoot planning and execution"
      },
      {
        service: "Destination Wedding Extension",
        additionalCost: 200000,
        description: "Extend services for destination wedding coordination"
      }
    ],
    
    timeline: [
      {
        phase: "Planning Phase (Month 1)",
        duration: "30 days",
        activities: [
          "Initial consultation and requirement finalization",
          "Venue selection and booking",
          "Vendor selection and contract negotiations",
          "Menu finalization and tasting sessions",
          "Design concepts and theme development"
        ]
      },
      {
        phase: "Coordination Phase (Month 2-3)",
        duration: "60 days",
        activities: [
          "Detailed logistics planning",
          "Timeline creation and vendor coordination",
          "Invitation design and printing coordination",
          "Guest list management setup",
          "Rehearsal planning and coordination"
        ]
      },
      {
        phase: "Execution Phase (Event Week)",
        duration: "7 days",
        activities: [
          "Final venue setup and decoration",
          "Vendor coordination and management",
          "Guest coordination and hospitality",
          "Real-time problem solving and crisis management",
          "Post-event cleanup and settlement"
        ]
      }
    ],
    
    paymentSchedule: [
      {
        phase: "Booking Confirmation",
        percentage: 30,
        amount: 255000,
        dueDate: "Upon proposal acceptance"
      },
      {
        phase: "Planning Completion",
        percentage: 40,
        amount: 340000,
        dueDate: "45 days before event"
      },
      {
        phase: "Final Settlement",
        percentage: 30,
        amount: 255000,
        dueDate: "Event week"
      }
    ],
    
    validUntil: "2024-10-15",
    termsHighlights: [
      "All vendor coordination and management included",
      "24/7 support during event week with dedicated coordinator",
      "Full refund protection up to 60 days before event",
      "Force majeure coverage including weather contingencies",
      "All taxes and service charges included in quoted price"
    ]
  },
  
  {
    companyId: 'dreamweavers-events',
    companyName: 'Dreamweavers Events',
    ownerName: 'Rajesh Kumar',
    rating: 4.6,
    reviewCount: 89,
    responseTime: '< 4 hours',
    
    personalMessage: "Dear Priya & Arjun, congratulations on your upcoming wedding! We specialize in creating seamless blend of tradition and contemporary elegance. Your March wedding timing is perfect for Mumbai's pleasant weather, and we have extensive experience managing traditional ceremonies with modern hospitality standards. Let us weave your dream wedding into reality.",
    
    whyChooseUs: [
      "10+ years of comprehensive wedding management experience",
      "Specialized team for traditional Indian wedding rituals",
      "Strong relationships with Mumbai's premium venues and vendors",
      "Technology-enabled guest management and communication",
      "Dedicated crisis management team for real-time solutions",
      "Post-wedding support including vendor settlements"
    ],
    
    packages: [
      {
        packageName: "Traditional Harmony Package",
        totalCost: 780000,
        description: "Beautiful traditional wedding with modern coordination excellence",
        includes: [
          "Complete venue management and coordination",
          "Traditional mandap with authentic rituals setup",
          "Comprehensive catering coordination (300 guests)",
          "Photography and videography coordination",
          "Music and entertainment management",
          "Complete floral design and decoration",
          "Professional coordination team",
          "Guest management and hospitality services"
        ],
        timeline: "3.5 months comprehensive planning",
        teamAssigned: ["Wedding Coordinator", "Ritual Specialist", "Guest Relations Manager", "Vendor Coordinator"]
      },
      {
        packageName: "Grand Celebration Package",
        totalCost: 1050000,
        description: "Premium wedding experience with luxury touches",
        includes: [
          "Premium venue selection and management",
          "Designer mandap with theme coordination",
          "Multi-cuisine gourmet catering with live stations",
          "Professional photography with same-day highlights",
          "Live entertainment coordination and DJ services",
          "Designer floral arrangements throughout",
          "Mehendi and sangeet ceremony coordination",
          "Guest accommodation and transport assistance",
          "Personalized wedding favors and welcome packages",
          "Extended coordination team (7 coordinators)"
        ],
        timeline: "4 months premium planning experience",
        teamAssigned: ["Senior Wedding Planner", "Design Consultant", "Guest Experience Manager", "Premium Vendor Relations"]
      }
    ],
    
    detailedBreakdown: [
      {
        category: "Venue Coordination & Management",
        items: [
          {
            service: "Primary Wedding Venue",
            description: "Banquet hall coordination including booking, negotiation, and day-of management",
            cost: 180000,
            included: true
          },
          {
            service: "Reception Space Management",
            description: "Evening reception coordination with setup and breakdown management",
            cost: 90000,
            included: true
          },
          {
            service: "Mehendi Ceremony Space",
            description: "Intimate venue for mehendi with traditional setup and coordination",
            cost: 45000,
            included: true
          }
        ],
        subtotal: 315000
      },
      {
        category: "Traditional Ceremony Management",
        items: [
          {
            service: "Sacred Mandap Construction",
            description: "Traditional wooden mandap with authentic Vedic setup and ritual coordination",
            cost: 100000,
            included: true
          },
          {
            service: "Ritual Coordination Services",
            description: "Pandit coordination, sacred fire management, and ceremony flow coordination",
            cost: 40000,
            included: true
          },
          {
            service: "Traditional Music Coordination",
            description: "Shehnai players, dhol players, and traditional musicians for ceremonies",
            cost: 35000,
            included: true
          }
        ],
        subtotal: 175000
      },
      {
        category: "Catering & Hospitality Excellence",
        items: [
          {
            service: "Complete Wedding Feast Management",
            description: "Full vegetarian catering coordination with regional specialties (300 guests)",
            cost: 165000,
            included: true
          },
          {
            service: "Live Food Stations",
            description: "Interactive live counters (chaat, dosa, kulfi) with chef coordination",
            cost: 45000,
            included: true
          },
          {
            service: "Guest Hospitality Services",
            description: "Welcome drinks, refreshment coordination, and VIP guest management",
            cost: 30000,
            included: true
          }
        ],
        subtotal: 240000
      }
    ],
    
    complimentaryServices: [
      "Free wedding planning app for guest management",
      "Complimentary bridal room setup and coordination",
      "Traditional welcome ceremony coordination",
      "Basic photography backdrop and props",
      "Vendor liaison and payment coordination",
      "Post-wedding cleanup and vendor settlements"
    ],
    
    upgradeOptions: [
      {
        service: "Royal Heritage Venue Package",
        additionalCost: 120000,
        description: "Upgrade to premium heritage property with royal decor themes"
      },
      {
        service: "Destination Wedding Coordination",
        additionalCost: 180000,
        description: "Complete destination wedding management with travel coordination"
      },
      {
        service: "Multi-Day Celebration Management",
        additionalCost: 80000,
        description: "Extended services for sangeet, engagement, and other pre-wedding events"
      }
    ],
    
    timeline: [
      {
        phase: "Initial Planning (Month 1)",
        duration: "30 days",
        activities: [
          "Detailed consultation and requirement mapping",
          "Venue research, visits, and final selection",
          "Vendor identification and quality assessment",
          "Initial design concepts and theme development",
          "Budget allocation and timeline creation"
        ]
      },
      {
        phase: "Detailed Coordination (Month 2-3)",
        duration: "60 days",
        activities: [
          "Vendor contracts and coordination setup",
          "Menu planning and tasting coordination",
          "Invitation and communication planning",
          "Detailed logistics and timeline refinement",
          "Rehearsal planning and coordination"
        ]
      },
      {
        phase: "Final Execution (Event Week)",
        duration: "7 days",
        activities: [
          "Complete setup and decoration coordination",
          "Vendor management and real-time coordination",
          "Guest reception and hospitality management",
          "Crisis management and problem resolution",
          "Event breakdown and final settlements"
        ]
      }
    ],
    
    paymentSchedule: [
      {
        phase: "Initial Booking",
        percentage: 25,
        amount: 195000,
        dueDate: "Contract signing"
      },
      {
        phase: "Planning Milestone",
        percentage: 50,
        amount: 390000,
        dueDate: "60 days before event"
      },
      {
        phase: "Final Payment",
        percentage: 25,
        amount: 195000,
        dueDate: "Day of event"
      }
    ],
    
    validUntil: "2024-10-20",
    termsHighlights: [
      "Comprehensive vendor management with quality assurance",
      "Dedicated coordination team throughout planning and execution",
      "Emergency contingency planning with backup solutions",
      "Transparent pricing with detailed cost breakdown",
      "Post-event support for 30 days including vendor settlements"
    ]
  },
  
  {
    companyId: 'elegant-occasions',
    companyName: 'Elegant Occasions',
    ownerName: 'Kavya Reddy',
    rating: 4.7,
    reviewCount: 94,
    responseTime: '< 3 hours',
    
    personalMessage: "Dear Priya & Arjun, we're thrilled about the opportunity to be part of your wedding journey! As specialists in traditional South Indian and North Indian fusion weddings, we understand the beautiful complexity of managing authentic rituals while ensuring modern guest comfort. Your March timing is ideal for outdoor elements, and our Mumbai network ensures seamless execution.",
    
    whyChooseUs: [
      "6+ years of specialized traditional wedding expertise",
      "Cultural fusion wedding specialists",
      "Technology-driven planning and communication",
      "Eco-friendly and sustainable wedding practices",
      "Personalized approach with dedicated planning time",
      "Strong vendor relationships ensuring quality and reliability"
    ],
    
    packages: [
      {
        packageName: "Heritage Celebration Package",
        totalCost: 720000,
        description: "Authentic traditional wedding with sustainable modern touches",
        includes: [
          "Complete venue coordination and management",
          "Traditional mandap with eco-friendly materials",
          "Sustainable catering coordination (300 guests)",
          "Photography and videography coordination",
          "Cultural music and entertainment coordination",
          "Organic floral arrangements and decor",
          "Personalized coordination team",
          "Digital guest management system"
        ],
        timeline: "3 months personalized planning",
        teamAssigned: ["Cultural Wedding Specialist", "Sustainability Coordinator", "Guest Experience Manager", "Vendor Relations"]
      },
      {
        packageName: "Royal Fusion Package",
        totalCost: 980000,
        description: "Premium cultural fusion wedding with luxury hospitality",
        includes: [
          "Premium venue selection with cultural significance",
          "Designer traditional mandap with modern elements",
          "Gourmet fusion catering with regional specialties",
          "Professional photography with cultural storytelling",
          "Live cultural performances and modern entertainment",
          "Designer floral installations throughout venues",
          "Complete mehendi and pre-wedding coordination",
          "Luxury guest hospitality and accommodation assistance",
          "Personalized wedding favors with cultural elements",
          "Extended coordination team with cultural specialists"
        ],
        timeline: "4 months luxury planning experience",
        teamAssigned: ["Senior Cultural Specialist", "Luxury Design Consultant", "Premium Hospitality Manager", "Cultural Entertainment Coordinator"]
      }
    ],
    
    detailedBreakdown: [
      {
        category: "Cultural Venue & Space Coordination",
        items: [
          {
            service: "Traditional Wedding Venue Management",
            description: "Culturally significant venue coordination with traditional setup requirements",
            cost: 160000,
            included: true
          },
          {
            service: "Reception Hall Coordination",
            description: "Modern reception space with cultural decor integration",
            cost: 85000,
            included: true
          },
          {
            service: "Sacred Ceremony Spaces",
            description: "Multiple ceremony spaces for different rituals with proper coordination",
            cost: 40000,
            included: true
          }
        ],
        subtotal: 285000
      },
      {
        category: "Cultural Decor & Traditional Setup",
        items: [
          {
            service: "Authentic Mandap Construction",
            description: "Traditional mandap with regional specifications and sacred geometry",
            cost: 95000,
            included: true
          },
          {
            service: "Cultural Decoration Themes",
            description: "Regional traditional decorations with authentic materials and designs",
            cost: 75000,
            included: true
          },
          {
            service: "Sacred Space Setup",
            description: "Proper ritual space arrangement with traditional requirements",
            cost: 30000,
            included: true
          }
        ],
        subtotal: 200000
      },
      {
        category: "Authentic Catering & Cultural Food",
        items: [
          {
            service: "Traditional Wedding Feast",
            description: "Authentic regional cuisine coordination with traditional cooking methods",
            cost: 150000,
            included: true
          },
          {
            service: "Cultural Food Experiences",
            description: "Interactive traditional food stations with cultural presentations",
            cost: 40000,
            included: true
          },
          {
            service: "Ritual Food Coordination",
            description: "Prasadam and ceremonial food preparation and distribution",
            cost: 25000,
            included: true
          }
        ],
        subtotal: 215000
      }
    ],
    
    complimentaryServices: [
      "Complimentary cultural consultation and ritual planning",
      "Free sustainable wedding planning guide",
      "Traditional welcome ceremony coordination",
      "Basic cultural photography props and backdrops",
      "Post-wedding cultural documentation and memories",
      "Vendor coordination with quality assurance"
    ],
    
    upgradeOptions: [
      {
        service: "Temple Heritage Venue",
        additionalCost: 100000,
        description: "Upgrade to authentic temple or heritage property with cultural significance"
      },
      {
        service: "Cultural Performance Package",
        additionalCost: 60000,
        description: "Traditional dancers, classical musicians, and cultural entertainment"
      },
      {
        service: "Sustainable Luxury Add-ons",
        additionalCost: 75000,
        description: "Eco-luxury touches including organic decor and sustainable hospitality"
      }
    ],
    
    timeline: [
      {
        phase: "Cultural Planning (Month 1)",
        duration: "30 days",
        activities: [
          "Cultural consultation and tradition planning",
          "Venue selection with cultural significance assessment",
          "Traditional vendor network activation",
          "Ritual timeline and cultural requirement mapping",
          "Family tradition integration planning"
        ]
      },
      {
        phase: "Detailed Coordination (Month 2-3)",
        duration: "60 days",
        activities: [
          "Cultural vendor coordination and contracts",
          "Traditional menu planning with family recipes",
          "Cultural decoration and setup planning",
          "Guest cultural experience planning",
          "Rehearsal coordination with ritual specialists"
        ]
      },
      {
        phase: "Cultural Execution (Event Week)",
        duration: "7 days",
        activities: [
          "Traditional setup and cultural space preparation",
          "Cultural vendor coordination and management",
          "Cultural guest experience and ritual guidance",
          "Cultural documentation and memory preservation",
          "Traditional celebration completion and blessings"
        ]
      }
    ],
    
    paymentSchedule: [
      {
        phase: "Cultural Planning Initiation",
        percentage: 30,
        amount: 216000,
        dueDate: "Cultural consultation completion"
      },
      {
        phase: "Coordination Milestone",
        percentage: 45,
        amount: 324000,
        dueDate: "45 days before celebration"
      },
      {
        phase: "Cultural Celebration Settlement",
        percentage: 25,
        amount: 180000,
        dueDate: "Event completion"
      }
    ],
    
    validUntil: "2024-10-25",
    termsHighlights: [
      "Cultural authenticity guarantee with traditional specialists",
      "Comprehensive cultural vendor management and coordination",
      "Traditional ritual support with experienced coordinators",
      "Cultural documentation and memory preservation included",
      "Post-wedding cultural celebration support and guidance"
    ]
  }
];

export default SAMPLE_COMPREHENSIVE_PROPOSALS;