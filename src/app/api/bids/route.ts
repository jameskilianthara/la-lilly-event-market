// API Route: Bid Operations
// POST /api/bids - Create a new bid with validation

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createBid as createBidDb } from '@/lib/database';
import type { BidInsert } from '@/types/database';
import { withErrorHandler, validateRequired } from '@/lib/api-handler';
import { ValidationError, DatabaseError, ERROR_MESSAGES } from '@/lib/errors';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { event_id, vendor_id, ...bidData } = body;

  // Validate required fields
  validateRequired(body, ['event_id', 'vendor_id']);

  // Validate business rules
  if (bidData.totalAmount && bidData.totalAmount <= 0) {
    throw new ValidationError('Bid amount must be greater than zero');
  }

  // Validate event exists and bidding is open
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, forge_status, bidding_closes_at')
    .eq('id', event_id)
    .single();

  if (eventError || !event) {
    throw new ValidationError(ERROR_MESSAGES.EVENT_NOT_FOUND);
  }

  // Check if bidding is open
  if (event.forge_status !== 'OPEN_FOR_BIDS' && event.forge_status !== 'CRAFTSMEN_BIDDING') {
    throw new ValidationError(
      `Bidding is closed for this event. Event status: ${event.forge_status}. Bidding is only allowed when status is OPEN_FOR_BIDS or CRAFTSMEN_BIDDING.`
    );
  }

  // Check if deadline has passed
  if (event.bidding_closes_at) {
    const deadline = new Date(event.bidding_closes_at);
    const now = new Date();
    if (now >= deadline) {
      throw new ValidationError(ERROR_MESSAGES.BID_DEADLINE_PASSED);
    }
  }

  // Check if vendor already has a bid for this event
  const { data: existingBid, error: existingBidError } = await supabase
    .from('bids')
    .select('id, status')
    .eq('event_id', event_id)
    .eq('vendor_id', vendor_id)
    .single();

  if (existingBid && !existingBidError) {
    // Allow updating if bid is in DRAFT status
    if (existingBid.status !== 'DRAFT') {
      throw new ValidationError(
        `You have already submitted a bid for this event. Existing bid status: ${existingBid.status}. You can only submit one bid per event.`
      );
    }
  }

  // Create the bid
  const bidInsert: BidInsert = {
    event_id,
    vendor_id,
    status: 'SUBMITTED',
    ...bidData
  };

  const result = await createBidDb(bidInsert);

  if (result.error) {
    throw new DatabaseError(`Failed to create bid: ${result.error.message}`);
  }

  return NextResponse.json({
    success: true,
    bid: result.data,
    message: 'Bid submitted successfully'
  }, { status: 201 });
});

// GET /api/bids?event_id=xxx - Get bids for an event
export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const eventId = searchParams.get('event_id');

  if (!eventId) {
    throw new ValidationError('Missing required parameter: event_id');
  }

  const { data: bids, error } = await supabase
    .from('bids')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new DatabaseError(`Failed to fetch bids: ${error.message}`);
  }

  return NextResponse.json({
    success: true,
    bids: bids || [],
    count: bids?.length || 0
  });
});

