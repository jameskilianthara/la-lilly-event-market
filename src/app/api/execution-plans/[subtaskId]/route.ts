// PATCH /api/execution-plans/[subtaskId]  — update status, assignment, etc.
// DELETE /api/execution-plans/[subtaskId] — delete a subtask

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth, type AuthenticatedUser } from '@/lib/api-auth';
import { ValidationError, DatabaseError } from '@/lib/errors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── PATCH ────────────────────────────────────────────────────────────────────
async function handleUpdate(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ subtaskId: string }> }
): Promise<NextResponse> {
  try {
    if (user.user_type !== 'vendor') throw new ValidationError('Only vendors can update execution plans');

    const { subtaskId } = await params;
    const body = await request.json();

    const allowed = [
      'subtask_title', 'subtask_description',
      'assigned_to_name', 'assigned_to_email',
      'due_date', 'status', 'sort_order',
    ];
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    // Verify ownership via vendor lookup
    const { data: vendor } = await supabase
      .from('vendors').select('id').eq('user_id', user.id).single();
    if (!vendor) throw new ValidationError('Vendor profile not found');

    const { data, error } = await supabase
      .from('execution_plans')
      .update(updates)
      .eq('id', subtaskId)
      .eq('vendor_id', vendor.id)
      .select()
      .single();

    if (error) throw new DatabaseError(`Failed to update subtask: ${error.message}`);
    if (!data) throw new ValidationError('Subtask not found or access denied');

    return NextResponse.json({ success: true, subtask: data });
  } catch (err: any) {
    const status = err?.statusCode || 500;
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status });
  }
}

// ── DELETE ───────────────────────────────────────────────────────────────────
async function handleDelete(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ subtaskId: string }> }
): Promise<NextResponse> {
  try {
    if (user.user_type !== 'vendor') throw new ValidationError('Only vendors can delete execution plans');

    const { subtaskId } = await params;

    const { data: vendor } = await supabase
      .from('vendors').select('id').eq('user_id', user.id).single();
    if (!vendor) throw new ValidationError('Vendor profile not found');

    const { error } = await supabase
      .from('execution_plans')
      .delete()
      .eq('id', subtaskId)
      .eq('vendor_id', vendor.id);

    if (error) throw new DatabaseError(`Failed to delete subtask: ${error.message}`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = err?.statusCode || 500;
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status });
  }
}

export const PATCH = withAuth(handleUpdate, { requiredUserType: ['vendor'] });
export const DELETE = withAuth(handleDelete, { requiredUserType: ['vendor'] });
