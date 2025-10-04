interface ClientBrief {
  event_type?: string;
  date?: string;
  city?: string;
  guest_count?: string;
  venue_status?: string;
}

interface ForgeBlueprint {
  id: string;
  eventType: string;
  displayName: string;
  version: string;
  forgeComplexity: 'apprentice' | 'craftsman' | 'master';
  sections: BlueprintSection[];
}

interface BlueprintSection {
  id: string;
  title: string;
  description: string;
  items: BlueprintItem[];
}

interface BlueprintItem {
  id: string;
  label: string;
  required?: boolean;
  category?: string;
}

// Deterministic mapping table - as specified in CLAUDE.md
const FORGE_MAPPING: Record<string, string[]> = {
  'wedding_forge': ['wedding', 'marriage', 'nikah', 'shaadi', 'matrimony'],
  'corporate_forge': ['corporate', 'business', 'conference', 'meeting', 'seminar', 'workshop'],
  'celebration_forge': ['birthday', 'anniversary', 'milestone', 'achievement', 'celebration'],
  'product_launch_forge': ['launch', 'product launch', 'unveiling', 'reveal'],
  'exhibition_forge': ['exhibition', 'expo', 'trade show', 'showcase'],
  'cultural_forge': ['cultural', 'festival', 'tradition', 'ceremony'],
  'entertainment_forge': ['concert', 'show', 'performance', 'entertainment'],
  'social_forge': ['party', 'gathering', 'social', 'mixer', 'networking']
};

// Mock blueprint templates (in production, these would be loaded from /forge-blueprints/)
const FORGE_BLUEPRINTS: Record<string, ForgeBlueprint> = {
  'wedding_forge': {
    id: 'wedding_forge',
    eventType: 'Wedding',
    displayName: 'Wedding Blueprint',
    version: '2025-09-01',
    forgeComplexity: 'master',
    sections: [
      {
        id: 'foundation_specs',
        title: 'Foundation Specifications',
        description: 'Core structural requirements for your wedding forge',
        items: [
          { id: 'ceremony_tradition', label: 'Cultural traditions and customs to honor?', required: true },
          { id: 'celebration_style', label: 'Wedding style and aesthetic vision?', required: true },
          { id: 'guest_experience', label: 'Special moments to craft for guests?', required: false }
        ]
      },
      {
        id: 'craft_elements',
        title: 'Craft Elements',
        description: 'Artistic and aesthetic specifications',
        items: [
          { id: 'decor_style', label: 'Decorative style and theme preferences', required: true },
          { id: 'floral_vision', label: 'Floral arrangements and natural elements', required: true },
          { id: 'lighting_mood', label: 'Lighting atmosphere and ambiance', required: true }
        ]
      }
    ]
  },
  'corporate_forge': {
    id: 'corporate_forge',
    eventType: 'Corporate',
    displayName: 'Corporate Blueprint',
    version: '2025-09-01',
    forgeComplexity: 'craftsman',
    sections: [
      {
        id: 'business_foundation',
        title: 'Business Foundation',
        description: 'Professional event requirements',
        items: [
          { id: 'business_objective', label: 'Primary business objective for this event?', required: true },
          { id: 'brand_representation', label: 'Brand guidelines and corporate identity?', required: true },
          { id: 'networking_goals', label: 'Networking and engagement objectives?', required: false }
        ]
      },
      {
        id: 'professional_elements',
        title: 'Professional Elements',
        description: 'Corporate-specific requirements',
        items: [
          { id: 'av_requirements', label: 'Audio-visual and presentation needs', required: true },
          { id: 'catering_style', label: 'Professional catering preferences', required: true },
          { id: 'accessibility', label: 'Accessibility and accommodation needs', required: true }
        ]
      }
    ]
  },
  'celebration_forge': {
    id: 'celebration_forge',
    eventType: 'Celebration',
    displayName: 'Celebration Blueprint',
    version: '2025-09-01',
    forgeComplexity: 'craftsman',
    sections: [
      {
        id: 'celebration_vision',
        title: 'Celebration Vision',
        description: 'Personal celebration requirements',
        items: [
          { id: 'celebration_theme', label: 'Theme and style for the celebration?', required: true },
          { id: 'special_moments', label: 'Key moments to highlight?', required: true },
          { id: 'guest_experience', label: 'Experience you want guests to have?', required: false }
        ]
      },
      {
        id: 'party_elements',
        title: 'Party Elements',
        description: 'Fun and entertainment specifications',
        items: [
          { id: 'entertainment', label: 'Entertainment and activities planned', required: true },
          { id: 'food_beverage', label: 'Food and beverage preferences', required: true },
          { id: 'decor_style', label: 'Decorative elements and styling', required: true }
        ]
      }
    ]
  },
  'master_forge_blueprint': {
    id: 'master_forge_blueprint',
    eventType: 'Universal',
    displayName: 'Master Blueprint',
    version: '2025-09-01',
    forgeComplexity: 'master',
    sections: [
      {
        id: 'universal_foundation',
        title: 'Universal Foundation',
        description: 'Core requirements for any event type',
        items: [
          { id: 'event_vision', label: 'Overall vision and objectives for your event?', required: true },
          { id: 'guest_experience', label: 'Experience you want to create for guests?', required: true },
          { id: 'success_metrics', label: 'How will you measure success?', required: false }
        ]
      },
      {
        id: 'craft_specifications',
        title: 'Craft Specifications',
        description: 'Detailed event specifications',
        items: [
          { id: 'venue_requirements', label: 'Specific venue and space requirements', required: true },
          { id: 'service_needs', label: 'Services and vendors needed', required: true },
          { id: 'timeline_constraints', label: 'Timeline and scheduling constraints', required: true },
          { id: 'budget_considerations', label: 'Budget priorities and considerations', required: false }
        ]
      }
    ]
  }
};

