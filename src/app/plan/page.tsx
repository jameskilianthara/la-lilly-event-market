'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  Check,
  Edit3
} from 'lucide-react';
import LaLillyLogoNew from '../../components/LaLillyLogoNew';
import ProgressIndicator from '../../components/ProgressIndicator';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  component?: 'text-input' | 'date-picker' | 'number-input' | 'yes-no' | 'checklist-link';
}

interface EventMemory {
  event_type: string;
  date: string;
  location: string;
  guest_count: string;
  venue_status: string;
  conversation: Message[];
  checklist_data?: ChecklistData;
  reference_images: ReferenceImage[];
}

interface ReferenceImage {
  id: string;
  url: string;
  description: string;
  category?: string;
}

interface ChecklistItem {
  id: string;
  name: string;
  checked: boolean;
  customNote: string;
}

interface Subcategory {
  id: string;
  name: string;
  items: ChecklistItem[];
  customItems: ChecklistItem[];
}

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
  isExpanded: boolean;
}

interface ChecklistData {
  categories: Category[];
  lastUpdated: Date;
}

// Comprehensive Event Checklist Database
const CHECKLIST_DATABASE = {
  "Birthday/Theme Party": {
    "Basic Info": [
      "Theme decoration and setup requirements",
      "Invitation design and printing",
      "Entry management (tickets, guest list, security)",
      "Dress code and costume coordination",
      "Guest welcome gifts and party favors"
    ],
    "Venue & Decor": [
      "Theme-based venue decoration",
      "Stage and performance area setup",
      "Dance floor with lighting",
      "Photo booth and backdrop setup",
      "Green room/prep area for performers",
      "Social media coverage and promotion"
    ],
    "Food & Banquet": [
      "Catering menu and food stations",
      "Bar setup and beverage selection",
      "Seating arrangement and table numbering",
      "Table centerpieces and linens",
      "Welcome board and signage"
    ],
    "Manpower": [
      "MC/Host for the event",
      "DJ and sound technician",
      "Security and crowd management",
      "Performance artists and entertainers", 
      "Event hostess and coordinators",
      "Bartenders and service staff",
      "Valet parking attendants",
      "Transportation coordination"
    ],
    "Permissions": [
      "Event permit and licensing",
      "Music license (PPL) for DJ/live music", 
      "Police clearance and security approval",
      "Fire safety and emergency protocols"
    ],
    "Technical": {
      "Visuals": [
        "LED wall specifications and size requirements",
        "AV screens and display setup",
        "Projector with screen requirements",
        "Presentation equipment and connectivity",
        "Display monitors for different areas"
      ],
      "Lighting": [
        "Stage lighting design and setup",
        "LED par lighting for ambiance",
        "Moving head lights with custom gobos",
        "Sharpy beam lights for dramatic effect",
        "Laser light show requirements",
        "Smoke/haze machines for atmosphere",
        "Dance floor lighting effects",
        "Custom lighting design consultation"
      ],
      "Sound": [
        "Sound system power requirements (specify wattage)",
        "Monitor speakers for performers",
        "Wireless microphone systems",
        "Audio mixing and control setup"
      ],
      "Area Lighting": [
        "General area illumination requirements",
        "Decorative lighting for ambiance",
        "Pathway and safety lighting"
      ],
      "Special Effects": ["Fireworks display coordination", "Confetti cannon setup"]
    },
    "Photography & Video": ["Photo booth setup and props", "Event photography coverage", "Videography and live streaming"],
    "Power": ["Generator backup requirements", "Power distribution and load calculation"],
    "Budget": [],
    "Decor & Branding": [],
    "Entertainment": [],
    "Photography": []
  },

  "Wedding": {
    "Basic Info": [
      "Wedding ceremony style (religious, civil, cultural)",
      "Reception style (sit-down dinner, cocktail, buffet)",
      "Invitation design and printing",
      "Wedding favors and gifts for guests"
    ],
    "Theme Options": [
      "Flavours of india",
      "Ball room",
      "Underwater",
      "Tradional kerala theme",
      "Village kerala",
      "Cindrella theme",
      "Beach theme",
      "Peacock Passion",
      "Mughal theme",
      "Joda akber theme",
      "North indian theme",
      "Rajastan theme"
    ],
    "Venue Arrangements": [
      "Stage and mandap/pandhal setup",
      "Chair covers and sashes",
      "Table linens and runners",
      "Seating arrangement plan",
      "VIP/family seating section",
      "Aisle decoration and petals"
    ],
    "Food & Banquet": [
      "Catering menu selection and tasting",
      "Dietary restrictions and preferences",
      "Welcome drinks and cocktail hour",
      "Wedding cake design and cutting ceremony",
      "Late night snacks for guests"
    ],
    "Bride & Groom Arrival": [
      "Bridal entry transportation (car, horse, carriage)",
      "Groom&apos;s baraat procession",
      "Entry music and announcements",
      "Flower petals and confetti for arrival",
      "Photography coordination for entrances"
    ],
    "Ceremonial Procession": [
      "Flower girl",
      "Flower showering",
      "Traditional kerala dancers",
      "North indian (Dandiya, Dhol,Bhangra)",
      "Oppana",
      "Soofi",
      "Arabic dancers",
      "Pallak",
      "Special case"
    ],
    "Decoration": [
      "Wedding car decoration and styling",
      "Grand entrance decoration from gate to venue",
      "Welcome arch design and flowers",
      "Secondary entrance arch styling",
      "Aisle and walkway decoration",
      "Guest seating area beautification",
      "Column and pillar decoration",
      "Table centerpiece design",
      "Stage backdrop and decoration",
      "Ceiling treatment and draping",
      "Ambient lighting and decor setup",
      "Food counter and buffet area styling",
      "Photo session backdrop design",
      "Custom signage and welcome boards",
      "Bridal seating arrangement",
      "Green room setup and decoration"
    ],
    "OnStage Arrangement": [
      "Wedding cake design and specifications",
      "Ceremonial candle arrangement",
      "Traditional lamp lighting setup",
      "Champagne and cake cutting ceremony",
      "Hindu wedding ritual arrangements",
      "Confetti and celebration effects"
    ],
    "Flowers": [
      "Fresh flower arrangements (gerbera, carnation, lily, orchid, roses)",
      "Bridal and bridesmaids bouquets",
      "Traditional garland arrangements",
      "Flower petals for ceremonial shower",
      "Pathway flower decoration",
      "Floral arch construction"
    ],
    "Manpower": [
      "Master of ceremonies and announcements",
      "Religious priest coordination",
      "Professional hostess services",
      "Hostess costume and styling",
      "Guest relations and coordination",
      "Valet parking services",
      "Bridal makeup and grooming",
      "Venue housekeeping services",
      "Security and crowd management"
    ],
    "Other Activities": [
      "Temporary tattoo station for guests",
      "Mehendi artist and henna designs",
      "Traditional bangle selection counter",
      "Sweet distribution and packaging",
      "Candy and chocolate gift station",
      "Fireworks display coordination",
      "Custom activity counters"
    ],
    "Entertainment": [
      "Live music performance requirements",
      "Vocal performance setup (solo, duet, or group)",
      "Musical instrument arrangement",
      "DJ services and playlist preferences",
      "Background music for different event phases",
      "Entertainment stage construction",
      "Performance area decoration"
    ],
    "Gifts & Favours": [
      "Traditional gift packs (sweets, spices, dry fruits)",
      "Decorative gift items and souvenirs",
      "Custom wedding favor design"
    ],
    "Photography & Video": [
      "Professional videography with aerial shots",
      "Candid photography style preferences",
      "Instant photo printing for guests",
      "Live editing and same-day highlights"
    ],
    "Light & Sound": [
      "Professional stage lighting setup",
      "LED par lighting for ambiance",
      "Moving head lights with custom patterns",
      "Sharpy beam lights for dramatic effects",
      "Follow spot lighting for key moments",
      "Special effects lighting design",
      "General area illumination",
      "Colored lighting for mood setting",
      "Sound system power specifications",
      "Multi-zone speaker distribution",
      "LED wall display requirements",
      "Audio-visual presentation setup",
      "Projection system for ceremonies",
      "Display screens for guest viewing"
    ],
    "Power": [
      "Generator capacity requirements (specify KVA based on load)"
    ],
    "Support Services": [
      "Honeymoon packages",
      "Tour packages for guest (pre or post wedding)",
      "Live telecast on website"
    ],
    "Outdoor Infra": [
      "Structural framework and canopy",
      "Premium tent structure setup",
      "Flooring and carpet installation",
      "Tent lighting and electrical",
      "Climate control requirements",
      "Guest comfort facilities",
      "Temporary restroom facilities",
      "Hand washing station setup",
      "Water supply and storage",
      "Hygiene supplies and maintenance"
    ],
    "Decor & Branding": [],
    "Technical": [],
    "Photography": [],
    "Permissions": []
  },

  "General Checklist": {
    "Basic Info": ["Budget planning and allocation", "Invitation design and printing requirements"],
    "Decor & Branding": ["Stage design and construction", "Custom backdrop creation", "Welcome arch installation", "Promotional signage and banners", "Branded standee placement"],
    "Manpower": ["Master of ceremonies coordination", "Professional hostess services", "Security and crowd management", "Service staff requirements"],
    "Food & Banquet": ["Catering menu customization", "Beverage service options", "Food service style preferences"],
    "Entertainment": ["DJ services and sound system", "Live performance coordination", "Dance and cultural performances", "Special entertainment acts"],
    "Technical": ["LED display and screen setup", "Projection system requirements", "Audio system specifications", "Lighting design and installation"],
    "Power": ["Backup generator requirements", "Electrical load distribution"],
    "Photography": ["Professional photography coverage", "Videography and documentation", "Live streaming setup", "Instant photo printing services"],
    "Permissions": ["Police clearance and permits", "Event licensing requirements", "Music licensing (PPL) compliance"]
  }
};

