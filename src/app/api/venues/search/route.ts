/**
 * Venue Search API Route
 * POST /api/venues/search
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVenueSearchEngine } from '@/lib/venue-search';
import type { VenueSearchFilters } from '@/lib/venue-search';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, filters, maxResults = 10 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    const searchEngine = getVenueSearchEngine();
    const results = searchEngine.search(
      query,
      filters as VenueSearchFilters,
      maxResults
    );

    return NextResponse.json({
      success: true,
      query,
      filters,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Venue search error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const searchEngine = getVenueSearchEngine();
    const count = searchEngine.getVenueCount();

    return NextResponse.json({
      success: true,
      message: 'Venue search API is operational',
      venue_count: count,
      endpoints: {
        search: 'POST /api/venues/search',
        by_id: 'GET /api/venues/[id]',
        by_location: 'GET /api/venues/location/[area]'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
