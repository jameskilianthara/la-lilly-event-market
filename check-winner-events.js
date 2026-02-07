const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ikfawcbcapmfpzwbqccr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZmF3Y2JjYXBtZnB6d2JxY2NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNTI1MzcsImV4cCI6MjA3NjkyODUzN30.2SFwvI_HuO2CZBjCTarGgp8KRMgyK5D2Mc826-HyrxA'
);

async function checkWinnerEvents() {
  console.log('Checking for events with winners...\n');

  // Find bids with ACCEPTED status to identify events with winners
  const { data: acceptedBids, error: bidsError } = await supabase
    .from('bids')
    .select('event_id, id, total_forge_cost, status')
    .eq('status', 'ACCEPTED')
    .order('created_at', { ascending: false })
    .limit(5);

  if (bidsError) {
    console.error('Error fetching accepted bids:', bidsError);
    return;
  }

  if (!acceptedBids || acceptedBids.length === 0) {
    console.log('No events with winners found. Need to select a winner first.');
    return;
  }

  const eventIds = [...new Set(acceptedBids.map(b => b.event_id))];

  for (const eventId of eventIds) {
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, event_type, forge_status, created_at, owner_user_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      console.error(`Error fetching event ${eventId}:`, eventError);
      continue;
    }

    const winningBid = acceptedBids.find(b => b.event_id === eventId);

    console.log(`Event: ${event.event_type} (${event.id})`);
    console.log(`Status: ${event.forge_status}`);
    console.log(`Winner Bid ID: ${winningBid?.id}`);

    // Check if contract exists
    const { data: contract } = await supabase
      .from('contracts')
      .select('id, contract_status')
      .eq('event_id', event.id)
      .single();

    if (contract) {
      console.log(`Contract: ${contract.id} (${contract.contract_status})`);
    } else {
      console.log('Contract: None - Ready for contract creation!');
    }

    // Check bids
    const { data: bids } = await supabase
      .from('bids')
      .select('id, status, total_forge_cost')
      .eq('event_id', event.id);

    console.log(`Total Bids: ${bids?.length || 0}`);
    if (bids) {
      const accepted = bids.filter(b => b.status === 'ACCEPTED').length;
      const shortlisted = bids.filter(b => b.status === 'SHORTLISTED').length;
      const rejected = bids.filter(b => b.status === 'REJECTED').length;
      console.log(`  - Accepted: ${accepted}, Shortlisted: ${shortlisted}, Rejected: ${rejected}`);
    }

    console.log('---\n');
  }
}

checkWinnerEvents().then(() => process.exit(0));
