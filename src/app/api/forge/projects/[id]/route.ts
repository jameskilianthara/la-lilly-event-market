// GET /api/forge/projects/:id - Retrieve Forge Project
// PATCH /api/forge/projects/:id - Update Forge Project
// Aligned with CLAUDE.md Section 12: API Spec
// Uses Supabase SDK exclusively

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandler } from '../../../../../lib/api-handler';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('[API] Fetching forge project:', id);

  // First, fetch the event (forge project) - simplified query
  const { data: forgeProject, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (eventError) {
    console.error('[API] Error fetching event:', eventError);
    return NextResponse.json(
      { error: 'Forge project not found', details: eventError.message },
      { status: 404 }
    );
  }

  if (!forgeProject) {
    console.error('[API] No forge project found for id:', id);
    return NextResponse.json(
      { error: 'Forge project not found' },
      { status: 404 }
    );
  }

  console.log('[API] Forge project found:', forgeProject.id);

  // Optionally fetch related data separately (avoid complex joins that might fail)
  // This is more robust than complex nested queries
  let owner = null;
  let blueprint = null;
  let bids = [];

  // Try to fetch owner (fail gracefully if users table doesn't exist or has issues)
  if (forgeProject.owner_user_id) {
    try {
      const { data: ownerData } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', forgeProject.owner_user_id)
        .single();
      owner = ownerData;
    } catch (err) {
      console.log('[API] Could not fetch owner, continuing without it');
    }
  }

  // Try to fetch blueprint (fail gracefully)
  if (forgeProject.blueprint_id) {
    try {
      const { data: blueprintData } = await supabase
        .from('blueprints')
        .select('id, event_type_key, content')
        .eq('id', forgeProject.blueprint_id)
        .single();
      blueprint = blueprintData;
    } catch (err) {
      console.log('[API] Could not fetch blueprint, continuing without it');
    }
  }

  // Try to fetch bids (fail gracefully)
  try {
    const { data: bidsData } = await supabase
      .from('bids')
      .select('*')
      .eq('event_id', id);
    bids = bidsData || [];
  } catch (err) {
    console.log('[API] Could not fetch bids, continuing without them');
  }

  // Return forge project with optional relations
  // Using 'event' key for backwards compatibility with bid page
  return NextResponse.json({
    success: true,
    event: {
      ...forgeProject,
      owner,
      blueprint,
      bids,
    },
    // Also include as forgeProject for clarity
    forgeProject: {
      ...forgeProject,
      owner,
      blueprint,
      bids,
    },
  });
});

// PATCH /api/forge/projects/:id - Update Forge Project
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  console.log('[API PATCH] Updating forge project:', id);

  const updates = await request.json();
  console.log('[API PATCH] Updates received:', Object.keys(updates));

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Validate updates (allow client_brief and other fields)
  const allowedUpdates = ['forge_status', 'forge_floor_price', 'bidding_closes_at', 'title', 'client_brief', 'forge_blueprint'];
  const updateData: Record<string, unknown> = {};

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      updateData[key] = updates[key];
      console.log(`[API PATCH] Including update: ${key}`);
    }
  }

  if (Object.keys(updateData).length === 0) {
    console.error('[API PATCH] No valid updates provided');
    return NextResponse.json(
      { error: 'No valid updates provided' },
      { status: 400 }
    );
  }

  console.log('[API PATCH] Executing Supabase update...');
  // Update forge project
  const { data: updatedProject, error } = await supabase
    .from('events')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[API PATCH] Supabase error:', error);
    return NextResponse.json(
      { error: 'Update failed', details: error.message },
      { status: 500 }
    );
  }

  if (!updatedProject) {
    console.error('[API PATCH] No project returned after update');
    return NextResponse.json(
      { error: 'Forge project not found' },
      { status: 404 }
    );
  }

  console.log('[API PATCH] ✅ Update successful:', updatedProject.id);

  return NextResponse.json({
    success: true,
    forgeProject: updatedProject,
  });
});
