const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ikfawcbcapmfpzwbqccr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZmF3Y2JjYXBtZnB6d2JxY2NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM1MjUzNywiZXhwIjoyMDc2OTI4NTM3fQ.VHDRD3drxZ26pAOvU27myoHO8utoMWxnmX4yeRybUCo'
);

async function updateEventStatus() {
  const eventId = 'da831bd7-1966-4ff5-b1e6-3d70519e0f99';

  console.log(`Updating event ${eventId} to WINNER_SELECTED status...`);

  const { data, error } = await supabase
    .from('events')
    .update({ forge_status: 'WINNER_SELECTED' })
    .eq('id', eventId)
    .select();

  if (error) {
    console.error('Error updating event:', error);
    return;
  }

  console.log('Event updated successfully:', data);
}

updateEventStatus().then(() => process.exit(0));
