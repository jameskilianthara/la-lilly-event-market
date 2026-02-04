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

    // Find the winning bid (status = ACCEPTED)
    const { data: winningBid, error: bidError } = await supabase
      .from('bids')
      .select('id')
      .eq('event_id', eventId)
      .eq('status', 'ACCEPTED')
      .single();

    if (bidError || !winningBid) {
      return NextResponse.json(
        { error: 'No winner selected for this event yet' },
        { status: 400 }
      );
    }

    if (event.forge_status !== 'WINNER_SELECTED') {
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
        bidId: winningBid.id
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
