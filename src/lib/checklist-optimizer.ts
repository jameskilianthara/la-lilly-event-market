/**
 * EventFoundry Checklist Auto-Optimization
 * Auto-populate checklist items based on selected venue
 */

import type { VenueData } from './venue-search';

export interface ChecklistItem {
  id: string;
  label: string;
  auto_populated?: boolean;
  venue_value?: string;
  priority?: string;
  details?: string;
  reason?: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  description?: string;
  items: ChecklistItem[];
}

export interface Checklist {
  eventType: string;
  sections: ChecklistSection[];
}

export interface OptimizedChecklist {
  original_checklist: Checklist;
  venue_id: string;
  venue_name: string;
  sections: ChecklistSection[];
  auto_populated_count: number;
  removed_items_count: number;
  added_items_count: number;
  optimization_summary: Array<{
    action: 'auto_populated' | 'removed' | 'added';
    item: string;
    value?: string;
    reason?: string;
  }>;
}

export class ChecklistOptimizer {
  /**
   * Optimize checklist based on venue selection
   */
  optimizeChecklist(checklist: Checklist, venue: VenueData): OptimizedChecklist {
    const optimized: OptimizedChecklist = {
      original_checklist: checklist,
      venue_id: venue.venue_id,
      venue_name: venue.basic_info.official_name,
      sections: [],
      auto_populated_count: 0,
      removed_items_count: 0,
      added_items_count: 0,
      optimization_summary: []
    };

    // Process each section
    for (const section of checklist.sections) {
      const optimizedSection: ChecklistSection = {
        id: section.id,
        title: section.title,
        description: section.description,
        items: []
      };

      // Process each item
      for (const item of section.items) {
        // Check for removal
        const shouldRemove = this.shouldRemoveItem(item.id, venue);
        if (shouldRemove.remove) {
          optimized.removed_items_count++;
          optimized.optimization_summary.push({
            action: 'removed',
            item: item.label,
            reason: shouldRemove.reason
          });
          continue; // Skip this item
        }

        // Check for auto-population
        const autoValue = this.getAutoValue(item.id, venue);
        const optimizedItem = { ...item };

        if (autoValue) {
          optimizedItem.auto_populated = true;
          optimizedItem.venue_value = autoValue;
          optimized.auto_populated_count++;
          optimized.optimization_summary.push({
            action: 'auto_populated',
            item: item.label,
            value: autoValue
          });
        }

        optimizedSection.items.push(optimizedItem);
      }

      optimized.sections.push(optimizedSection);
    }

    // Add conditional items
    const additionalItems = this.getAdditionalItems(venue);
    if (additionalItems.length > 0) {
      const venueSection: ChecklistSection = {
        id: 'venue_coordination',
        title: 'Venue-Specific Coordination',
        description: 'Additional tasks based on selected venue capabilities',
        items: additionalItems
      };
      optimized.sections.push(venueSection);
      optimized.added_items_count = additionalItems.length;

      for (const item of additionalItems) {
        optimized.optimization_summary.push({
          action: 'added',
          item: item.label,
          reason: item.reason || 'Venue-specific requirement'
        });
      }
    }

    return optimized;
  }

  /**
   * Check if item should be removed
   */
  private shouldRemoveItem(itemId: string, venue: VenueData): { remove: boolean; reason?: string } {
    const removalRules: Record<string, (v: VenueData) => boolean> = {
      'venue_search_required': () => true,
      'venue_shortlisting': () => true,
      'parking_arrangement': (v) => (v.capacity.parking_capacity || 0) > 0,
      'external_caterer_search': (v) => v.catering.in_house_catering && !v.catering.outside_catering_allowed,
      'accommodation_search': (v) => v.facilities.accommodation_available && v.facilities.accommodation_rooms >= 20
    };

    const rule = removalRules[itemId];
    if (rule && rule(venue)) {
      const reasons: Record<string, string> = {
        'venue_search_required': 'Venue already confirmed',
        'venue_shortlisting': 'Venue selection complete',
        'parking_arrangement': 'Venue has parking',
        'external_caterer_search': 'Venue requires in-house catering only',
        'accommodation_search': 'Venue provides sufficient accommodation'
      };
      return { remove: true, reason: reasons[itemId] };
    }

    return { remove: false };
  }

