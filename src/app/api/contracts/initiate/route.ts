import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { eventId, initiatedBy } = await request.json();

    if (!eventId || !initiatedBy) {
      return NextResponse.json(
        { error: 'Event ID and initiator role are required' },
        { status: 400 }
      );
    }

    // Validate initiatedBy is either 'client' or 'vendor'
    if (initiatedBy !== 'client' && initiatedBy !== 'vendor') {
      return NextResponse.json(
        { error: 'Initiator must be either "client" or "vendor"' },
        { status: 400 }
      );
    }

    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, forge_status, owner_user_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Find the winning bid - check winner_bid_id on event first, then fall back to ACCEPTED status
    let winningBidId: string | null = null;

    // Check if event has a designated winner bid
    const { data: fullEvent } = await supabase
      .from('events')
      .select('winner_bid_id')
      .eq('id', eventId)
      .single();

    if (fullEvent?.winner_bid_id) {
      winningBidId = fullEvent.winner_bid_id;
    } else {
      // Fall back to finding bid with ACCEPTED status
      const { data: acceptedBid } = await supabase
        .from('bids')
        .select('id')
        .eq('event_id', eventId)
        .eq('status', 'ACCEPTED')
        .single();

      if (acceptedBid) winningBidId = acceptedBid.id;
    }

    // If still no winner, use the most recent SUBMITTED bid (for MVP flexibility)
    if (!winningBidId) {
      const { data: latestBid } = await supabase
        .from('bids')
        .select('id')
        .eq('event_id', eventId)
        .in('status', ['SUBMITTED', 'SHORTLISTED', 'ACCEPTED'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!latestBid) {
        return NextResponse.json(
          { error: 'No bids found for this event' },
          { status: 400 }
        );
      }
      winningBidId = latestBid.id;
    }

    // Allow contract generation for relevant forge statuses
    const validStatuses = ['WINNER_SELECTED', 'COMMISSIONED', 'SHORTLIST_REVIEW', 'OPEN_FOR_BIDS', 'CRAFTSMEN_BIDDING'];
    if (!validStatuses.includes(event.forge_status)) {
      return NextResponse.json(
        { error: `Cannot initiate contract. Event status is ${event.forge_status}` },
        { status: 400 }
      );
    }

    // Check if contract already exists
    const { data: existingContract } = await supabase
      .from('contracts')
      .select('id')
      .eq('event_id', eventId)
      .single();

    if (existingContract) {
      return NextResponse.json({
        success: true,
        contractId: existingContract.id,
        message: 'Contract already exists',
        alreadyExists: true
      });
    }

    // Generate the contract
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const contractResponse = await fetch(`${baseUrl}/api/contracts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: eventId,
        bidId: winningBidId
      })
    });

    if (!contractResponse.ok) {
      const errorData = await contractResponse.json();
      throw new Error(errorData.error || 'Failed to generate contract');
    }

    const contractData = await contractResponse.json();

    // Update event status to COMMISSIONED now that contract is created
    await supabase
      .from('events')
      .update({ forge_status: 'COMMISSIONED' })
      .eq('id', eventId);

    // Log who initiated the contract
    console.log(`Contract initiated by ${initiatedBy} for event ${eventId}`);

    return NextResponse.json({
      success: true,
      contract: contractData.contract,
      message: 'Contract generated successfully',
      initiatedBy: initiatedBy
    });

  } catch (error) {
    console.error('Error initiating contract:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
