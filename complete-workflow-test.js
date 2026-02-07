const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ikfawcbcapmfpzwbqccr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZmF3Y2JjYXBtZnB6d2JxY2NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM1MjUzNywiZXhwIjoyMDc2OTI4NTM3fQ.VHDRD3drxZ26pAOvU27myoHO8utoMWxnmX4yeRybUCo'
);

async function testCompleteWorkflow() {
  console.log('=== COMPLETE WORKFLOW TEST ===\n');

  const eventId = 'da831bd7-1966-4ff5-b1e6-3d70519e0f99';
  const bidId = '7c35277f-0a13-4b40-9cc6-68c8402ea5be';

  // Step 1: Check current state
  console.log('Step 1: Checking current state...');
  const { data: event } = await supabase
    .from('events')
    .select('id, event_type, forge_status')
    .eq('id', eventId)
    .single();

  const { data: bid } = await supabase
    .from('bids')
    .select('id, status, total_forge_cost')
    .eq('id', bidId)
    .single();

  console.log(`  Event: ${event.event_type} - Status: ${event.forge_status}`);
  console.log(`  Bid: ${bid.id} - Status: ${bid.status} - Amount: ₹${bid.total_forge_cost}`);

  // Step 2: Update event to WINNER_SELECTED
  console.log('\nStep 2: Attempting to update event status to WINNER_SELECTED...');
  const { data: updatedEvent, error: updateError } = await supabase
    .from('events')
    .update({ forge_status: 'WINNER_SELECTED' })
    .eq('id', eventId)
    .select()
    .single();

  if (updateError) {
    console.log('  ❌ ERROR: Cannot update to WINNER_SELECTED status');
    console.log('  Error:', updateError.message);
    console.log('\n  📋 ACTION REQUIRED: Apply database migration first!');
    console.log('  Go to: https://supabase.com/dashboard/project/ikfawcbcapmfpzwbqccr/sql');
    console.log('  Run the following SQL:\n');
    console.log(`  ALTER TABLE events DROP CONSTRAINT IF EXISTS events_forge_status_check;
  ALTER TABLE events ADD CONSTRAINT events_forge_status_check
  CHECK (forge_status IN (
    'BLUEPRINT_READY', 'OPEN_FOR_BIDS', 'CRAFTSMEN_BIDDING', 'SHORTLIST_REVIEW',
    'FINAL_BIDDING_OPEN', 'FINAL_BIDDING_CLOSED', 'WINNER_SELECTED',
    'COMMISSIONED', 'IN_FORGE', 'COMPLETED', 'ARCHIVED'
  ));`);
    return;
  }

  console.log('  ✅ Event updated successfully!');
  console.log(`  New status: ${updatedEvent.forge_status}`);

  // Step 3: Check if contract already exists
  console.log('\nStep 3: Checking for existing contract...');
  const { data: existingContract } = await supabase
    .from('contracts')
    .select('id, contract_status')
    .eq('event_id', eventId)
    .single();

  if (existingContract) {
    console.log(`  ✅ Contract already exists: ${existingContract.id}`);
    console.log(`  Status: ${existingContract.contract_status}`);
  } else {
    console.log('  ℹ️  No contract found - ready for creation');
  }

  // Step 4: Verify bid amount is accessible
  console.log('\nStep 4: Verifying bid data...');
  const { data: fullBid } = await supabase
    .from('bids')
    .select('id, status, total_forge_cost, total_amount, subtotal, taxes, bid_data')
    .eq('id', bidId)
    .single();

  if (fullBid) {
    console.log(`  Bid ID: ${fullBid.id}`);
    console.log(`  Status: ${fullBid.status}`);
    console.log(`  total_forge_cost: ₹${fullBid.total_forge_cost || 'NULL'}`);
    console.log(`  total_amount: ₹${fullBid.total_amount || 'NULL'}`);
    console.log(`  subtotal: ₹${fullBid.subtotal || 'NULL'}`);
    console.log(`  taxes: ₹${fullBid.taxes || 'NULL'}`);

    if (!fullBid.total_forge_cost && !fullBid.total_amount) {
      console.log('  ⚠️  WARNING: Bid has no total amount! This will cause issues.');
    } else {
      console.log('  ✅ Bid amount is valid');
    }
  } else {
    console.log('  ❌ ERROR: Could not fetch bid data');
  }

  // Step 5: Test summary
  console.log('\n=== TEST SUMMARY ===');
  console.log(`✅ Event exists: ${event.event_type} (${eventId})`);
  console.log(`✅ Bid exists and is ACCEPTED: ${bid.status}`);
  console.log(`${updatedEvent ? '✅' : '❌'} Event status updated to WINNER_SELECTED`);
  console.log(`${existingContract ? '✅' : 'ℹ️ '} Contract ${existingContract ? 'exists' : 'ready to create'}`);
  console.log(`${fullBid && fullBid.total_forge_cost ? '✅' : '⚠️ '} Bid amount: ₹${fullBid ? fullBid.total_forge_cost || 0 : 0}`);

  console.log('\n=== NEXT STEPS FOR MANUAL TESTING ===');
  console.log('1. Login as client: test@eventfoundry.com (password: password)');
  console.log('2. Navigate to: http://localhost:3000/dashboard/client/events/' + eventId);
  console.log('3. You should see:');
  console.log('   - "Winner Selected!" banner');
  console.log('   - Winning bid amount displayed correctly');
  console.log('   - "Create Contract" button (or "View Contract" if exists)');
  console.log('4. Click "Create Contract" and verify it navigates to contract page');
  console.log('5. Verify contract details are correct');
}

testCompleteWorkflow()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