const generateChecklistForEvent = (eventType: string, guestCount: string, venueStatus: string): Category[] => {
  // Determine which checklist to use based on event type
  // Type as Record to allow flexible structure (some categories are objects, some are arrays)
  let selectedChecklist: Record<string, string[] | Record<string, string[]> | never[]> = CHECKLIST_DATABASE["General Checklist"];
  
  // Match event type to database keys
  const eventLower = eventType.toLowerCase();
  
  if (eventLower.includes('wedding')) {
    selectedChecklist = CHECKLIST_DATABASE["Wedding"];
  } else if (eventLower.includes('birthday') || eventLower.includes('party') || eventLower.includes('theme')) {
    selectedChecklist = CHECKLIST_DATABASE["Birthday/Theme Party"];
  }

  // Convert database structure to our Category format
  const categories: Category[] = [];

  Object.entries(selectedChecklist).forEach(([categoryName, categoryData], index) => {
    const categoryId = `category-${index}`;
    
    // Handle nested technical subcategories or simple arrays
    if (typeof categoryData === 'object' && !Array.isArray(categoryData)) {
      // This is for complex categories like Technical with subcategories
      const subcategories: Subcategory[] = Object.entries(categoryData).map(([subName, subItems], subIndex) => ({
        id: `${categoryId}-sub-${subIndex}`,
        name: subName,
        items: (subItems as string[]).map((item, itemIndex) => ({
          id: `${categoryId}-sub-${subIndex}-item-${itemIndex}`,
          name: item,
          checked: false,
          customNote: ''
        })),
        customItems: []
      }));

      categories.push({
        id: categoryId,
        name: categoryName,
        isExpanded: true, // Start expanded to reduce clicks
        subcategories
      });
    } else if (Array.isArray(categoryData)) {
      // Simple category with direct items
      categories.push({
        id: categoryId,
        name: categoryName,
        isExpanded: true, // Start expanded to reduce clicks
        subcategories: [{
          id: `${categoryId}-main`,
          name: 'Requirements',
          items: categoryData.map((item, itemIndex) => ({
            id: `${categoryId}-item-${itemIndex}`,
            name: item,
            checked: false,
            customNote: ''
          })),
          customItems: []
        }]
      });
    }
  });

  // Add venue selection if venue not booked
  if (venueStatus.includes('help') || venueStatus.includes('Not')) {
    categories.unshift({
      id: 'venue-selection',
      name: 'Venue Selection',
      isExpanded: true, // Start expanded to reduce clicks
      subcategories: [{
        id: 'venue-requirements',
        name: 'Venue Requirements',
        items: [
          { id: 'venue-style', name: 'Venue style preference (elegant, rustic, modern, traditional)', checked: false, customNote: '' },
          { id: 'amenities', name: 'Required amenities (kitchen, AV equipment, seating)', checked: false, customNote: '' },
          { id: 'accessibility', name: 'Special accessibility requirements', checked: false, customNote: '' },
          { id: 'backup-plan', name: 'Weather backup plan (for outdoor events)', checked: false, customNote: '' }
        ],
        customItems: []
      }]
    });
  }

  return categories;
};