  /**
   * Get auto-populated value for item
   */
  private getAutoValue(itemId: string, venue: VenueData): string | null {
    const autoRules: Record<string, (v: VenueData) => string | null> = {
      'venue_confirmed': (v) => v.basic_info.official_name,
      'venue_capacity': (v) => v.capacity.event_spaces[0]?.max_guests?.toString() || null,
      'venue_address': (v) => v.location.address,
      'venue_contact': (v) => v.contact.phone_primary,
      'ac_availability': (v) => v.facilities.ac_available ? '✓ Confirmed - Venue has AC' : null,
      'backup_power': (v) => v.facilities.backup_power ? '✓ Confirmed - Venue has backup power' : null,
      'sound_system': (v) => v.facilities.sound_system ? '✓ Venue provides sound system' : null,
      'projector_screen': (v) => v.facilities.projector_screen ? '✓ Venue provides projector/screen' : null,
      'parking_available': (v) => v.capacity.parking_capacity ? `✓ Venue parking for ${v.capacity.parking_capacity} vehicles` : null,
      'catering_confirmed': (v) => v.catering.in_house_catering ? '✓ In-house catering available' : null,
      'menu_types_available': (v) => v.catering.in_house_menu_types.length > 0 ? v.catering.in_house_menu_types.join(', ') : null,
      'accommodation_available': (v) => v.facilities.accommodation_available ? `✓ ${v.facilities.accommodation_rooms} rooms available` : null
    };

    const rule = autoRules[itemId];
    return rule ? rule(venue) : null;
  }

  /**
   * Get additional items to add
   */
  private getAdditionalItems(venue: VenueData): ChecklistItem[] {
    const items: ChecklistItem[] = [];

    // External caterer coordination
    if (!venue.catering.in_house_catering || venue.catering.outside_catering_allowed) {
      items.push({
        id: 'external_caterer_coordination',
        label: 'Coordinate external caterer approval with venue',
        priority: 'high',
        reason: `Required based on venue: ${venue.basic_info.official_name}`
      });
    }

    // Room block booking
    if (venue.facilities.accommodation_available) {
      items.push({
        id: 'room_block_booking',
        label: 'Book room blocks for guests',
        priority: 'medium',
        details: `${venue.facilities.accommodation_rooms} rooms available at venue`,
        reason: `Venue offers accommodation`
      });
    }

    // Valet parking
    if (venue.facilities.parking_type === 'valet') {
      items.push({
        id: 'valet_parking_arrangement',
        label: 'Confirm valet parking service with venue',
        priority: 'medium',
        reason: 'Venue offers valet parking'
      });
    }

    return items;
  }

  /**
   * Generate human-readable optimization report
   */
  generateReport(optimized: OptimizedChecklist): string {
    const lines: string[] = [];
    lines.push('='.repeat(60));
    lines.push('CHECKLIST OPTIMIZATION REPORT');
    lines.push('='.repeat(60));
    lines.push(`\nVenue: ${optimized.venue_name}`);
    lines.push(`Venue ID: ${optimized.venue_id}\n`);
    lines.push(`Auto-Populated Items: ${optimized.auto_populated_count}`);
    lines.push(`Removed Items: ${optimized.removed_items_count}`);
    lines.push(`Added Items: ${optimized.added_items_count}\n`);
    lines.push('OPTIMIZATION DETAILS:');
    lines.push('-'.repeat(60));

    for (const change of optimized.optimization_summary) {
      const action = change.action.toUpperCase();

      if (action === 'AUTO_POPULATED') {
        lines.push(`\n✓ ${action}: ${change.item}`);
        lines.push(`  Value: ${change.value}`);
      } else if (action === 'REMOVED') {
        lines.push(`\n✗ ${action}: ${change.item}`);
        lines.push(`  Reason: ${change.reason}`);
      } else if (action === 'ADDED') {
        lines.push(`\n+ ${action}: ${change.item}`);
        lines.push(`  Reason: ${change.reason}`);
      }
    }

    lines.push('\n' + '='.repeat(60));
    return lines.join('\n');
  }
}

// Singleton instance
let optimizerInstance: ChecklistOptimizer | null = null;

export function getChecklistOptimizer(): ChecklistOptimizer {
  if (!optimizerInstance) {
    optimizerInstance = new ChecklistOptimizer();
  }
  return optimizerInstance;
}

export default ChecklistOptimizer;
