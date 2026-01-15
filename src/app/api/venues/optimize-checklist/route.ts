/**
 * Checklist Optimization API Route
 * POST /api/venues/optimize-checklist
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVenueSearchEngine } from '@/lib/venue-search';
import { getChecklistOptimizer } from '@/lib/checklist-optimizer';
import type { Checklist } from '@/lib/checklist-optimizer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { checklist, venue_id } = body;

    if (!checklist || !venue_id) {
      return NextResponse.json(
        { error: 'Both checklist and venue_id are required' },
        { status: 400 }
      );
    }

    // Get venue
    const searchEngine = getVenueSearchEngine();
    const venue = searchEngine.getVenueById(venue_id);

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found', venue_id },
        { status: 404 }
      );
    }

    // Optimize checklist
    const optimizer = getChecklistOptimizer();
    const optimized = optimizer.optimizeChecklist(checklist as Checklist, venue);

    return NextResponse.json({
      success: true,
      optimized
    });
  } catch (error) {
    console.error('Checklist optimization error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: String(error) },
      { status: 500 }
    );
  }
}
