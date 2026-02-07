import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../../lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    // Get user from session/auth header
    // TODO: Implement proper auth middleware
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, get craftsman ID from header or session
    // In production, extract from JWT token
    const craftsmanId = request.headers.get('x-craftsman-id');
    if (!craftsmanId) {
      return NextResponse.json({ error: 'Craftsman ID not found' }, { status: 400 });
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

    // Fetch the craftsman's bid
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('*')
      .eq('event_id', eventId)
      .eq('craftsman_id', craftsmanId)
      .single();

    if (bidError || !bid) {
      return NextResponse.json({ error: 'Bid not found for this event' }, { status: 404 });
    }

    // Check if bid is shortlisted
    if (bid.status !== 'shortlisted') {
      return NextResponse.json({ error: 'Your bid has not been shortlisted' }, { status: 403 });
    }

    // Get shortlist data from event
    const shortlistData = event.shortlist_data || {};
    const floorPrice = shortlistData.floorPrice || 0;
    const revisionDeadline = shortlistData.revisionDeadline || null;

    // Calculate competitive position
    const percentageAbove = floorPrice > 0
      ? Math.round(((bid.total_amount - floorPrice) / floorPrice) * 100)
      : 0;
    const isLowestBid = bid.total_amount === floorPrice;

    const competitiveMessage = isLowestBid
      ? 'You are the top contender! Your bid is the lowest price.'
      : `Your bid is ${percentageAbove}% above the lowest bid.`;

    // Check if revision window is still open
    const canRevise = revisionDeadline
      ? new Date(revisionDeadline) > new Date() && !bid.revised_at
      : false;

    // Prepare response
    const response = {
      eventId: event.id,
      eventTitle: event.title || `${event.event_type} Event`,
      clientName: 'Client', // TODO: Fetch from users table
      bidId: bid.id,
      originalBidAmount: bid.total_amount,
      competitivePosition: {
        isLowestBid,
        percentageAbove,
        message: competitiveMessage
      },
      revisionDeadline,
      canRevise,
      eventDetails: {
        eventType: event.event_type,
        date: event.date,
        city: event.city,
        guestCount: event.guest_count
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching shortlist status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
