// EventFoundry Database Utilities
// Supabase CRUD operations with TypeScript type safety

import { supabase } from './supabase';
import type {
  Vendor,
  VendorInsert,
  VendorUpdate,
  VendorWithUser,
  Event,
  EventInsert,
  EventUpdate,
  EventWithClient,
  Bid,
  BidInsert,
  BidUpdate,
  BidWithVendor,
  Contract,
  ContractInsert,
  ContractUpdate,
  Payment,
  PaymentInsert,
  Review,
  ReviewInsert,
  Message,
  MessageInsert,
} from '../types/database';

// ===== VENDOR OPERATIONS =====

/**
 * Create a new vendor profile
 * @param vendorData - Vendor data to insert
 * @returns Created vendor or error
 */
export async function createVendor(vendorData: VendorInsert) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('vendors')
    .insert(vendorData)
    .select()
    .single();

  return { data: data as Vendor | null, error };
}

/**
 * Get vendor by ID
 * @param vendorId - Vendor UUID
 * @returns Vendor profile or error
 */
export async function getVendorById(vendorId: string) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', vendorId)
    .single();

  return { data: data as Vendor | null, error };
}

/**
 * Get vendor by user_id
 * @param userId - User UUID
 * @returns Vendor profile or error
 */
export async function getVendorByUserId(userId: string) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', userId)
    .single();

  return { data: data as Vendor | null, error };
}

/**
 * Get vendor with user details
 * @param vendorId - Vendor UUID
 * @returns Vendor with user details or error
 */
export async function getVendorWithUser(vendorId: string) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('vendors')
    .select(`
      *,
      user:users(*)
    `)
    .eq('id', vendorId)
    .single();

  return { data: data as VendorWithUser | null, error };
}

/**
 * Get all verified vendors (public access)
 * @param filters - Optional filters (city, specialties)
 * @returns List of verified vendors or error
 */
export async function getVerifiedVendors(filters?: {
  city?: string;
  specialties?: string[];
}) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  let query = supabase
    .from('vendors')
    .select('*')
    .eq('verified', true);

  if (filters?.city) {
    query = query.eq('city', filters.city);
  }

  if (filters?.specialties && filters.specialties.length > 0) {
    query = query.contains('specialties', filters.specialties);
  }

  const { data, error } = await query;

  return { data: data as Vendor[] | null, error };
}

/**
 * Update vendor profile
 * @param vendorId - Vendor UUID
 * @param updates - Fields to update
 * @returns Updated vendor or error
 */
export async function updateVendorProfile(vendorId: string, updates: VendorUpdate) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('vendors')
    .update(updates)
    .eq('id', vendorId)
    .select()
    .single();

  return { data: data as Vendor | null, error };
}

// ===== EVENT OPERATIONS =====

/**
 * Create a new event
 * @param eventData - Event data to insert
 * @returns Created event or error
 */
export async function createEvent(eventData: EventInsert) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single();

  return { data: data as Event | null, error };
}

/**
 * Get event by ID
 * @param eventId - Event UUID
 * @returns Event or error
 */
export async function getEventById(eventId: string) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  return { data: data as Event | null, error };
}

/**
 * Get events by client ID
 * @param clientId - Client user UUID
 * @returns List of client's events or error
 */
export async function getEventsByClientId(clientId: string) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('owner_user_id', clientId)
    .order('created_at', { ascending: false });

  return { data: data as Event[] | null, error };
}

/**
 * Get open events for vendor bidding
 * @returns List of open events or error
 */
export async function getOpenEvents() {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .in('forge_status', ['OPEN_FOR_BIDS', 'CRAFTSMEN_BIDDING'])
    .order('created_at', { ascending: false });

  return { data: data as Event[] | null, error };
}

/**
 * Update event
 * @param eventId - Event UUID
 * @param updates - Fields to update
 * @returns Updated event or error
 */
export async function updateEvent(eventId: string, updates: EventUpdate) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  return { data: data as Event | null, error };
}

// ===== BID OPERATIONS =====

/**
 * Create a new bid
 * @param bidData - Bid data to insert
 * @returns Created bid or error
 */