// User Journey Steps
const JOURNEY_STEPS = [
  { id: 'planning', name: 'Planning', description: 'Event details' },
  { id: 'checklist', name: 'Checklist', description: 'Requirements' },
  { id: 'proposals', name: 'Proposals', description: 'Vendor bids' },
  { id: 'selection', name: 'Selection', description: 'Final choice' }
];

export default function PlanEventPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, setShowChecklist] = useState(false);

  // Memory system
  const [eventMemory, setEventMemory] = useState<EventMemory>({
    event_type: '',
    date: '',
    location: '',
    guest_count: '',
    venue_status: '',
    conversation: [],
    reference_images: []
  });

  const questions = [
    {
      content: "Hi, what kind of event are you planning?",
      component: 'text-input' as const,
      field: 'event_type' as keyof EventMemory
    },
    {
      content: "When is the event being planned?",
      component: 'date-picker' as const,
      field: 'date' as keyof EventMemory
    },
    {
      content: "In which city/town is the event happening?",
      component: 'text-input' as const,
      field: 'location' as keyof EventMemory
    },
    {
      content: "How many people are being invited?",
      component: 'number-input' as const,
      field: 'guest_count' as keyof EventMemory
    },
    {
      content: "Have you booked a venue already, or should we help?",
      component: 'yes-no' as const,
      field: 'venue_status' as keyof EventMemory
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load memory on component mount
  useEffect(() => {
    const saved = localStorage.getItem('lalilly-event-memory');
    if (saved) {
      try {
        const data: EventMemory = JSON.parse(saved);
        setEventMemory(data);
        setMessages(data.conversation || []);
        // Reference images handled separately if needed
        
        // Determine current state
        const completedAnswers = [
          data.event_type,
          data.date, 
          data.location,
          data.guest_count,
          data.venue_status
        ].filter(Boolean).length;
        
        if (completedAnswers === 5) {
          // Checklist data exists, user can navigate via conversation links
        } else {
          setCurrentStep(completedAnswers);
          // Add next question if conversation doesn't exist or is incomplete
          if (completedAnswers < 5) {
            // If no conversation exists, start fresh
            if (!data.conversation || data.conversation.length === 0) {
              const welcomeMessage: Message = {
                id: 'welcome-1',
                content: questions[0].content,
                sender: 'bot',
                timestamp: new Date(),
                component: questions[0].component
              };
              setMessages([welcomeMessage]);
              updateMemory({ conversation: [welcomeMessage] });
            } else {
              // Conversation exists but incomplete - add next question if needed
              const lastMessage = data.conversation[data.conversation.length - 1];
              const needsNextQuestion = lastMessage.sender === 'user' && completedAnswers < 5;
              
              if (needsNextQuestion) {
                const nextQuestion: Message = {
                  id: `continue-${Date.now()}`,
                  content: questions[completedAnswers].content,
                  sender: 'bot',
                  timestamp: new Date(),
                  component: questions[completedAnswers].component
                };
                const updatedConversation = [...data.conversation, nextQuestion];
                setMessages(updatedConversation);
                updateMemory({ conversation: updatedConversation });
              }
            }
          }
        }
      } catch (e) {
        console.warn('Could not load saved data:', e);
        initializeChat();
      }
    } else {
      initializeChat();
    }
  }, []);

  const initializeChat = () => {
    const welcomeMessage: Message = {
      id: 'welcome-1',
      content: questions[0].content,
      sender: 'bot',
      timestamp: new Date(),
      component: questions[0].component
    };
    setMessages([welcomeMessage]);
    updateMemory({ conversation: [welcomeMessage] });
  };

  const updateMemory = (updates: Partial<EventMemory>) => {
    setEventMemory(prev => {
      const newMemory = { ...prev, ...updates };
      localStorage.setItem('lalilly-event-memory', JSON.stringify(newMemory));
      return newMemory;
    });
  };

  const addBotMessage = (content: string, component?: Message['component']) => {
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const newMessage: Message = {
          id: Date.now().toString(),
          content,
          sender: 'bot',
          timestamp: new Date(),
          component
        };
        setMessages(prev => {
          const newMessages = [...prev, newMessage];
          updateMemory({ conversation: newMessages });
          return newMessages;
        });
      }, 1000);
    }, 300);
  };

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => {
      const newMessages = [...prev, newMessage];
      updateMemory({ conversation: newMessages });
      return newMessages;
    });
  };

  const handleUserInput = (value: string) => {
    addUserMessage(value);
    
    // Update memory with the answer
    const field = questions[currentStep].field;
    const updates: Partial<EventMemory> = { [field]: value };
    updateMemory(updates);

    // Move to next step or transition to checklist
    const nextStep = currentStep + 1;
    if (nextStep < questions.length) {
      setCurrentStep(nextStep);
      addBotMessage(questions[nextStep].content, questions[nextStep].component);
    } else {
      // All questions answered - transition to checklist
      addBotMessage(
        "Perfect! Now I'll create your personalized event checklist. This detailed checklist will help you organize every aspect of your event and serves as the foundation for getting accurate, competitive bids from multiple vendors in our marketplace."
      );
      
      setTimeout(() => {
        generateAndShowChecklist();
      }, 3000);
    }
  };

  const generateAndShowChecklist = () => {
    const newChecklist = generateChecklistForEvent(
      eventMemory.event_type || '',
      eventMemory.guest_count || '',
      eventMemory.venue_status || ''
    );
    
    const checklistData: ChecklistData = {
      categories: newChecklist,
      lastUpdated: new Date()
    };
    
    updateMemory({ checklist_data: checklistData });

    // Add checklist link message to conversation
    const checklistLinkMessage: Message = {
      id: `checklist-link-${Date.now()}`,
      content: "Your customized event checklist is ready! Review and customize each requirement below. Once completed, we&apos;ll use this detailed information to connect you with verified vendors who will provide tailored bids for your event. Compare proposals, view vendor profiles, and choose the best match for your needs.",
      sender: 'bot',
      timestamp: new Date(),
      component: 'checklist-link'
    };
    
    setMessages(prev => {
      const newMessages = [...prev, checklistLinkMessage];
      updateMemory({ conversation: newMessages });
      return newMessages;
    });
  };


  const goToChecklist = () => {
    window.location.href = '/checklist';
  };

  const editChatResponse = (messageIndex: number) => {
    // Find which question this was and reset from that point
    let questionIndex = -1;
    let botMessageCount = 0;
    
    for (let i = 0; i <= messageIndex; i++) {
      if (messages[i].sender === 'bot' && messages[i].component) {
        questionIndex = botMessageCount;
        botMessageCount++;
      }
    }
    
    if (questionIndex >= 0) {
      setCurrentStep(questionIndex);
      setShowChecklist(false);
      
      // Reset memory fields from this point forward
      // Only reset string fields (event_type, date, location, guest_count, venue_status)
      const fieldsToReset = questions.slice(questionIndex).map(q => q.field);
      const updates: Partial<Pick<EventMemory, 'event_type' | 'date' | 'location' | 'guest_count' | 'venue_status'>> = {};
      fieldsToReset.forEach(field => {
        // Type guard: only reset string fields
        if (field === 'event_type' || field === 'date' || field === 'location' || field === 'guest_count' || field === 'venue_status') {
          updates[field] = '';
        }
      });
      
      updateMemory(updates);
      
      // Truncate conversation and add the question again
      const truncatedMessages = messages.slice(0, messageIndex);
      const questionMessage: Message = {
        id: `edit-${Date.now()}`,
        content: questions[questionIndex].content,
        sender: 'bot',
        timestamp: new Date(),
        component: questions[questionIndex].component
      };
      
      const newMessages = [...truncatedMessages, questionMessage];
      setMessages(newMessages);
      updateMemory({ conversation: newMessages });
    }
  };


  const resetAll = () => {
    localStorage.removeItem('lalilly-event-memory');
    window.location.reload();
  };

  const InputComponent = ({ message }: { message: Message }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = () => {
      if (!inputValue.trim()) return;
      handleUserInput(inputValue);
      setInputValue('');
    };

    switch (message.component) {
      case 'date-picker':
        return (
          <div className="mt-3">
            <input
              type="date"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
            />
            <button
              onClick={handleSubmit}
              disabled={!inputValue}
              className="mt-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        );

      case 'number-input':
        return (
          <div className="mt-3">
            <input
              type="number"
              placeholder="Number of people"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
            />
            <button
              onClick={handleSubmit}
              disabled={!inputValue}
              className="mt-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        );

      case 'yes-no':
        return (
          <div className="mt-3 space-y-2">
            <button
              onClick={() => handleUserInput('Yes, venue is already booked')}
              className="block w-full p-3 rounded-xl border border-neutral-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-left font-medium"
            >
              Yes, venue is already booked
            </button>
            <button
              onClick={() => handleUserInput('No, please help us find a venue')}
              className="block w-full p-3 rounded-xl border border-neutral-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-left font-medium"
            >
              No, please help us find a venue
            </button>
          </div>
        );

      case 'checklist-link':
        return (
          <div className="mt-4">
            <button
              onClick={goToChecklist}
              className="w-full p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Open Event Checklist
            </button>
            <p className="text-xs text-neutral-500 mt-2 text-center">
              Complete your requirements to get competitive vendor bids
            </p>
          </div>
        );

      default:
        return (
          <div className="mt-3">
            <input
              type="text"
              placeholder="Type your answer..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
            />
            <button
              onClick={handleSubmit}
              disabled={!inputValue}
              className="mt-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        );
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white pt-16">

      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Section with Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Event Planning Assistant</h1>
              <p className="text-neutral-600 text-sm">Tell us about your event and we&apos;ll help you plan it perfectly</p>
            </div>
            {(eventMemory.event_type || messages.length > 1) && (
              <button
                onClick={resetAll}
                className="text-sm px-4 py-2 rounded-xl border border-neutral-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
              >
                Start Over
              </button>
            )}
          </div>
          <ProgressIndicator 
            steps={JOURNEY_STEPS}
            currentStep="planning"
            completedSteps={currentStep >= 5 ? ['planning'] : []}
          />
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200/50 overflow-hidden">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-neutral-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="font-semibold text-neutral-900">LaLilly ChatBuilder</h1>
                      <p className="text-sm text-neutral-600">Your personal event planning assistant</p>
                    </div>
                  </div>
                  {eventMemory.event_type && (
                    <div className="text-sm text-neutral-600">
                      {eventMemory.event_type} • {eventMemory.date} • {eventMemory.location}
                    </div>
                  )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-[70vh] overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 relative ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'bg-neutral-100 text-neutral-900'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Edit button for user messages */}
                    {message.sender === 'user' && (
                      <button
                        onClick={() => editChatResponse(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white text-blue-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                    
                    {/* Input component for the latest bot message or checklist links */}
                    {message.sender === 'bot' && message.component && (
                      (index === messages.length - 1 || message.component === 'checklist-link') && (
                        <InputComponent message={message} />
                      )
                    )}
                  </div>
                </motion.div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-neutral-100 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}