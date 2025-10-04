import { mapChecklistToVendorCategories } from './categoryMapping';

interface ChecklistData {
  categories: {
    id: string;
    name: string;
    subcategories: {
      id: string;
      name: string;
      items: {
        id: string;
        name: string;
        checked: boolean;
        customNote: string;
      }[];
    }[];
  }[];
}

interface EventMemory {
  event_type: string;
  date: string;
  location: string;
  guest_count: string;
  venue_status: string;
  checklist_data?: ChecklistData;
}

interface ProjectBrief {
  id: string;
  clientName: string;
  eventType: string;
  eventDate: string;
  location: string;
  guestCount: string;
  venueStatus: string;
  requirements: Record<string, string[]>;
  status: 'new' | 'viewed' | 'bid_submitted' | 'closed';
  createdDate: Date;
  categories: string[];
  budget?: string;
  description?: string;
}

/**
 * Generates a project brief from event memory and checklist data
 */
export function generateProjectBrief(eventMemory: EventMemory): ProjectBrief {
  const briefId = `proj-${Date.now()}`;
  const requirements: Record<string, string[]> = {};
  const categories: string[] = [];

  // Extract requirements from checklist
  if (eventMemory.checklist_data) {
    eventMemory.checklist_data.categories.forEach(category => {
      const categoryRequirements: string[] = [];
      
      category.subcategories.forEach(subcategory => {
        subcategory.items.forEach(item => {
          if (item.checked) {
            let requirement = item.name;
            if (item.customNote.trim()) {
              requirement += ` (${item.customNote})`;
            }
            categoryRequirements.push(requirement);
          }
        });
      });

      if (categoryRequirements.length > 0) {
        requirements[category.name] = categoryRequirements;
        
        // Map to vendor categories
        const vendorCategories = mapChecklistToVendorCategories([category.name]);
        categories.push(...vendorCategories);
      }
    });
  }

  // Remove duplicates from categories
  const uniqueCategories = Array.from(new Set(categories));

  // Generate client name (in real app, this would come from user profile)
  const clientName = generateClientName(eventMemory.event_type);

  // Estimate budget range based on event type and guest count
  const budget = estimateBudget(eventMemory.event_type, parseInt(eventMemory.guest_count));

  return {
    id: briefId,
    clientName,
    eventType: eventMemory.event_type,
    eventDate: eventMemory.date,
    location: eventMemory.location,
    guestCount: eventMemory.guest_count,
    venueStatus: eventMemory.venue_status,
    requirements,
    status: 'new',
    createdDate: new Date(),
    categories: uniqueCategories,
    budget,
    description: generateEventDescription(eventMemory, Object.keys(requirements).length)
  };
}

interface VendorData {
  city: string;
  services: string[];
  projects?: ProjectBrief[];
  companyName: string;
  [key: string]: unknown;
}

/**
 * Simulates sending project brief to relevant vendors
 */
export function sendProjectToVendors(projectBrief: ProjectBrief): { sentToVendors: number; matchingVendors: string[] } {
  // In real implementation, this would:
  // 1. Query vendors from database based on location and services
  // 2. Filter vendors matching the project categories
  // 3. Send notifications/emails to matching vendors
  // 4. Add project to their dashboard inbox

  // For now, simulate this process
  const existingVendors = JSON.parse(localStorage.getItem('lalilly-vendors') || '[]') as VendorData[];

  // Filter vendors by location and services
  const [city] = projectBrief.location.split(',');
  const matchingVendors = existingVendors.filter((vendor: VendorData) =>
    vendor.city.toLowerCase() === city.toLowerCase().trim() &&
    vendor.services.some((service: string) => projectBrief.categories.includes(service))
  );

  // Add project to matching vendors' inboxes
  matchingVendors.forEach((vendor: VendorData) => {
    if (!vendor.projects) vendor.projects = [];
    vendor.projects.push(projectBrief);
  });

  // Update vendors in localStorage
  localStorage.setItem('lalilly-vendors', JSON.stringify(existingVendors));

  // Also store the project brief separately for tracking
  const existingProjects = JSON.parse(localStorage.getItem('lalilly-projects') || '[]') as ProjectBrief[];
  existingProjects.push(projectBrief);
  localStorage.setItem('lalilly-projects', JSON.stringify(existingProjects));

  return {
    sentToVendors: matchingVendors.length,
    matchingVendors: matchingVendors.map((v: VendorData) => v.companyName)
  };
}

/**
 * Generates a realistic client name based on event type
 */
function generateClientName(eventType: string): string {
  const names = {
    'Wedding': [
      'Rahul & Priya Wedding',
      'Arjun & Kavya Wedding',
      'Vikram & Anjali Wedding',
      'Rohan & Meera Wedding',
      'Aditya & Shreya Wedding'
    ],
    'Birthday/Theme Party': [
      "Aarav's 8th Birthday",
      "Diya's Sweet 16",
      "Krishnan's 25th Birthday",
      "Little Arya's 5th Birthday",
      "Ravi's 40th Celebration"
    ],
    'Corporate Event': [
      'Tech Corp Annual Meet',
      'InnovateTech Conference',
      'StartupHub Networking',
      'BusinessPro Summit',
      'TechFest 2024'
    ]
  };

  const eventTypeKey = Object.keys(names).find(key =>
    eventType.toLowerCase().includes(key.toLowerCase())
  ) || 'Corporate Event';

  const nameList = names[eventTypeKey as keyof typeof names];
  return nameList[Math.floor(Math.random() * nameList.length)];
}

/**
 * Estimates budget based on event type and guest count
 */
function estimateBudget(eventType: string, guestCount: number): string {
  const baseRates = {
    'Wedding': 2000, // per guest
    'Birthday': 800,
    'Corporate': 1200
  };

  const eventKey = Object.keys(baseRates).find(key => 
    eventType.toLowerCase().includes(key.toLowerCase())
  ) || 'Corporate';

  const baseRate = baseRates[eventKey as keyof typeof baseRates];
  const estimatedCost = baseRate * guestCount;

  // Create range
  const lowerBound = Math.round(estimatedCost * 0.7 / 100000) * 100000;
  const upperBound = Math.round(estimatedCost * 1.3 / 100000) * 100000;

  if (lowerBound >= 1000000) {
    return `₹${lowerBound / 100000}-${upperBound / 100000} Lakhs`;
  } else {
    return `₹${Math.round(lowerBound / 1000)}-${Math.round(upperBound / 1000)}K`;
  }
}

/**
 * Generates event description based on requirements
 */
function generateEventDescription(eventMemory: EventMemory, requirementCount: number): string {
  const descriptions = {
    'Wedding': `Traditional ${eventMemory.event_type.toLowerCase()} celebration for ${eventMemory.guest_count} guests. The couple is looking for a memorable experience with ${requirementCount} specific requirement categories to ensure their special day is perfect.`,
    'Birthday': `Fun-filled ${eventMemory.event_type.toLowerCase()} celebration for ${eventMemory.guest_count} guests. Looking for creative and engaging services across ${requirementCount} categories to make this birthday unforgettable.`,
    'Corporate': `Professional ${eventMemory.event_type.toLowerCase()} for ${eventMemory.guest_count} attendees. Seeking high-quality services across ${requirementCount} categories to ensure a successful business event.`
  };

  const eventKey = Object.keys(descriptions).find(key => 
    eventMemory.event_type.toLowerCase().includes(key.toLowerCase())
  ) || 'Corporate';

  return descriptions[eventKey as keyof typeof descriptions];
}

const projectBriefGeneratorExports = {
  generateProjectBrief,
  sendProjectToVendors
};

export default projectBriefGeneratorExports;