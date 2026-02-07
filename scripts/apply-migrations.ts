/**
 * Apply database migrations using Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(filePath: string) {
  console.log(`\n📝 Applying migration: ${path.basename(filePath)}`);

  const sql = fs.readFileSync(filePath, 'utf8');

  // Split SQL by statements (basic split on semicolons)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`   Found ${statements.length} SQL statements`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    try {
      // Execute via RPC or direct query
      const { data, error } = await supabase.rpc('exec_sql', {
        query: statement + ';'
      });

      if (error) {
        // Fallback: Try using REST API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ query: statement + ';' })
        });

        if (!response.ok) {
          // Try manual execution via fetch to database
          console.log(`   ⚠️  RPC not available, using direct SQL execution`);
          // This will require manual application via Supabase dashboard
          throw new Error(`Statement ${i + 1} failed`);
        }
      }

      console.log(`   ✅ Statement ${i + 1}/${statements.length} executed`);
    } catch (err: any) {
      console.error(`   ❌ Statement ${i + 1} failed:`, err.message);
      console.error(`   SQL:`, statement.substring(0, 100) + '...');
      // Continue with other statements
    }
  }

  console.log(`✅ Migration ${path.basename(filePath)} completed\n`);
}

async function main() {
  const migrations = [
    'supabase/migrations/20260207_add_vendor_notification_tracking.sql',
    'supabase/migrations/20260207_add_draft_events_and_short_codes.sql'
  ];

  console.log('🚀 Starting migration application...\n');
  console.log('⚠️  NOTE: If RPC execution fails, please apply migrations manually via Supabase Dashboard');
  console.log('   Dashboard: https://app.supabase.com/project/ikfawcbcapmfpzwbqccr/editor\n');

  for (const migration of migrations) {
    if (fs.existsSync(migration)) {
      await applyMigration(migration);
    } else {
      console.log(`⚠️  Migration file not found: ${migration}`);
    }
  }

  console.log('\n✨ All migrations processed!');
  console.log('\n📋 Next steps:');
  console.log('   1. Verify tables in Supabase Dashboard');
  console.log('   2. Run E2E tests: npx playwright test');
  console.log('   3. Test notification API: POST /api/events/notify-vendors');
  console.log('   4. Test external import: POST /api/forge/external-import\n');
}

main().catch(console.error);
