/**
 * Checklist Mapper - Maps event types to appropriate checklist files
 * Part of the new ForgeChat → Checklist → Blueprint workflow
 */

// Mapping table: event type keywords → checklist file name
// Complete mapping for all 10 dedicated event-specific checklists
// STRATEGIC PRIORITY ORDER: More specific keywords checked first to avoid conflicts
const CHECKLIST_MAPPING: Record<string, string[]> = {
  'wedding': ['wedding', 'marriage', 'nikah', 'shaadi', 'matrimony', 'reception', 'vivah', 'sangeet', 'mehendi', 'mehndi'],
  'engagement': ['engagement', 'ring ceremony', 'roka', 'sagai', 'betrothal'],
  'party': ['birthday', 'party', 'celebration', 'anniversary', 'milestone', 'theme party', 'college fest', 'fest'],
  'employee-engagement': ['corporate workshop', 'team workshop', 'corporate event', 'employee', 'team building', 'dealer meet', 'partner meet', 'training', 'town hall', 'annual day', 'offsite'],
  'conference': ['public workshop', 'public speaking workshop', 'conference', 'business seminar', 'meeting', 'seminar', 'symposium', 'business conference', 'workshop'],
  'exhibition': ['exhibition', 'expo', 'trade show', 'showcase', 'fair', 'display'],
  'film-events': ['film', 'movie', 'cinema', 'muhurat', 'trailer launch', 'music launch', 'premiere', 'celebrity'],
  'press-conference': ['product launch media', 'product launch with media', 'press conference', 'media event', 'press meet', 'media briefing', 'announcement', 'press release'],
  'promotional-activities': ['promotion', 'promotional', 'road show', 'brand activation', 'marketing campaign', 'street marketing', 'mall activation'],
  'inauguration': ['showroom opening', 'grand opening', 'ribbon cutting', 'business pooja', 'pooja ceremony', 'inauguration', 'opening', 'launch'],
};

// Fallback checklist for unknown event types
const FALLBACK_CHECKLIST = 'party'; // Most versatile checklist

/**
 * Maps an event type string to the appropriate checklist file name
 * @param eventType - The event type from ForgeChat (e.g., "Wedding", "Birthday Party")
 * @returns The checklist file name (without .json extension)
 */
export function mapEventTypeToChecklist(eventType: string): string {
  console.log('🔍 mapEventTypeToChecklist called with:', eventType);

  if (!eventType) {
    console.log('❌ No event type provided, using fallback:', FALLBACK_CHECKLIST);
    return FALLBACK_CHECKLIST;
  }

  const normalized = eventType.toLowerCase().trim();
  console.log('📝 Normalized event type:', normalized);

  // STRATEGIC MATCHING: Check compound keywords first (longer phrases have priority)
  // This ensures "corporate workshop" matches employee-engagement before "workshop" alone matches conference

  let bestMatch: { checklist: string; keyword: string; score: number } | null = null;

  for (const [checklistName, keywords] of Object.entries(CHECKLIST_MAPPING)) {
    for (const keyword of keywords) {
      // Check if keyword matches
      const matches = normalized.includes(keyword) || keyword.includes(normalized);

      if (matches) {
        // Score based on keyword length (longer = more specific = better match)
        const score = keyword.length;

        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { checklist: checklistName, keyword, score };
        }
      }
    }
  }

  if (bestMatch) {
    console.log(`✅ BEST MATCH: "${normalized}" → "${bestMatch.checklist}"`);
    console.log(`   Matched keyword: "${bestMatch.keyword}" (score: ${bestMatch.score})`);
    return bestMatch.checklist;
  }

  // Return fallback if no match found
  console.log(`⚠️ NO MATCH for "${normalized}", using fallback:`, FALLBACK_CHECKLIST);
  return FALLBACK_CHECKLIST;
}

/**
 * Gets the display name for a checklist type
 */
export function getChecklistDisplayName(checklistType: string): string {
  const displayNames: Record<string, string> = {
    'wedding': 'Wedding Event',
    'engagement': 'Engagement Ceremony',
    'party': 'Celebration',
    'conference': 'Corporate Event',
    'exhibition': 'Exhibition',
    'film-events': 'Film Event',
    'press-conference': 'Press Conference',
    'promotional-activities': 'Promotional Activity',
    'inauguration': 'Inauguration',
    'employee-engagement': 'Employee Engagement',
  };

  return displayNames[checklistType] || 'General Event';
}

/**
 * Gets all available checklist types
 */
export function getAvailableChecklists(): string[] {
  return Object.keys(CHECKLIST_MAPPING);
}
