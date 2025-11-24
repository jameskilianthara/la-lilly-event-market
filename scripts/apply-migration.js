#!/usr/bin/env node

/**
 * Apply database migration to Supabase
 * Reads migration file and executes it using Supabase admin client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration(migrationFile) {
  console.log(`📄 Reading migration: ${migrationFile}`);

  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('🚀 Applying migration to Supabase...\n');
  console.log(sql);
  console.log('\n');

  try {
    // Execute the SQL using Supabase RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    console.log('\n📊 Result:', data);
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    console.log('\n⚠️  Note: If the RPC function does not exist, you need to apply this migration manually:');
    console.log('1. Go to your Supabase Dashboard: https://app.supabase.com');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Paste and run the migration SQL shown above');
    process.exit(1);
  }
}

// Get migration file from command line or use default
const migrationFile = process.argv[2] || '20250131_fix_users_insert_policy.sql';

applyMigration(migrationFile);
