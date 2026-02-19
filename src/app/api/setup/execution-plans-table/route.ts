// One-time setup route — creates execution_plans table if it doesn't exist.
// Call GET /api/setup/execution-plans-table once, then this route can be deleted.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check if table already exists
  const { error: checkErr } = await supabase.from('execution_plans').select('id').limit(1);
  if (!checkErr) {
    return NextResponse.json({ status: 'already_exists' });
  }

  // Table doesn't exist — create it via raw SQL through pg_dump workaround:
  // Supabase JS client doesn't support raw DDL, so we use the Management API
  const projectRef = 'ikfawcbcapmfpzwbqccr';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const sql = `
CREATE TABLE IF NOT EXISTS execution_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  bid_id UUID REFERENCES bids(id) ON DELETE SET NULL,
  blueprint_section_id TEXT NOT NULL,
  blueprint_section_title TEXT NOT NULL DEFAULT '',
  blueprint_item_id TEXT NOT NULL,
  blueprint_item_label TEXT NOT NULL DEFAULT '',
  subtask_title TEXT NOT NULL,
  subtask_description TEXT,
  assigned_to_name TEXT,
  assigned_to_email TEXT,
  assigned_subcontractor_id UUID,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','done')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exec_plans_event_vendor ON execution_plans(event_id, vendor_id);
CREATE INDEX IF NOT EXISTS idx_exec_plans_bid ON execution_plans(bid_id);
ALTER TABLE execution_plans ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='execution_plans' AND policyname='exec_plans_vendor_select') THEN
    CREATE POLICY exec_plans_vendor_select ON execution_plans FOR SELECT USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='execution_plans' AND policyname='exec_plans_vendor_insert') THEN
    CREATE POLICY exec_plans_vendor_insert ON execution_plans FOR INSERT WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='execution_plans' AND policyname='exec_plans_vendor_update') THEN
    CREATE POLICY exec_plans_vendor_update ON execution_plans FOR UPDATE USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='execution_plans' AND policyname='exec_plans_vendor_delete') THEN
    CREATE POLICY exec_plans_vendor_delete ON execution_plans FOR DELETE USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));
  END IF;
END $$;
`;

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  const result = await res.json();
  if (!res.ok) {
    return NextResponse.json({ status: 'error', detail: result }, { status: 500 });
  }

  return NextResponse.json({ status: 'created', result });
}
