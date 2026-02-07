import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../../../lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    // Get craftsman ID from auth
    // TODO: Implement proper auth middleware
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
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    // Check if bid is shortlisted
    if (bid.status !== 'shortlisted') {
      return NextResponse.json({ error: 'Only shortlisted bids can be revised' }, { status: 403 });
    }

    // Check if already revised
    if (bid.revised_at) {
      return NextResponse.json({ error: 'Bid has already been revised' }, { status: 403 });
    }

    // Get shortlist data
    const shortlistData = event.shortlist_data || {};
    const floorPrice = shortlistData.floorPrice || 0;
    const revisionDeadline = shortlistData.revisionDeadline || null;

    // Check if revision window is still open
    const canRevise = revisionDeadline
      ? new Date(revisionDeadline) > new Date()
      : false;

    // Calculate competitive position
    const percentageAbove = floorPrice > 0
      ? Math.round(((bid.total_amount - floorPrice) / floorPrice) * 100)
      : 0;
    const isLowestBid = bid.total_amount === floorPrice;

    const competitiveMessage = isLowestBid
      ? 'You are the top contender! Your bid is the lowest price.'
      : `Your bid is ${percentageAbove}% above the lowest bid.`;

    // Parse bid items from JSON
    const bidItems = bid.bid_items || [];

    const response = {
      eventId: event.id,
      eventTitle: event.title || `${event.event_type} Event`,
      originalBid: {
        bidId: bid.id,
        items: bidItems,
        subtotal: bid.subtotal || 0,
        taxes: bid.taxes || 0,
        total: bid.total_amount,
        notes: bid.notes || ''
      },
      competitivePosition: {
        isLowestBid,
        percentageAbove,
        message: competitiveMessage
      },
      revisionDeadline,
      canRevise,
      floorPrice
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching revision data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
