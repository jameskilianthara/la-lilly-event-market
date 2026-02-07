/**
 * Get Venue by ID API Route
 * GET /api/venues/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVenueSearchEngine } from '@/lib/venue-search';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Venue ID is required' },
        { status: 400 }
      );
    }

    const searchEngine = getVenueSearchEngine();
    const venue = searchEngine.getVenueById(id);

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found', venue_id: id },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      venue
    });
  } catch (error) {
    console.error('Get venue error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: String(error) },
      { status: 500 }
    );
  }
}
