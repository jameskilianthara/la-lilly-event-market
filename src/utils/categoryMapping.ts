// Category mapping system for routing projects to relevant vendors

export const VENDOR_SERVICE_CATEGORIES = [
  'Venue & Decor', 
  'Catering & Food', 
  'Photography & Video', 
  'Entertainment & Music',
  'Lighting & Sound', 
  'Transportation', 
  'Flowers & Arrangements', 
  'Security & Staff',
  'Equipment Rental', 
  'Wedding Planning', 
  'Corporate Events', 
  'Birthday Parties'
];

// Maps checklist categories to vendor service categories
export const CHECKLIST_TO_VENDOR_MAPPING: Record<string, string[]> = {
  // Wedding categories
  'Basic Info': ['Wedding Planning'],
  'Theme Options': ['Venue & Decor'],
  'Venue Arrangements': ['Venue & Decor'],
  'Food & Banquet': ['Catering & Food'],
  'Bride & Groom Arrival': ['Transportation', 'Entertainment & Music'],
  'Ceremonial Procession': ['Entertainment & Music'],
  'Decoration': ['Venue & Decor', 'Flowers & Arrangements'],
  'OnStage Arrangement': ['Venue & Decor'],
  'Flowers': ['Flowers & Arrangements'],
  'Manpower': ['Security & Staff', 'Wedding Planning'],
  'Other Activities': ['Entertainment & Music'],
  'Entertainment': ['Entertainment & Music'],
  'Gifts & Favours': ['Wedding Planning'],
  'Photography & Video': ['Photography & Video'],
  'Light & Sound': ['Lighting & Sound'],
  'Power': ['Equipment Rental'],
  'Support Services': ['Wedding Planning'],
  'Outdoor Infra': ['Equipment Rental', 'Venue & Decor'],

  // Birthday/Theme Party categories
  'Venue & Decor': ['Venue & Decor'],
  'Technical': ['Lighting & Sound', 'Equipment Rental'],
  
  // General categories
  'Decor & Branding': ['Venue & Decor'],
  'Permissions': ['Wedding Planning', 'Corporate Events']
};

/**
 * Gets relevant vendor service categories for a given checklist category
 */
export function getVendorCategoriesForChecklist(checklistCategory: string): string[] {
  return CHECKLIST_TO_VENDOR_MAPPING[checklistCategory] || [];
}

/**
 * Determines if a vendor should receive a project based on their services and project requirements
 */
export function shouldVendorReceiveProject(
  vendorServices: string[], 
  projectCategories: string[]
): boolean {
  return projectCategories.some(category => vendorServices.includes(category));
}

/**
 * Converts checklist categories to vendor service categories for project routing
 */
export function mapChecklistToVendorCategories(checklistCategories: string[]): string[] {
  const vendorCategories = new Set<string>();
  
  checklistCategories.forEach(category => {
    const mappedCategories = getVendorCategoriesForChecklist(category);
    mappedCategories.forEach(mapped => vendorCategories.add(mapped));
  });
  
  return Array.from(vendorCategories);
}

interface Vendor {
  services: string[];
  [key: string]: unknown;
}

/**
 * Gets all vendors that match the given project requirements
 */
export function getMatchingVendors(vendors: Vendor[], projectCategories: string[]): Vendor[] {
  return vendors.filter(vendor =>
    shouldVendorReceiveProject(vendor.services, projectCategories)
  );
}

/**
 * Calculates match score between vendor services and project requirements
 */
export function calculateMatchScore(vendorServices: string[], projectCategories: string[]): number {
  const matches = projectCategories.filter(category => vendorServices.includes(category));
  return projectCategories.length > 0 ? (matches.length / projectCategories.length) * 100 : 0;
}

const categoryMappingExports = {
  VENDOR_SERVICE_CATEGORIES,
  CHECKLIST_TO_VENDOR_MAPPING,
  getVendorCategoriesForChecklist,
  shouldVendorReceiveProject,
  mapChecklistToVendorCategories,
  getMatchingVendors,
  calculateMatchScore
};

export default categoryMappingExports;