// GET  /api/execution-plans?event_id=&vendor_id=   — list subtasks for an event+vendor
// POST /api/execution-plans                         — create a subtask

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth, type AuthenticatedUser } from '@/lib/api-auth';
import { validateRequired } from '@/lib/api-handler';
import { ValidationError, DatabaseError } from '@/lib/errors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── GET ─────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId  = searchParams.get('event_id');
    const vendorId = searchParams.get('vendor_id');

    if (!eventId || !vendorId) {
      return NextResponse.json({ error: 'event_id and vendor_id are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('execution_plans')
      .select('*')
      .eq('event_id', eventId)
      .eq('vendor_id', vendorId)
      .order('blueprint_section_id')
      .order('blueprint_item_id')
      .order('sort_order');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, subtasks: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}

// ── POST ────────────────────────────────────────────────────────────────────
async function handleCreate(request: NextRequest, user: AuthenticatedUser) {
  try {
  if (user.user_type !== 'vendor') {
    return NextResponse.json({ error: 'Only vendors can create execution plans' }, { status: 403 });
  }

  const body = await request.json();
  const {
    event_id, vendor_id, bid_id,
    blueprint_section_id, blueprint_section_title,
    blueprint_item_id, blueprint_item_label,
    subtask_title, subtask_description,
    assigned_to_name, assigned_to_email,
    due_date, sort_order,
  } = body;

  validateRequired(body, ['event_id', 'vendor_id', 'blueprint_section_id', 'blueprint_item_id', 'subtask_title']);

  const { data, error } = await supabase
    .from('execution_plans')
    .insert({
      event_id, vendor_id, bid_id: bid_id || null,
      blueprint_section_id, blueprint_section_title: blueprint_section_title || blueprint_section_id,
      blueprint_item_id, blueprint_item_label: blueprint_item_label || blueprint_item_id,
      subtask_title, subtask_description: subtask_description || null,
      assigned_to_name: assigned_to_name || null,
      assigned_to_email: assigned_to_email || null,
      due_date: due_date || null,
      sort_order: sort_order ?? 0,
      status: 'not_started',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: `Failed to create subtask: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, subtask: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}

export const POST = withAuth(handleCreate, { requiredUserType: ['vendor'] });