export async function createBid(bidData: BidInsert) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('bids')
    .insert(bidData)
    .select()
    .single();

  return { data: data as Bid | null, error };
}

/**
 * Get bid by ID
 * @param bidId - Bid UUID
 * @returns Bid or error
 */
export async function getBidById(bidId: string) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('bids')
    .select('*')
    .eq('id', bidId)
    .single();

  return { data: data as Bid | null, error };
}

/**
 * Get bids by event ID (for clients)
 * @param eventId - Event UUID
 * @returns List of bids for the event or error
 */
export async function getBidsByEventId(eventId: string) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('bids')
    .select(`
      *,
      vendor:vendors(
        *,
        user:users(*)
      )
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  return { data: data as BidWithVendor[] | null, error };
}

/**
 * Get bids by vendor ID
 * @param vendorId - Vendor UUID
 * @returns List of vendor's bids or error
 */
export async function getBidsByVendorId(vendorId: string) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('bids')
    .select(`
      *,
      event:events(*)
    `)
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Update bid
 * @param bidId - Bid UUID
 * @param updates - Fields to update
 * @returns Updated bid or error
 */
export async function updateBid(bidId: string, updates: BidUpdate) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('bids')
    .update(updates)
    .eq('id', bidId)
    .select()
    .single();

  return { data: data as Bid | null, error };
}

/**
 * Update bid status
 * @param bidId - Bid UUID
 * @param status - New bid status
 * @returns Updated bid or error
 */
export async function updateBidStatus(bidId: string, status: string) {
  return updateBid(bidId, { status: status as any });
}

/**
 * Update bid status with optimistic updates
 * @param bidId - Bid UUID
 * @param status - New bid status
 * @param enableOptimistic - Whether to apply optimistic updates
 * @returns Updated bid or error
 */
export async function updateBidStatusOptimistic(bidId: string, status: string, enableOptimistic = true) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  try {
    // Get current bid status for optimistic update
    const { data: currentBid, error: fetchError } = await supabase
      .from('bids')
      .select('status')
      .eq('id', bidId)
      .single();

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    // Apply optimistic update if enabled
    if (enableOptimistic) {
      const { realtimeService } = await import('./realtime');
      const optimisticUpdate = realtimeService.createOptimisticBidStatusUpdate(
        bidId,
        status,
        currentBid.status
      );
      realtimeService.applyOptimisticUpdate(optimisticUpdate);
    }

    // Perform the actual update
    const result = await updateBid(bidId, { status: status as any });

    if (result.error) {
      // Rollback optimistic update on failure
      if (enableOptimistic) {
        const { realtimeService } = await import('./realtime');
        realtimeService.confirmOptimisticUpdate(`bid_status_${bidId}_${Date.now()}`);
      }
      return result;
    }

    // Confirm optimistic update on success
    if (enableOptimistic) {
      const { realtimeService } = await import('./realtime');
      // Find and confirm the optimistic update
      const updateId = Array.from(realtimeService['optimisticUpdates'].keys())
        .find(id => id.startsWith(`bid_status_${bidId}`));
      if (updateId) {
        realtimeService.confirmOptimisticUpdate(updateId);
      }
    }

    return result;
  } catch (error) {
    console.error('Error in optimistic bid status update:', error);
    return {
      data: null,
      error: error instanceof Error ? error : { message: 'Unknown error' }
    };
  }
}

/**
 * Accept a bid and update related statuses atomically
 * @param bidId - Bid UUID to accept
 * @returns Result with accepted bid and updated event info
 */
export async function acceptBid(bidId: string) {
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  try {
    // Get bid details with event info
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('*, events(*)')
      .eq('id', bidId)
      .single();

    if (bidError || !bid) {
      return { success: false, error: 'Bid not found' };
    }

    const eventId = bid.event_id;

    // Start transaction-like operations
    const operations = [];

    // 1. Accept the winning bid
    operations.push(
      updateBid(bidId, {
        status: 'ACCEPTED' as const
      })
    );

    // 2. Reject all other bids for this event
    operations.push(
      supabase
        .from('bids')
        .update({
          status: 'REJECTED',
          rejected_at: new Date().toISOString()
        })
        .eq('event_id', eventId)
        .neq('id', bidId)
    );

    // 3. Update event status to commissioned
    operations.push(
      updateEvent(eventId, {
        forge_status: 'COMMISSIONED' as const
      })
    );

    // Execute all operations
    const results = await Promise.allSettled(operations);

    // Check for failures
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      console.error('Some operations failed during bid acceptance:', failures);
      return {
        success: false,
        error: 'Failed to complete bid acceptance process'
      };
    }

    console.log(`Bid ${bidId} accepted for event ${eventId}`);

    return {
      success: true,
      data: {
        acceptedBid: bid,
        eventId: eventId,
        rejectedBidsCount: results[1].status === 'fulfilled' ?
          (results[1] as PromiseFulfilledResult<any>).value.count || 0 : 0
      }
    };

  } catch (error) {
    console.error('Error accepting bid:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ===== CONTRACT OPERATIONS =====

/**
 * Create a new contract
 * @param contractData - Contract data to insert
 * @returns Created contract or error
 */
export async function createContract(contractData: ContractInsert) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('contracts')
    .insert(contractData)
    .select()
    .single();

  return { data: data as Contract | null, error };
}

/**
 * Get contract by ID
 * @param contractId - Contract UUID
 * @returns Contract or error
 */
export async function getContractById(contractId: string) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .single();

  return { data: data as Contract | null, error };
}

/**
 * Get contracts by vendor ID
 * @param vendorId - Vendor UUID
 * @returns List of vendor's contracts or error
 */
export async function getContractsByVendorId(vendorId: string) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  return { data: data as Contract[] | null, error };
}

/**
 * Get contracts by client ID
 * @param clientId - Client user UUID
 * @returns List of client's contracts or error
 */
export async function getContractsByClientId(clientId: string) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  return { data: data as Contract[] | null, error };
}

/**
 * Update contract
 * @param contractId - Contract UUID
 * @param updates - Fields to update
 * @returns Updated contract or error
 */
export async function updateContract(contractId: string, updates: ContractUpdate) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('contracts')
    .update(updates)
    .eq('id', contractId)
    .select()
    .single();

  return { data: data as Contract | null, error };
}

// ===== PAYMENT OPERATIONS =====

/**
 * Create a new payment
 * @param paymentData - Payment data to insert
 * @returns Created payment or error
 */
export async function createPayment(paymentData: PaymentInsert) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('payments')
    .insert(paymentData)
    .select()
    .single();

  return { data: data as Payment | null, error };
}

/**
 * Get payments by contract ID
 * @param contractId - Contract UUID
 * @returns List of payments for the contract or error
 */
export async function getPaymentsByContractId(contractId: string) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false });

  return { data: data as Payment[] | null, error };
}

// ===== REVIEW OPERATIONS =====

/**
 * Create a new review
 * @param reviewData - Review data to insert
 * @returns Created review or error
 */
export async function createReview(reviewData: ReviewInsert) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert(reviewData)
    .select()
    .single();

  return { data: data as Review | null, error };
}

/**
 * Get reviews by vendor ID (public access)
 * @param vendorId - Vendor UUID
 * @returns List of vendor's reviews or error
 */
export async function getReviewsByVendorId(vendorId: string) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  return { data: data as Review[] | null, error };
}

// ===== MESSAGE OPERATIONS =====

/**
 * Send a message
 * @param messageData - Message data to insert
 * @returns Created message or error
 */
export async function sendMessage(messageData: MessageInsert) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single();

  return { data: data as Message | null, error };
}

/**
 * Get messages for an event
 * @param eventId - Event UUID
 * @returns List of messages or error
 */
export async function getMessagesByEventId(eventId: string) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  return { data: data as Message[] | null, error };
}

/**
 * Mark message as read
 * @param messageId - Message UUID
 * @returns Updated message or error
 */
export async function markMessageAsRead(messageId: string) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase client not initialized' } };
  }

  const { data, error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId)
    .select()
    .single();

  return { data: data as Message | null, error };
}
