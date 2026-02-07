import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    // Fetch the event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Fetch all shortlisted bids
    const { data: bids, error: bidsError } = await supabase
      .from('bids')
      .select(`
        *,
        craftsmen:craftsman_id (
          id,
          user_id,
          business_name,
          rating,
          completed_events
        )
      `)
      .eq('event_id', eventId)
      .eq('status', 'shortlisted');

    if (bidsError) {
      console.error('Error fetching bids:', bidsError);
      return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 });
    }

    if (!bids || bids.length === 0) {
      return NextResponse.json({ error: 'No shortlisted bids found' }, { status: 404 });
    }

    // Get floor price
    const shortlistData = event.shortlist_data || {};
    const floorPrice = shortlistData.floorPrice || Math.min(...bids.map(b => b.total_amount));

    // Transform bids
    const transformedBids = bids.map((bid: any) => {
      const craftsmanData = Array.isArray(bid.craftsmen) ? bid.craftsmen[0] : bid.craftsmen;

      const percentageAbove = floorPrice > 0
        ? Math.round(((bid.total_amount - floorPrice) / floorPrice) * 100)
        : 0;

      return {
        bidId: bid.id,
        craftsmanId: bid.craftsman_id,
        craftsmanName: craftsmanData?.business_name || 'Unknown Vendor',
        craftsmanRating: craftsmanData?.rating || 0,
        craftsmanCompletedEvents: craftsmanData?.completed_events || 0,
        items: bid.bid_items || [],
        subtotal: bid.subtotal || 0,
        taxes: bid.taxes || 0,
        total: bid.total_amount,
        notes: bid.notes || '',
        isRevised: !!bid.revised_at,
        originalTotal: bid.original_bid_data?.total || null,
        isLowestBid: bid.total_amount === floorPrice,
        percentageAboveLowest: percentageAbove
      };
    });

    // Sort by total (lowest first)
    transformedBids.sort((a, b) => a.total - b.total);

    const response = {
      eventId: event.id,
      eventTitle: event.title || `${event.event_type} Event`,
      eventType: event.event_type,
      date: event.date,
      city: event.city,
      shortlistedBids: transformedBids,
      floorPrice
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching shortlisted bids:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
