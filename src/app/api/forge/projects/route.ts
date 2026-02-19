// Force Redeploy Sync - Vercel Fix
// Vercel Force Update 1
// POST /api/forge/projects - Create Forge Project
// GET /api/forge/projects - List all forge projects
// Aligned with CLAUDE.md Section 12: API Spec
// Uses Supabase SDK exclusively

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ✅ Fixed Imports using Path Aliases
import type { ClientBrief } from '@/types/blueprint';
import { withErrorHandler, validateRequired } from '@/lib/api-handler';
import { withAuth, type AuthenticatedUser } from '@/lib/api-auth';
import { ValidationError } from '@/lib/errors';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface CreateForgeProjectRequest {
  clientBrief: ClientBrief;
  blueprintId?: string;
  title?: string;
}

const handleCreateForgeProject = withErrorHandler(async (request: NextRequest, user: AuthenticatedUser) => {
  // Only clients can create forge projects
  if (user.user_type !== 'client') {
    throw new ValidationError('Only clients can create forge projects. Vendors can only view and bid on events.');
  }

  const body: CreateForgeProjectRequest = await request.json();
  const { clientBrief, blueprintId, title } = body;

  // Validate required fields
  validateRequired(body, ['clientBrief']);

  // Use authenticated user's ID as the owner
  const userId = user.id;

  // Create Supabase client with service role for admin operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get blueprint (either provided or select default)
  let blueprint = null;
  if (blueprintId) {
    const { data } = await supabase
      .from('blueprints')
      .select('*')
      .eq('event_type_key', blueprintId)
      .single();
    blueprint = data;
  }

  // If no blueprint found, use master blueprint
  if (!blueprint) {
    const { data } = await supabase
      .from('blueprints')
      .select('*')
      .eq('event_type_key', 'master_forge_blueprint')
      .single();
    blueprint = data;
  }

  // Generate project title if not provided
  const projectTitle = title || `${clientBrief.event_type} Forge - ${clientBrief.date || 'TBD'}`;

  // Parse guest count if it's a string
  const guestCount = typeof clientBrief.guest_count === 'string'
    ? parseInt(clientBrief.guest_count, 10)
    : clientBrief.guest_count;

  // Create forge project with OPEN_FOR_BIDS status to immediately show to vendors
  const { data: newProject, error } = await supabase
    .from('events')
    .insert({
      owner_user_id: userId,
      title: projectTitle,
      event_type: clientBrief.event_type || 'General Event',
      date: clientBrief.date || null,
      city: clientBrief.city || null,
      venue_status: clientBrief.venue_status || null,
      guest_count: guestCount || null,
      client_brief: clientBrief,
      forge_blueprint: blueprint?.content || blueprint || {},
      forge_status: 'OPEN_FOR_BIDS',
      bidding_closes_at: null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating forge project:', error);
    throw new Error(`Failed to create forge project: ${error.message}`);
  }

  return NextResponse.json({
    success: true,
    forgeProjectId: newProject.id,
    forgeProject: newProject,
  }, { status: 201 });
});

// Wrap with authentication
export const POST = withAuth(handleCreateForgeProject);

// GET /api/forge/projects - List all forge projects (with optional filters)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Build query with filters — select only events columns (no cross-table joins to avoid schema errors)
  let query = supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply filters
  if (userId) {
    query = query.eq('owner_user_id', userId);
  }
  if (status) {
    const statuses = status.split(',').map(s => s.trim());
    if (statuses.length > 1) {
      query = query.in('forge_status', statuses);
    } else {
      query = query.eq('forge_status', statuses[0]);
    }
  }

  const { data: projects, error } = await query;

  if (error) {
    console.error('Error fetching forge projects:', error);
    throw new Error(`Failed to fetch forge projects: ${error.message}`);
  }

  return NextResponse.json({
    success: true,
    projects: projects || [],
    count: projects?.length || 0,
  });
});