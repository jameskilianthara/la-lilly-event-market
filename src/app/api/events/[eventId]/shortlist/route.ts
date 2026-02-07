import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';
import {
  generateShortlistEmail,
  generateRejectionEmail,
  sendEmail
} from '../../../../../lib/notifications';

/**
 * POST /api/events/[eventId]/shortlist
 *
 * Shortlist top 5 bids for an event (Two-Tier Bidding System)
 *
 * Features:
 * - Mark selected bids as 'shortlisted'
 * - Calculate competitive pricing (% above lowest bid)
 * - Update event status to 'SHORTLIST_REVIEW'
 * - Return shortlist data with competitive positions
 *
 * Body: { bidIds: string[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    const { bidIds } = body;

    console.log('[Shortlist API] Processing shortlist for event:', eventId);
    console.log('[Shortlist API] Bid IDs to shortlist:', bidIds);

    // Validation
    if (!bidIds || !Array.isArray(bidIds) || bidIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid bid IDs. Must provide an array of bid IDs.' },
        { status: 400 }
      );
    }

    if (bidIds.length > 5) {
      return NextResponse.json(
        { error: 'Cannot shortlist more than 5 bids.' },
        { status: 400 }
      );
    }

    // Fetch all bids for this event to calculate competitive pricing
    const { data: allBids, error: fetchError } = await supabase
      .from('bids')
      .select('*')
      .eq('event_id', eventId);

    if (fetchError) {
      console.error('[Shortlist API] Error fetching bids:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch bids' },
        { status: 500 }
      );
    }

    if (!allBids || allBids.length === 0) {
      return NextResponse.json(
        { error: 'No bids found for this event' },
        { status: 404 }
      );
    }

    // Calculate floor price (lowest bid among ALL bids, not just shortlisted)
    const floorPrice = Math.min(...allBids.map(bid => bid.total_amount || 0));
    console.log('[Shortlist API] Floor price:', floorPrice);

    // Calculate competitive positioning for shortlisted bids
    const shortlistedBids = allBids
      .filter(bid => bidIds.includes(bid.id))
      .map(bid => {
        const percentageAbove = floorPrice > 0
          ? Math.round(((bid.total_amount - floorPrice) / floorPrice) * 100)
          : 0;

        const isLowestBid = bid.total_amount === floorPrice;

        return {
          bidId: bid.id,
          totalAmount: bid.total_amount,
          percentageAbove,
          isLowestBid,
          competitiveMessage: isLowestBid
            ? 'You are the top contender! Your bid is the lowest price.'
            : `Your bid is ${percentageAbove}% above the lowest bid.`
        };
      });

    console.log('[Shortlist API] Shortlisted bids with competitive positioning:', shortlistedBids);

    // Update bid statuses to 'shortlisted'
    const { error: updateError } = await supabase
      .from('bids')
      .update({
        status: 'shortlisted',
        shortlisted_at: new Date().toISOString(),
        competitive_position: shortlistedBids.find(sb => sb.bidId === allBids[0]?.id)?.competitiveMessage
      })
      .in('id', bidIds);

    if (updateError) {
      console.error('[Shortlist API] Error updating bid statuses:', updateError);
      return NextResponse.json(
        { error: 'Failed to update bid statuses' },
        { status: 500 }
      );
    }

    // Mark non-shortlisted bids as 'rejected'
    const nonShortlistedBidIds = allBids
      .filter(bid => !bidIds.includes(bid.id))
      .map(bid => bid.id);

    if (nonShortlistedBidIds.length > 0) {
      const { error: rejectError } = await supabase
        .from('bids')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString()
        })
        .in('id', nonShortlistedBidIds);

      if (rejectError) {
        console.error('[Shortlist API] Error rejecting non-shortlisted bids:', rejectError);
        // Don't fail the request - shortlist was successful
      }
    }

    // Update event status to SHORTLIST_REVIEW
    const { error: eventUpdateError } = await supabase
      .from('events')
      .update({
        forge_status: 'SHORTLIST_REVIEW',
        bidding_closes_at: null, // Bidding is now closed
        shortlist_data: {
          shortlistedBidIds: bidIds,
          floorPrice,
          shortlistedAt: new Date().toISOString(),
          revisionDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours
        }
      })
      .eq('id', eventId);

    if (eventUpdateError) {
      console.error('[Shortlist API] Error updating event status:', eventUpdateError);
      // Don't fail - bids were shortlisted successfully
    }

    // Fetch event details for notifications
    const { data: event } = await supabase
      .from('events')
      .select('title, event_type, date')
      .eq('id', eventId)
      .single();

    // Send notifications to shortlisted vendors
    for (const bid of allBids.filter(b => bidIds.includes(b.id))) {
      try {
        // Fetch craftsman email
        const { data: craftsman } = await supabase
          .from('craftsmen')
          .select('business_name, users:user_id(email)')
          .eq('id', bid.craftsman_id)
          .single();

        if (craftsman) {
          const userData = Array.isArray(craftsman.users) ? craftsman.users[0] : craftsman.users;
          const competitiveInfo = shortlistedBids.find(sb => sb.bidId === bid.id);

          const emailTemplate = generateShortlistEmail({
            craftsmanName: craftsman.business_name || 'Vendor',
            craftsmanEmail: userData?.email || '',
            eventTitle: event?.title || 'Event',
            eventType: event?.event_type || 'Event',
            eventDate: event?.date || '',
            competitiveMessage: competitiveInfo?.competitiveMessage || '',
            revisionDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            revisionUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/craftsmen/dashboard/events/${eventId}/shortlist`
          });

          await sendEmail(userData?.email || '', emailTemplate);
        }
      } catch (emailError) {
        console.error('[Shortlist API] Error sending shortlist email:', emailError);
        // Continue with other notifications
      }
    }

    // Send rejection emails to non-shortlisted vendors
    for (const bid of allBids.filter(b => !bidIds.includes(b.id))) {
      try {
        const { data: craftsman } = await supabase
          .from('craftsmen')
          .select('business_name, users:user_id(email)')
          .eq('id', bid.craftsman_id)
          .single();

        if (craftsman) {
          const userData = Array.isArray(craftsman.users) ? craftsman.users[0] : craftsman.users;

          const emailTemplate = generateRejectionEmail({
            craftsmanName: craftsman.business_name || 'Vendor',
            craftsmanEmail: userData?.email || '',
            eventTitle: event?.title || 'Event',
            eventType: event?.event_type || 'Event'
          });

          await sendEmail(userData?.email || '', emailTemplate);
        }
      } catch (emailError) {
        console.error('[Shortlist API] Error sending rejection email:', emailError);
        // Continue with other notifications
      }
    }

    console.log('[Shortlist API] Shortlist successful, notifications sent');

    return NextResponse.json({
      success: true,
      shortlistedBids,
      floorPrice,
      message: `Successfully shortlisted ${bidIds.length} bid(s). Vendors will be notified.`
    });

  } catch (error) {
    console.error('[Shortlist API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
