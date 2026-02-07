import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWinnerStatus() {
  console.log('Checking for events with selected winners...\n');

  // Find bids with ACCEPTED status
  const { data: acceptedBids, error: bidsError } = await supabase
    .from('bids')
    .select('id, event_id, vendor_id, status, total_forge_cost')
    .eq('status', 'ACCEPTED');

  if (bidsError) {
    console.error('Error fetching bids:', bidsError);
    return;
  }

  if (!acceptedBids || acceptedBids.length === 0) {
    console.log('No ACCEPTED bids found.');
    console.log('\nSearching for events with forge_status = COMMISSIONED...\n');

    const { data: commissionedEvents } = await supabase
      .from('events')
      .select('id, event_type, forge_status')
      .eq('forge_status', 'COMMISSIONED');

    if (commissionedEvents && commissionedEvents.length > 0) {
      console.log('Found commissioned events:');
      commissionedEvents.forEach(event => {
        console.log(`Event ID: ${event.id}`);
        console.log(`Type: ${event.event_type}`);
        console.log(`Status: ${event.forge_status}\n`);
      });
    } else {
      console.log('No commissioned events found.');
    }
    return;
  }

  console.log(`Found ${acceptedBids.length} accepted bid(s):\n`);

  for (const bid of acceptedBids) {
    console.log(`Bid ID: ${bid.id}`);
    console.log(`Event ID: ${bid.event_id}`);
    console.log(`Vendor ID: ${bid.vendor_id}`);
    console.log(`Amount: ₹${bid.total_forge_cost?.toLocaleString('en-IN')}`);

    // Check if contract exists
    const { data: contract } = await supabase
      .from('contracts')
      .select('id, contract_status')
      .eq('event_id', bid.event_id)
      .single();

    if (contract) {
      console.log(`Contract ID: ${contract.id}`);
      console.log(`Contract Status: ${contract.contract_status}`);
    } else {
      console.log('Contract: NOT CREATED YET');
    }

    console.log('---\n');
  }
}

checkWinnerStatus();
