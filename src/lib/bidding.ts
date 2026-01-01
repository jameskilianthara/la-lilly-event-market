// Bid Window Management
// Handles automatic closure of bidding windows and status updates

import { supabase } from './supabase';
import { updateEvent } from './database';
import type { ForgeStatus } from '../types/database';

/**
 * Close bidding window for a specific event
 * Updates event status and triggers automatic shortlisting
 */
export async function closeBiddingWindow(eventId: string) {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    // Get current event status
    const { data: event, error: eventFetchError } = await supabase
      .from('events')
      .select('id, forge_status, bidding_closes_at')
      .eq('id', eventId)
      .single();

    if (eventFetchError || !event) {
      console.error('Error fetching event:', eventFetchError);
      return { success: false, error: 'Event not found' };
    }

    // Only close if currently open for bids
    if (event.forge_status !== 'OPEN_FOR_BIDS' && event.forge_status !== 'CRAFTSMEN_BIDDING') {
      console.log(`Event ${eventId} is not open for bids (status: ${event.forge_status})`);
      return { success: true, message: 'Event already closed or not open for bids' };
    }

    // Update event status to trigger shortlisting phase
    const { error: eventError } = await updateEvent(eventId, {
      forge_status: 'CRAFTSMEN_BIDDING' as ForgeStatus
    });

    if (eventError) {
      console.error('Error updating event status:', eventError);
      return { success: false, error: eventError.message };
    }

    console.log(`Bidding window closed for event ${eventId}`);

    // Trigger automatic shortlisting
    const { triggerAutomaticShortlisting } = await import('./shortlisting');
    const shortlistResult = await triggerAutomaticShortlisting(eventId);
    
    if (!shortlistResult.success) {
      console.error('Shortlisting failed:', shortlistResult.error);
      // Don't fail the whole operation if shortlisting fails
      // Event status is already updated
    } else {
      console.log(`Shortlisting completed: ${shortlistResult.shortlistedCount} bids shortlisted`);
    }

    return { 
      success: true, 
      shortlistResult: shortlistResult.success ? {
        shortlistedCount: shortlistResult.shortlistedCount || 0,
        rejectedCount: shortlistResult.rejectedCount || 0
      } : null
    };
  } catch (error) {
    console.error('Error closing bidding window:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check for and close expired bidding windows
 * Should be called periodically (e.g., via cron job or scheduled task)
 */
export async function checkExpiredBiddingWindows() {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    const now = new Date().toISOString();
    
    // Find events with expired bidding windows that are still open
    const { data: expiredEvents, error } = await supabase
      .from('events')
      .select('id, bidding_closes_at, forge_status')
      .in('forge_status', ['OPEN_FOR_BIDS', 'CRAFTSMEN_BIDDING'])
      .not('bidding_closes_at', 'is', null)
      .lt('bidding_closes_at', now);

    if (error) {
      console.error('Error fetching expired events:', error);
      return { success: false, error: error.message };
    }

    if (!expiredEvents || expiredEvents.length === 0) {
      return { success: true, closedCount: 0, message: 'No expired bidding windows found' };
    }

    console.log(`Found ${expiredEvents.length} expired bidding windows`);

    // Close each expired event
    const results = [];
    for (const event of expiredEvents) {
      const result = await closeBiddingWindow(event.id);
      results.push({ eventId: event.id, success: result.success });
    }

    const successCount = results.filter(r => r.success).length;

    return { 
      success: true, 
      closedCount: successCount,
      totalFound: expiredEvents.length,
      results 
    };
  } catch (error) {
    console.error('Error checking expired windows:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if bidding is still open for an event
 */
export async function isBiddingOpen(eventId: string): Promise<boolean> {
  try {
    if (!supabase) {
      return false;
    }

    const { data: event, error } = await supabase
      .from('events')
      .select('forge_status, bidding_closes_at')
      .eq('id', eventId)
      .single();

    if (error || !event) {
      return false;
    }

    // Check if status allows bidding
    if (event.forge_status !== 'OPEN_FOR_BIDS' && event.forge_status !== 'CRAFTSMEN_BIDDING') {
      return false;
    }

    // Check if deadline has passed
    if (event.bidding_closes_at) {
      const deadline = new Date(event.bidding_closes_at);
      const now = new Date();
      if (now >= deadline) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking bidding status:', error);
    return false;
  }
}

