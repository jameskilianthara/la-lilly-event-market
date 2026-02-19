// GET /api/bids/:bidId - Retrieve single bid with vendor details
// Aligned with CLAUDE.md Section 12: API Spec

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandler } from '../../../../lib/api-handler';
import { ValidationError, DatabaseError } from '../../../../lib/errors';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ bidId: string }> }
) => {
  const { bidId } = await params;

  if (!bidId) {
    throw new ValidationError('Bid ID is required');
  }

  console.log('[API] Fetching bid:', bidId);

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch bid with vendor and user details
  const { data: bid, error: bidError } = await supabase
    .from('bids')
    .select(`
      *,
      vendor:vendors(
        id,
        company_name,
        business_type,
        specialties,
        location,
        city,
        state,
        years_experience,
        certifications,
        portfolio_urls,
        description,
        rating,
        total_projects,
        verified,
        user:users(
          id,
          email,
          user_type
        )
      ),
      event:events(
        id,
        title,
        event_type,
        date,
        city,
        owner_user_id
      )
    `)
    .eq('id', bidId)
    .single();

  if (bidError) {
    console.error('[API] Error fetching bid:', bidError);
    throw new DatabaseError(`Failed to fetch bid: ${bidError.message}`);
  }

  if (!bid) {
    console.error('[API] No bid found for id:', bidId);
    return NextResponse.json(
      { error: 'Bid not found' },
      { status: 404 }
    );
  }

  console.log('[API] Bid found:', bid.id);

  // Transform database format to match frontend expectations
  const transformedBid = {
    bidId: bid.id,
    vendorId: bid.vendor_id,
    vendorName: bid.vendor?.company_name || 'Unknown Vendor',
    vendorEmail: bid.vendor?.user?.email || '',
    vendorBusinessType: bid.vendor?.business_type,
    vendorLocation: bid.vendor?.location,
    vendorCity: bid.vendor?.city,
    vendorState: bid.vendor?.state,
    vendorYearsExperience: bid.vendor?.years_experience,
    vendorCertifications: bid.vendor?.certifications,
    vendorPortfolio: bid.vendor?.portfolio_urls || [],
    vendorDescription: bid.vendor?.description,
    vendorRating: bid.vendor?.rating,
    vendorTotalProjects: bid.vendor?.total_projects,
    vendorVerified: bid.vendor?.verified,
    craftSpecialties: bid.craft_specialties || [],
    itemizedPricing: bid.forge_items || [],
    subtotal: parseFloat(bid.subtotal || '0'),
    taxes: parseFloat(bid.taxes || '0'),
    total: parseFloat(bid.total_forge_cost || '0'),
    grandTotal: parseFloat(bid.total_forge_cost || '0'),
    gst: parseFloat(bid.taxes || '0'),
    craftAttachments: bid.craft_attachments || [],
    vendorNotes: bid.vendor_notes || '',
    coverLetter: bid.vendor_notes || '',
    timeline: bid.estimated_forge_time || '',
    estimatedForgeTime: bid.estimated_forge_time,
    status: bid.status.toLowerCase(),
    submittedAt: bid.created_at,
    createdAt: bid.created_at,
    updatedAt: bid.updated_at,
    event: bid.event
  };

  return NextResponse.json({
    success: true,
    bid: transformedBid
  });
});

// PATCH /api/bids/:bidId - Update bid status (shortlist, reject, select)
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ bidId: string }> }
) => {
  const { bidId } = await params;

  if (!bidId) {
    throw new ValidationError('Bid ID is required');
  }

  const body = await request.json();
  const { status } = body;

  console.log('[API PATCH] Updating bid status:', bidId, 'to', status);

  if (!status) {
    throw new ValidationError('Status is required');
  }

  // Validate status
  const validStatuses = ['DRAFT', 'SUBMITTED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'];
  const normalizedStatus = status.toUpperCase();

  if (!validStatuses.includes(normalizedStatus)) {
    throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch the bid first to get event_id for shortlist count validation
  const { data: existingBid, error: fetchError } = await supabase
    .from('bids')
    .select('id, event_id, status')
    .eq('id', bidId)
    .single();

  if (fetchError || !existingBid) {
    throw new DatabaseError('Bid not found');
  }

  // If shortlisting, validate max 5 shortlisted bids per event
  if (normalizedStatus === 'SHORTLISTED') {
    const { data: shortlistedBids, error: countError } = await supabase
      .from('bids')
      .select('id')
      .eq('event_id', existingBid.event_id)
      .eq('status', 'SHORTLISTED');

    if (countError) {
      console.error('[API PATCH] Error counting shortlisted bids:', countError);
    } else if (shortlistedBids && shortlistedBids.length >= 5) {
      throw new ValidationError('Maximum 5 bids can be shortlisted per event');
    }
  }

  // Update bid status
  const { data: updatedBid, error: updateError } = await supabase
    .from('bids')
    .update({
      status: normalizedStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', bidId)
    .select()
    .single();

  if (updateError) {
    console.error('[API PATCH] Error updating bid:', updateError);
    throw new DatabaseError(`Failed to update bid: ${updateError.message}`);
  }

  console.log('[API PATCH] ✅ Bid status updated successfully');

  // If bid is being accepted, write winner_bid_id on the parent event
  if (normalizedStatus === 'ACCEPTED') {
    const { error: eventUpdateError } = await supabase
      .from('events')
      .update({
        winner_bid_id: bidId,
        forge_status: 'WINNER_SELECTED'
      })
      .eq('id', existingBid.event_id);

    if (eventUpdateError) {
      console.error('[API PATCH] Failed to set winner_bid_id on event:', eventUpdateError);
      // Non-fatal — bid is accepted, but log it for visibility
    }
  }

  return NextResponse.json({
    success: true,
    bid: updatedBid,
    message: `Bid status updated to ${normalizedStatus}`
  });
});
