#!/usr/bin/env tsx
/**
 * Check Event Type in Database
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const EVENT_ID = '96f5e3d9-14d2-4122-940b-87d6f2300564';

async function checkEventType() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔍 Checking event type for:', EVENT_ID);
  console.log('');

  const { data, error } = await supabase
    .from('events')
    .select('id, title, event_type, client_brief')
    .eq('id', EVENT_ID)
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!data) {
    console.log('❌ Event not found');
    return;
  }

  console.log('✅ Event found:');
  console.log('');
  console.log('Title:', data.title);
  console.log('Event Type (column):', data.event_type);
  console.log('');
  console.log('Client Brief:');
  console.log(JSON.stringify(data.client_brief, null, 2));
  console.log('');
  console.log('Event Type from brief:', data.client_brief?.event_type);
}

checkEventType();
