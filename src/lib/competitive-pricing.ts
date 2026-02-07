// Competitive Pricing Intelligence
// Calculates competitive pricing data for bids after shortlisting

import { supabase } from './supabase';
import type { Bid } from '../types/database';

export interface CompetitivePricingData {
  bidId: string;
  vendorId: string;
  currentAmount: number;
  lowestMarketPrice: number;
  percentageAboveLowest: number;
  competitivePosition: 'LOWEST' | 'ABOVE_MARKET';
}

/**
 * Calculate competitive pricing intelligence for all shortlisted bids
 * This provides vendors with market position information
 */
export async function calculateCompetitivePricing(eventId: string) {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    // Get all shortlisted bids for the event
    const { data: bids, error } = await supabase
      .from('bids')
      .select('id, total_forge_cost, vendor_id')
      .eq('event_id', eventId)
      .eq('status', 'SHORTLISTED')
      .order('total_forge_cost', { ascending: true });

    if (error) {
      console.error('Error fetching shortlisted bids:', error);
      return { success: false, error: error.message };
    }

    if (!bids || bids.length < 2) {
      return { 
        success: true, 
        message: 'Not enough bids for competitive analysis',
        competitiveData: []
      };
    }

    const lowestBid = bids[0].total_forge_cost;
    
    // Calculate competitive intelligence for each bid
    const competitiveData: CompetitivePricingData[] = bids.map(bid => {
      const percentageAboveLowest = bid.total_forge_cost === lowestBid 
        ? 0 
        : ((bid.total_forge_cost - lowestBid) / lowestBid) * 100;
      
      return {
        bidId: bid.id,
        vendorId: bid.vendor_id,
        currentAmount: bid.total_forge_cost,
        lowestMarketPrice: lowestBid,
        percentageAboveLowest: Math.round(percentageAboveLowest * 100) / 100,
        competitivePosition: bid.total_forge_cost === lowestBid ? 'LOWEST' : 'ABOVE_MARKET'
      };
    });

    // Update bids with competitive intelligence
    // Note: competitive_intelligence field already exists in bids table
    for (const data of competitiveData) {
      const { error: updateError } = await supabase
        .from('bids')
        .update({
          competitive_intelligence: {
            ...data,
            calculated_at: new Date().toISOString()
          }
        })
        .eq('id', data.bidId);

      if (updateError) {
        console.error(`Error updating competitive intelligence for bid ${data.bidId}:`, updateError);
        // Continue with other bids even if one fails
      }
    }

    console.log(`Competitive pricing calculated for ${competitiveData.length} bids`);

    return { 
      success: true, 
      competitiveData,
      lowestMarketPrice: lowestBid,
      totalBidsAnalyzed: competitiveData.length
    };
  } catch (error) {
    console.error('Error calculating competitive pricing:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get competitive pricing data for a specific bid
 */
export async function getBidCompetitivePricing(bidId: string): Promise<CompetitivePricingData | null> {
  try {
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('bids')
      .select('competitive_intelligence')
      .eq('id', bidId)
      .single();

    if (error || !data || !data.competitive_intelligence) {
      return null;
    }

    return data.competitive_intelligence as CompetitivePricingData;
  } catch (error) {
    console.error('Error fetching competitive pricing:', error);
    return null;
  }
}















