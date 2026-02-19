import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateWinnerEmail, generateRejectionEmail, sendEmail } from '../../../../../lib/notifications';

// Use service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { bidId } = await request.json();

    if (!bidId) {
      return NextResponse.json({ error: 'Bid ID is required' }, { status: 400 });
    }

    // Fetch the event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Fetch the winning bid
    const { data: winningBid, error: bidError } = await supabase
      .from('bids')
      .select('*')
      .eq('id', bidId)
      .eq('event_id', eventId)
      .single();

    if (bidError || !winningBid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    // Verify bid is in a valid status to be selected as winner
    const bidStatus = winningBid.status.toUpperCase();
    const validBidStatuses = ['SHORTLISTED', 'SUBMITTED'];
    if (!validBidStatuses.includes(bidStatus)) {
      return NextResponse.json({ error: 'Only shortlisted or submitted bids can be selected as winner' }, { status: 400 });
    }

    // Update winning bid status to 'ACCEPTED'
    const { error: updateWinnerError } = await supabase
      .from('bids')
      .update({
        status: 'ACCEPTED',
        updated_at: new Date().toISOString()
      })
      .eq('id', bidId);

    if (updateWinnerError) {
      console.error('Error updating winning bid:', updateWinnerError);
      return NextResponse.json({ error: 'Failed to update winning bid' }, { status: 500 });
    }

    // Update all other bids (shortlisted and submitted) to 'REJECTED'
    const { error: updateOthersError } = await supabase
      .from('bids')
      .update({
        status: 'REJECTED',
        updated_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
      .in('status', ['SHORTLISTED', 'SUBMITTED'])
      .neq('id', bidId);

    if (updateOthersError) {
      console.error('Error updating other bids:', updateOthersError);
      // Continue despite error - winner is already selected
    }

    // Update event status to 'WINNER_SELECTED' and record the winning bid ID
    const { error: updateEventError } = await supabase
      .from('events')
      .update({
        forge_status: 'WINNER_SELECTED',
        winner_bid_id: bidId
      })
      .eq('id', eventId);

    if (updateEventError) {
      console.error('Error updating event:', updateEventError);
      return NextResponse.json({ error: 'Failed to update event status' }, { status: 500 });
    }

    // Do NOT auto-generate contract - either party can initiate
    console.log('Winner selected. Contract generation pending - either party can initiate.');

    // Send winner notification
    try {
      const { data: ownerData } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', event.owner_user_id)
        .single();

      const { data: craftsmanData } = await supabase
        .from('craftsmen')
        .select('business_name, users:user_id(email)')
        .eq('id', winningBid.craftsman_id)
        .single();

      if (craftsmanData) {
        const userData = Array.isArray(craftsmanData.users) ? craftsmanData.users[0] : craftsmanData.users;

        const contractUrl = `/contracts/${event.id}`; // Contract URL for winner

        const emailTemplate = generateWinnerEmail({
          craftsmanName: craftsmanData.business_name || 'Vendor',
          craftsmanEmail: userData?.email || '',
          eventTitle: event.title || 'Event',
          eventType: event.event_type || 'Event',
          totalAmount: winningBid.total_amount,
          clientName: ownerData?.name || 'Client',
          contractUrl
        });

        await sendEmail(userData?.email || '', emailTemplate);
      }
    } catch (emailError) {
      console.error('Error sending winner notification:', emailError);
      // Continue - winner was already selected
    }

    // Send rejection notifications to other shortlisted vendors
    try {
      const { data: otherBids } = await supabase
        .from('bids')
        .select('craftsman_id, craftsmen:craftsman_id(business_name, users:user_id(email))')
        .eq('event_id', eventId)
        .eq('status', 'REJECTED')
        .neq('id', bidId);

      for (const bid of otherBids || []) {
        const craftsmanData = Array.isArray(bid.craftsmen) ? bid.craftsmen[0] : bid.craftsmen;
        const userData = Array.isArray(craftsmanData?.users) ? craftsmanData.users[0] : craftsmanData?.users;

        if (craftsmanData && userData?.email) {
          const emailTemplate = generateRejectionEmail({
            craftsmanName: craftsmanData.business_name || 'Vendor',
            craftsmanEmail: userData.email,
            eventTitle: event.title || 'Event',
            eventType: event.event_type || 'Event'
          });

          await sendEmail(userData.email, emailTemplate);
        }
      }
    } catch (emailError) {
      console.error('Error sending rejection notifications:', emailError);
      // Continue - winner was already selected
    }

    return NextResponse.json({
      success: true,
      message: 'Winner selected successfully. Either party can now initiate the contract.',
      bidId,
      vendorId: winningBid.vendor_id,
      totalAmount: winningBid.total_forge_cost,
      nextStep: 'contract_initiation'
    });
  } catch (error) {
    console.error('Error selecting winner:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