function normalizeEventType(eventType: string): string | null {
  const normalized = eventType.toLowerCase().trim();

  // Find matching key in mapping table
  for (const [key, values] of Object.entries(FORGE_MAPPING)) {
    if (values.some(value => normalized.includes(value) || value.includes(normalized))) {
      return key;
    }
  }

  return null; // Will trigger fallback blueprint
}

export async function selectForgeBlueprint(clientBrief: ClientBrief): Promise<ForgeBlueprint> {
  // Simulate API delay for realistic feel
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

  if (!clientBrief.event_type) {
    return FORGE_BLUEPRINTS['master_forge_blueprint'];
  }

  const canonicalKey = normalizeEventType(clientBrief.event_type);

  if (canonicalKey && FORGE_BLUEPRINTS[canonicalKey]) {
    return FORGE_BLUEPRINTS[canonicalKey];
  }

  // Fallback to master blueprint
  return FORGE_BLUEPRINTS['master_forge_blueprint'];
}

// Utility function to get blueprint by ID (for loading saved sessions)
export function getBlueprintById(blueprintId: string): ForgeBlueprint | null {
  return FORGE_BLUEPRINTS[blueprintId] || null;
}

// Utility function to get all available blueprints
export function getAllForgeBlueprints(): ForgeBlueprint[] {
  return Object.values(FORGE_BLUEPRINTS);
}

// Enhanced selection with confidence scoring (for admin/debug purposes)
export async function selectForgeBlueprintWithConfidence(clientBrief: ClientBrief): Promise<{
  blueprint: ForgeBlueprint;
  confidence: number;
  alternatives: Array<{ blueprint: ForgeBlueprint; confidence: number }>;
}> {
  const blueprint = await selectForgeBlueprint(clientBrief);

  // For now, return full confidence for exact matches, lower for fallback
  const confidence = blueprint.id === 'master_forge_blueprint' ? 0.7 : 0.95;

  return {
    blueprint,
    confidence,
    alternatives: [] // Could be implemented for ambiguous cases
  };
}