// GET /api/forge/projects/[projectId] - Fetch a single forge project by ID
// PATCH /api/forge/projects/[projectId] - Update a forge project
// Aligned with CLAUDE.md Section 12: API Spec

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the forge project/event
    const { data: forgeProject, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error || !forgeProject) {
      console.error('Error fetching forge project:', error);
      return NextResponse.json(
        { error: 'Forge project not found', details: error?.message },
        { status: 404 }
      );
    }

    // Return the forge project
    return NextResponse.json({
      forgeProject,
      success: true
    });

  } catch (error: any) {
    console.error('Unexpected error fetching forge project:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();

    const { client_brief, forge_blueprint } = body;

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update the forge project
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (client_brief) {
      updateData.client_brief = client_brief;
    }

    if (forge_blueprint) {
      updateData.forge_blueprint = forge_blueprint;
    }

    const { data: updatedProject, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating forge project:', error);
      return NextResponse.json(
        { error: 'Failed to update forge project', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      forgeProject: updatedProject,
      success: true
    });

  } catch (error: any) {
    console.error('Unexpected error updating forge project:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
