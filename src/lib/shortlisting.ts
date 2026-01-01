// Two-Tier Competitive Bidding - Shortlisting Logic
// Implements automatic shortlisting, competitive intelligence, and final bidding workflow

import { supabase } from '../../lib/supabase';
import { getBidsByEventId, updateBid, updateEvent } from './database';
import { calculateCompetitivePricing } from './competitive-pricing';
import type { Bid, Event } from '../types/database';

export interface CompetitiveIntelligence {
  position: number;
  premium_percentage: number;
  lowest_bid_amount: number;
  total_shortlisted: number;
  final_deadline: string;
  message: string;
}

export interface ShortlistingResult {
  success: boolean;
  shortlisted: Bid[];
  rejected: Bid[];
  lowestBid: number;
  error?: string;
}

/**
 * Process automatic shortlisting for an event
 * Selects top 5 lowest bids and provides competitive intelligence
 */
export async function processShortlisting(eventId: string): Promise<ShortlistingResult> {
  if (!supabase) {
    return {
      success: false,
      shortlisted: [],
      rejected: [],
      lowestBid: 0,
      error: 'Supabase client not initialized'
    };
  }

  try {
    console.log('Starting shortlisting process for event:', eventId);

    // Get all submitted bids for the event
    const { data: allBids, error: fetchError } = await getBidsByEventId(eventId);

    if (fetchError || !allBids) {
      return {
        success: false,
        shortlisted: [],
        rejected: [],
        lowestBid: 0,
        error: 'Failed to fetch bids'
      };
    }

    // Filter for SUBMITTED bids only
    const submittedBids = allBids.filter((bid: Bid) => bid.status === 'SUBMITTED');

    if (submittedBids.length === 0) {
      return {
        success: false,
        shortlisted: [],
        rejected: [],
        lowestBid: 0,
        error: 'No submitted bids to process'
      };
    }

    console.log(`Processing ${submittedBids.length} submitted bids`);

    // Sort by total cost ascending (lowest first)
    const sortedBids = [...submittedBids].sort(
      (a, b) => a.total_forge_cost - b.total_forge_cost
    );

    // Select top 5 (or fewer if less than 5 bids)
    const shortlistedBids = sortedBids.slice(0, Math.min(5, sortedBids.length));
    const rejectedBids = sortedBids.slice(5);

    const lowestBid = shortlistedBids[0]?.total_forge_cost || 0;
    const finalDeadline = new Date();
    finalDeadline.setHours(finalDeadline.getHours() + 48); // 48 hours from now

    console.log(`Shortlisted ${shortlistedBids.length} bids, rejected ${rejectedBids.length} bids`);
    console.log(`Lowest bid: ₹${lowestBid.toLocaleString()}`);

    // Update each shortlisted bid with competitive intelligence
    for (let i = 0; i < shortlistedBids.length; i++) {
      const bid = shortlistedBids[i];
      const position = i + 1;
      const premium = lowestBid > 0
        ? ((bid.total_forge_cost - lowestBid) / lowestBid) * 100
        : 0;

      const intelligence: CompetitiveIntelligence = {
        position,
        premium_percentage: Math.round(premium * 10) / 10, // Round to 1 decimal
        lowest_bid_amount: lowestBid,
        total_shortlisted: shortlistedBids.length,
        final_deadline: finalDeadline.toISOString(),
        message: generateIntelligenceMessage(position, premium)
      };

      await updateBid(bid.id, {
        status: 'SHORTLISTED',
        competitive_intelligence: intelligence,
        shortlisted_at: new Date().toISOString()
      });
    }

    // Update rejected bids
    for (const bid of rejectedBids) {
      await updateBid(bid.id, {
        status: 'REJECTED',
        rejected_at: new Date().toISOString()
      });
    }

    // Update event status to final bidding phase
    await updateEvent(eventId, {
      forge_status: 'SHORTLIST_REVIEW',
      shortlist_finalized_at: new Date().toISOString(),
      final_bidding_closes_at: finalDeadline.toISOString()
    });

    // Calculate competitive pricing for shortlisted bids
    const pricingResult = await calculateCompetitivePricing(eventId);
    if (pricingResult.success) {
      console.log(`Competitive pricing calculated for ${pricingResult.totalBidsAnalyzed || 0} bids`);
    } else {
      console.warn('Competitive pricing calculation failed:', pricingResult.error);
      // Don't fail shortlisting if pricing calculation fails
    }

    console.log('Shortlisting completed successfully');

    return {
      success: true,
      shortlisted: shortlistedBids,
      rejected: rejectedBids,
      lowestBid
    };
  } catch (error) {
    console.error('Error processing shortlist:', error);
    return {
      success: false,
      shortlisted: [],
      rejected: [],
      lowestBid: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate personalized competitive intelligence message
 */
function generateIntelligenceMessage(position: number, premium: number): string {
  if (position === 1) {
    return "🎉 Congratulations! You submitted the lowest bid and are ranked #1. You have 48 hours to submit your final bid or keep your current offer.";
  }

  const premiumText = premium === 0
    ? "at the same price as the lowest bid"
    : `${premium.toFixed(1)}% above the lowest bid`;

  return `You're ranked #${position} and are ${premiumText}. You have 48 hours to submit your final competitive bid. Consider your pricing carefully.`;
}

/**
 * Create a revised bid for final bidding round
 */
export async function createRevisedBid(
  originalBidId: string,
  revisedBidData: {
    forge_items: any;
    subtotal: number;
    taxes: number;
    total_forge_cost: number;
    vendor_notes?: string;
  }
) {
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  try {
    // Get original bid details
    const { data: originalBid, error: fetchError } = await supabase
      .from('bids')
      .select('*, event_id, vendor_id')
      .eq('id', originalBidId)
      .single();

    if (fetchError || !originalBid) {
      return { success: false, error: 'Original bid not found' };
    }

    // Check if bid is shortlisted
    if (originalBid.status !== 'SHORTLISTED') {
      return { success: false, error: 'Only shortlisted bids can be revised' };
    }

    // Create revised bid (Round 2)
    const { data: revisedBid, error: createError } = await supabase
      .from('bids')
      .insert({
        event_id: originalBid.event_id,
        vendor_id: originalBid.vendor_id,
        craft_specialties: originalBid.craft_specialties,
        forge_items: revisedBidData.forge_items,
        subtotal: revisedBidData.subtotal,
        taxes: revisedBidData.taxes,
        total_forge_cost: revisedBidData.total_forge_cost,
        vendor_notes: revisedBidData.vendor_notes || originalBid.vendor_notes,
        craft_attachments: originalBid.craft_attachments,
        estimated_forge_time: originalBid.estimated_forge_time,
        status: 'SUBMITTED',
        bid_round: 2,
        is_final_bid: true,
        revised_from_bid_id: originalBidId
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating revised bid:', createError);
      return { success: false, error: createError.message };
    }

    // Update original bid status to indicate it has been revised
    await updateBid(originalBidId, {
      status: 'REVISED'
    });

    console.log('Revised bid created successfully:', revisedBid.id);

    return {
      success: true,
      data: revisedBid
    };
  } catch (error) {
    console.error('Unexpected error creating revised bid:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get competitive intelligence for a bid
 */
export async function getCompetitiveIntelligence(
  bidId: string
): Promise<CompetitiveIntelligence | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('bids')
      .select('competitive_intelligence')
      .eq('id', bidId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.competitive_intelligence as CompetitiveIntelligence;
  } catch (error) {
    console.error('Error fetching competitive intelligence:', error);
    return null;
  }
}

/**
 * Check if final bidding is still open
 */
export async function isFinalBiddingOpen(eventId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { data, error } = await supabase
      .from('events')
      .select('final_bidding_closes_at, forge_status')
      .eq('id', eventId)
      .single();

    if (error || !data) {
      return false;
    }

    if (data.forge_status !== 'SHORTLIST_REVIEW') {
      return false;
    }

    if (!data.final_bidding_closes_at) {
      return false;
    }

    const deadline = new Date(data.final_bidding_closes_at);
    const now = new Date();

    return now < deadline;
  } catch (error) {
    console.error('Error checking final bidding status:', error);
    return false;
  }
}

/**
 * Get bids by round
 */
export async function getBidsByRound(
  eventId: string,
  round: number
): Promise<Bid[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('bids')
      .select('*')
      .eq('event_id', eventId)
      .eq('bid_round', round)
      .order('total_forge_cost', { ascending: true });

    if (error) {
      console.error('Error fetching bids by round:', error);
      return [];
    }

    return data as Bid[];
  } catch (error) {
    console.error('Unexpected error:', error);
    return [];
  }
}

/**
 * Calculate statistics for shortlisting
 */
export function calculateShortlistingStats(bids: Bid[]): {
  totalBids: number;
  lowestBid: number;
  highestBid: number;
  averageBid: number;
  medianBid: number;
} {
  if (bids.length === 0) {
    return {
      totalBids: 0,
      lowestBid: 0,
      highestBid: 0,
      averageBid: 0,
      medianBid: 0
    };
  }

  const sortedBids = [...bids].sort((a, b) => a.total_forge_cost - b.total_forge_cost);

  return {
    totalBids: bids.length,
    lowestBid: sortedBids[0].total_forge_cost,
    highestBid: sortedBids[sortedBids.length - 1].total_forge_cost,
    averageBid: bids.reduce((sum, bid) => sum + bid.total_forge_cost, 0) / bids.length,
    medianBid: sortedBids[Math.floor(sortedBids.length / 2)].total_forge_cost
  };
}

/**
 * Trigger automatic shortlisting when bidding window closes
 * This function is called automatically when bidding closes
 */
export async function triggerAutomaticShortlisting(eventId: string) {
  try {
    console.log('Triggering automatic shortlisting for event:', eventId);

    // Use the existing processShortlisting function
    const result = await processShortlisting(eventId);

    if (!result.success) {
      console.error('Automatic shortlisting failed:', result.error);
      return {
        success: false,
        error: result.error,
        shortlistedCount: 0
      };
    }

    // Calculate competitive pricing (already done in processShortlisting, but ensure it's called)
    const pricingResult = await calculateCompetitivePricing(eventId);
    console.log('Competitive pricing result:', pricingResult.success ? 'Success' : pricingResult.error);

    console.log(`Automatic shortlisting completed: ${result.shortlisted.length} bids shortlisted`);

    return {
      success: true,
      shortlistedCount: result.shortlisted.length,
      rejectedCount: result.rejected.length,
      lowestBid: result.lowestBid,
      shortlistedBids: result.shortlisted
    };
  } catch (error) {
    console.error('Error in automatic shortlisting:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      shortlistedCount: 0
    };
  }
}
