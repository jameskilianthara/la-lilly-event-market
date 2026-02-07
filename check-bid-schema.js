const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ikfawcbcapmfpzwbqccr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZmF3Y2JjYXBtZnB6d2JxY2NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM1MjUzNywiZXhwIjoyMDc2OTI4NTM3fQ.VHDRD3drxZ26pAOvU27myoHO8utoMWxnmX4yeRybUCo'
);

async function checkBidSchema() {
  const bidId = '7c35277f-0a13-4b40-9cc6-68c8402ea5be';

  console.log('Fetching bid with all columns (*) ...\n');

  const { data: bid, error } = await supabase
    .from('bids')
    .select('*')
    .eq('id', bidId)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Bid columns and values:');
  console.log('='.repeat(60));

  Object.keys(bid).sort().forEach(key => {
    const value = bid[key];
    const displayValue = typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : value;
    console.log(`${key.padEnd(25)}: ${displayValue}`);
  });

  console.log('='.repeat(60));
  console.log(`\nTotal columns: ${Object.keys(bid).length}`);
}

checkBidSchema().then(() => process.exit(0));
