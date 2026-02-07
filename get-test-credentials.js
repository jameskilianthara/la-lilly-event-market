const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ikfawcbcapmfpzwbqccr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZmF3Y2JjYXBtZnB6d2JxY2NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM1MjUzNywiZXhwIjoyMDc2OTI4NTM3fQ.VHDRD3drxZ26pAOvU27myoHO8utoMWxnmX4yeRybUCo'
);

async function getCredentials() {
  const eventId = 'da831bd7-1966-4ff5-b1e6-3d70519e0f99';

  // Get event details
  const { data: event } = await supabase
    .from('events')
    .select('owner_user_id')
    .eq('id', eventId)
    .single();

  if (!event) {
    console.log('Event not found');
    return;
  }

  // Get client user details
  const { data: clientUser } = await supabase
    .from('users')
    .select('id, email, full_name, user_type')
    .eq('id', event.owner_user_id)
    .single();

  // Get winning bid vendor details
  const { data: winningBid } = await supabase
    .from('bids')
    .select('vendor_id, vendor:vendors(user_id, company_name, user:users(email, full_name))')
    .eq('event_id', eventId)
    .eq('status', 'ACCEPTED')
    .single();

  console.log('\n=== TEST CREDENTIALS ===\n');

  console.log('CLIENT (Event Owner):');
  console.log(`  Email: ${clientUser?.email}`);
  console.log(`  Password: <check your records or reset password>`);
  console.log(`  Name: ${clientUser?.full_name || 'N/A'}`);
  console.log(`  User Type: ${clientUser?.user_type}`);
  console.log(`  Event ID: ${eventId}\n`);

  if (winningBid?.vendor) {
    const vendorUser = Array.isArray(winningBid.vendor.user)
      ? winningBid.vendor.user[0]
      : winningBid.vendor.user;

    console.log('VENDOR (Winner):');
    console.log(`  Email: ${vendorUser?.email}`);
    console.log(`  Password: <check your records or reset password>`);
    console.log(`  Company: ${winningBid.vendor.company_name || 'N/A'}`);
    console.log(`  Winning Bid ID: ${winningBid.vendor_id}\n`);
  }

  // Try to get common test accounts
  console.log('OTHER TEST ACCOUNTS:');
  const { data: testUsers } = await supabase
    .from('users')
    .select('email, full_name, user_type')
    .or('email.ilike.%test%,email.ilike.%demo%,email.ilike.%vendor1%,email.ilike.%client1%')
    .limit(10);

  if (testUsers && testUsers.length > 0) {
    testUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.user_type})`);
    });
  }

  console.log('\n=== STANDARD TEST PASSWORDS (try these) ===');
  console.log('  - password');
  console.log('  - password123');
  console.log('  - test123');
  console.log('  - Blackflames007');
}

getCredentials().then(() => process.exit(0));
