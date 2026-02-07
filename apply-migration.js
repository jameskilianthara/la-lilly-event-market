const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://ikfawcbcapmfpzwbqccr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZmF3Y2JjYXBtZnB6d2JxY2NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM1MjUzNywiZXhwIjoyMDc2OTI4NTM3fQ.VHDRD3drxZ26pAOvU27myoHO8utoMWxnmX4yeRybUCo'
);

async function applyMigration() {
  console.log('Reading migration file...');
  const sql = fs.readFileSync('./supabase/migrations/20260204_add_winner_selected_status.sql', 'utf8');

  console.log('Applying migration...\n');
  console.log(sql);
  console.log('\n---\n');

  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (stmt.toUpperCase().startsWith('COMMENT')) {
      console.log(`Skipping COMMENT statement (${i + 1}/${statements.length})`);
      continue;
    }

    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: stmt });

    if (error) {
      console.error(`Error executing statement ${i + 1}:`, error);
      // Try direct query as fallback
      console.log('Trying direct query...');
      const response = await fetch(`https://ikfawcbcapmfpzwbqccr.supabase.co/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZmF3Y2JjYXBtZnB6d2JxY2NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM1MjUzNywiZXhwIjoyMDc2OTI4NTM3fQ.VHDRD3drxZ26pAOvU27myoHO8utoMWxnmX4yeRybUCo',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZmF3Y2JjYXBtZnB6d2JxY2NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM1MjUzNywiZXhwIjoyMDc2OTI4NTM3fQ.VHDRD3drxZ26pAOvU27myoHO8utoMWxnmX4yeRybUCo'
        },
        body: JSON.stringify({ sql_query: stmt })
      });
      const result = await response.json();
      console.log('Direct query result:', result);
    } else {
      console.log(`Statement ${i + 1} executed successfully`);
    }
  }

  console.log('\nMigration completed!');
}

applyMigration().then(() => process.exit(0)).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
