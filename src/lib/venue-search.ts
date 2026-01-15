/**
 * EventFoundry Venue Search Integration
 * Provides venue search and checklist optimization for the app
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export interface VenueEventSpace {
  space_name: string;
  min_guests: number;
  max_guests: number;
  optimal_guests?: number;
  space_type: string;
  has_stage?: boolean;
  has_dance_floor?: boolean;
  natural_lighting?: boolean;
}

export interface VenueData {
  venue_id: string;
  basic_info: {
    official_name: string;
    brand_name?: string;
    aliases: string[];
    venue_type: string;
    star_rating?: number;
    google_rating?: number;
    total_reviews: number;
  };
  location: {
    address: string;
    landmark?: string;
    district: string;
    city: string;
    state: string;
    pin_code?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  contact: {
    phone_primary: string;
    phone_secondary?: string;
    email?: string;
    website?: string;
    whatsapp?: string;
    booking_manager?: {
      name: string;
      designation: string;
      contact: string;
    };
  };
  capacity: {
    event_spaces: VenueEventSpace[];
    total_rooms?: number;
    parking_capacity?: number;
  };
  catering: {
    in_house_catering: boolean;
    in_house_menu_types: string[];
    outside_catering_allowed: boolean;
    bar_service_available?: boolean;
    alcohol_policy?: string;
  };
  facilities: {
    ac_available: boolean;
    backup_power: boolean;
    wifi_available: boolean;
    projector_screen: boolean;
    sound_system: boolean;
    lighting_setup: boolean;
    green_rooms: number;
    wheelchair_accessible: boolean;
    parking_type?: string;
    accommodation_available: boolean;
    accommodation_rooms: number;
  };
  pricing: {
    base_venue_charge?: Record<string, number>;
    per_plate_cost_min?: number;
    per_plate_cost_max?: number;
    security_deposit?: number;
    taxes_included: boolean;
  };
  checklist_automation: {
    auto_populate_items: string[];
    conditional_removals: string[];
    conditional_additions: string[];
  };
  search_keywords: {
    primary_keywords: string[];
    secondary_keywords: string[];
    location_keywords: string[];
  };
  data_quality_score: number;
}

export interface VenueSearchFilters {
  min_capacity?: number;
  max_capacity?: number;
  has_kitchen?: boolean;
  has_parking?: boolean;
  has_accommodation?: boolean;
  venue_type?: string;
  price_max?: number;
}

export interface VenueSearchResult extends VenueData {
  match_score: number;
  match_type: 'exact' | 'fuzzy' | 'location';
  matched_keyword?: string;
}

class VenueSearchEngine {
  private venues: VenueData[] = [];
  private venuesDir: string;

  constructor() {
    // Point to venue-crawler data directory
    this.venuesDir = join(process.cwd(), 'venue-crawler', 'data', 'venues');
    this.loadVenues();
  }

  private loadVenues(): void {
    try {
      const files = readdirSync(this.venuesDir).filter(f => f.endsWith('.json'));

      this.venues = files.map(file => {
        const content = readFileSync(join(this.venuesDir, file), 'utf-8');
        return JSON.parse(content) as VenueData;
      });

      console.log(`✅ Loaded ${this.venues.length} venues`);
    } catch (error) {
      console.warn('⚠️ Could not load venue data:', error);
      this.venues = [];
    }
  }

  /**
   * Simple string similarity scoring (Levenshtein-like)
   */
  private similarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    // Exact match
    if (s1 === s2) return 100;

    // Contains match
    if (s1.includes(s2) || s2.includes(s1)) return 90;

    // Token matching
    const tokens1 = s1.split(/\s+/);
    const tokens2 = s2.split(/\s+/);

    let matchedTokens = 0;
    for (const t1 of tokens1) {
      for (const t2 of tokens2) {
        if (t1 === t2 || t1.includes(t2) || t2.includes(t1)) {
          matchedTokens++;
          break;
        }
      }
    }

    const maxTokens = Math.max(tokens1.length, tokens2.length);
    return Math.round((matchedTokens / maxTokens) * 85);
  }

  /**
   * Search venues by query and filters
   */
  search(
    query: string,
    filters?: VenueSearchFilters,
    maxResults: number = 10
  ): VenueSearchResult[] {
    if (!query.trim()) return [];

    const queryLower = query.toLowerCase().trim();
    const matches: VenueSearchResult[] = [];

    for (const venue of this.venues) {
      // Search in keywords
      const allKeywords = [
        ...venue.search_keywords.primary_keywords,
        ...venue.search_keywords.secondary_keywords,
        ...venue.basic_info.aliases,
        venue.basic_info.official_name
      ];

      let bestScore = 0;
      let matchedKeyword = '';

      for (const keyword of allKeywords) {
        const score = this.similarity(queryLower, keyword);
        if (score > bestScore) {
          bestScore = score;
          matchedKeyword = keyword;
        }
      }

      // Threshold: 60% minimum
      if (bestScore >= 60) {
        matches.push({
          ...venue,
          match_score: bestScore,
          match_type: bestScore === 100 ? 'exact' : 'fuzzy',
          matched_keyword: matchedKeyword
        });
      }
    }

    // Apply filters
    let filtered = this.applyFilters(matches, filters);

    // Sort by score
    filtered.sort((a, b) => b.match_score - a.match_score);

    return filtered.slice(0, maxResults);
  }

  private applyFilters(
    venues: VenueSearchResult[],
    filters?: VenueSearchFilters
  ): VenueSearchResult[] {
    if (!filters) return venues;

    return venues.filter(venue => {
      // Capacity filter
      if (filters.min_capacity || filters.max_capacity) {
        const hasMatchingSpace = venue.capacity.event_spaces.some(space => {
          const min = filters.min_capacity || 0;
          const max = filters.max_capacity || Infinity;
          return space.max_guests >= min && space.max_guests <= max;
        });
        if (!hasMatchingSpace) return false;
      }

      // Facility filters
      if (filters.has_kitchen && !venue.catering.in_house_catering) return false;
      if (filters.has_parking && !venue.capacity.parking_capacity) return false;
      if (filters.has_accommodation && !venue.facilities.accommodation_available) return false;

      // Venue type
      if (filters.venue_type && venue.basic_info.venue_type !== filters.venue_type) return false;

      // Price filter
      if (filters.price_max && venue.pricing.per_plate_cost_max &&
          venue.pricing.per_plate_cost_max > filters.price_max) return false;

      return true;
    });
  }

  /**
   * Get venue by ID
   */
  getVenueById(venueId: string): VenueData | null {
    return this.venues.find(v => v.venue_id === venueId) || null;
  }

  /**
   * Search by location
   */
  searchByLocation(area: string, maxResults: number = 10): VenueSearchResult[] {
    const areaLower = area.toLowerCase();
    const matches: VenueSearchResult[] = [];

    for (const venue of this.venues) {
      const address = venue.location.address.toLowerCase();
      const landmark = venue.location.landmark?.toLowerCase() || '';
      const locationKeywords = venue.search_keywords.location_keywords.join(' ').toLowerCase();

      if (address.includes(areaLower) || landmark.includes(areaLower) || locationKeywords.includes(areaLower)) {
        matches.push({
          ...venue,
          match_score: 90,
          match_type: 'location'
        });
      }
    }

    return matches.slice(0, maxResults);
  }

  /**
   * Get all venues
   */
  getAllVenues(): VenueData[] {
    return this.venues;
  }

  /**
   * Get venue count
   */
  getVenueCount(): number {
    return this.venues.length;
  }
}

// Singleton instance
let searchEngineInstance: VenueSearchEngine | null = null;

export function getVenueSearchEngine(): VenueSearchEngine {
  if (!searchEngineInstance) {
    searchEngineInstance = new VenueSearchEngine();
  }
  return searchEngineInstance;
}

export default VenueSearchEngine;
