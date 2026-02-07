import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateBidRevisionEmail, sendEmail } from '@/lib/notifications';

interface BidItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { bidId, revisedItems, revisedNotes, revisedTotal } = await request.json();

    // Validate input
    if (!bidId || !revisedItems || !Array.isArray(revisedItems)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Get craftsman ID from auth
    // TODO: Implement proper auth middleware
    const craftsmanId = request.headers.get('x-craftsman-id');
    if (!craftsmanId) {
      return NextResponse.json({ error: 'Craftsman ID not found' }, { status: 400 });
    }

    // Fetch the bid
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('*')
      .eq('id', bidId)
      .eq('event_id', eventId)
      .eq('craftsman_id', craftsmanId)
      .single();

    if (bidError || !bid) {
      return NextResponse.json({ error: 'Bid not found or unauthorized' }, { status: 404 });
    }

    // Check if bid is shortlisted
    if (bid.status !== 'shortlisted') {
      return NextResponse.json({ error: 'Only shortlisted bids can be revised' }, { status: 403 });
    }

    // Check if already revised
    if (bid.revised_at) {
      return NextResponse.json({ error: 'Bid has already been revised once' }, { status: 403 });
    }

    // Fetch event to check revision deadline
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('shortlist_data')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const shortlistData = event.shortlist_data || {};
    const revisionDeadline = shortlistData.revisionDeadline;

    // Check if revision window is still open
    if (revisionDeadline && new Date(revisionDeadline) <= new Date()) {
      return NextResponse.json({ error: 'Revision window has closed' }, { status: 403 });
    }

    // Calculate totals from items
    const calculatedSubtotal = revisedItems.reduce((sum: number, item: BidItem) => sum + item.total, 0);
    const calculatedTaxes = Math.round(calculatedSubtotal * 0.18); // 18% GST
    const calculatedTotal = calculatedSubtotal + calculatedTaxes;

    // Validate calculated total matches provided total
    if (Math.abs(calculatedTotal - revisedTotal) > 1) {
      return NextResponse.json({ error: 'Total calculation mismatch' }, { status: 400 });
    }

    // Store original bid data before updating
    const originalBidData = {
      items: bid.bid_items,
      subtotal: bid.subtotal,
      taxes: bid.taxes,
      total: bid.total_amount,
      notes: bid.notes
    };

    // Update the bid with revised data
    const { error: updateError } = await supabase
      .from('bids')
      .update({
        bid_items: revisedItems,
        subtotal: calculatedSubtotal,
        taxes: calculatedTaxes,
        total_amount: calculatedTotal,
        notes: revisedNotes,
        revised_at: new Date().toISOString(),
        original_bid_data: originalBidData
      })
      .eq('id', bidId);

    if (updateError) {
      console.error('Error updating bid:', updateError);
      return NextResponse.json({ error: 'Failed to update bid' }, { status: 500 });
    }

    // Send notification to client about bid revision
    try {
      const { data: eventData } = await supabase
        .from('events')
        .select('title, owner_user_id, users:owner_user_id(name, email)')
        .eq('id', eventId)
        .single();

      const { data: craftsmanData } = await supabase
        .from('craftsmen')
        .select('business_name')
        .eq('id', craftsmanId)
        .single();

      if (eventData && craftsmanData) {
        const ownerData = Array.isArray(eventData.users) ? eventData.users[0] : eventData.users;

        const emailTemplate = generateBidRevisionEmail({
          clientName: ownerData?.name || 'Client',
          clientEmail: ownerData?.email || '',
          craftsmanName: craftsmanData.business_name || 'Vendor',
          eventTitle: eventData.title || 'Event',
          originalAmount: bid.total_amount,
          revisedAmount: calculatedTotal
        });

        await sendEmail(ownerData?.email || '', emailTemplate);
      }
    } catch (emailError) {
      console.error('Error sending bid revision notification:', emailError);
      // Continue - revision was successful
    }

    return NextResponse.json({
      success: true,
      message: 'Bid revised successfully',
      revisedTotal: calculatedTotal,
      originalTotal: bid.total_amount
    });
  } catch (error) {
    console.error('Error revising bid:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
