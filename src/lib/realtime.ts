// Real-time updates and notifications service
// Handles WebSocket connections, optimistic updates, and event broadcasting

import { supabase } from './supabase';
import type { Bid, Event } from '../types/database';

export interface RealtimeUpdate {
  type: 'event_update' | 'bid_update' | 'notification';
  eventId?: string;
  bidId?: string;
  data: any;
  timestamp: string;
}

export interface OptimisticUpdate {
  id: string;
  type: 'bid_status' | 'event_status';
  entityId: string;
  previousValue: any;
  newValue: any;
  timestamp: number;
  rollback?: () => Promise<void>;
}

class RealtimeService {
  private subscribers = new Map<string, Set<(update: RealtimeUpdate) => void>>();
  private optimisticUpdates = new Map<string, OptimisticUpdate>();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnected = false;

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection() {
    if (!supabase) return;

    // Set up real-time subscriptions for events and bids tables
    const eventSubscription = supabase
      .channel('events')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events'
      }, (payload) => {
        this.handleEventUpdate(payload);
      })
      .subscribe();

    const bidSubscription = supabase
      .channel('bids')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bids'
      }, (payload) => {
        this.handleBidUpdate(payload);
      })
      .subscribe();

    this.isConnected = true;
    console.log('Real-time service connected');
  }

  private handleEventUpdate(payload: any) {
    const update: RealtimeUpdate = {
      type: 'event_update',
      eventId: payload.new?.id || payload.old?.id,
      data: payload,
      timestamp: new Date().toISOString()
    };

    this.broadcastUpdate(`event_${update.eventId}`, update);
  }

  private handleBidUpdate(payload: any) {
    const update: RealtimeUpdate = {
      type: 'bid_update',
      eventId: payload.new?.event_id || payload.old?.event_id,
      bidId: payload.new?.id || payload.old?.id,
      data: payload,
      timestamp: new Date().toISOString()
    };

    // Broadcast to event-specific subscribers
    if (update.eventId) {
      this.broadcastUpdate(`event_${update.eventId}`, update);
    }

    // Broadcast to bid-specific subscribers
    if (update.bidId) {
      this.broadcastUpdate(`bid_${update.bidId}`, update);
    }
  }

  private broadcastUpdate(channel: string, update: RealtimeUpdate) {
    const subscribers = this.subscribers.get(channel);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          console.error('Error in realtime subscriber callback:', error);
        }
      });
    }
  }

  /**
   * Subscribe to real-time updates for a specific channel
   */
  subscribe(channel: string, callback: (update: RealtimeUpdate) => void): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }

    this.subscribers.get(channel)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(channel);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(channel);
        }
      }
    };
  }

  /**
   * Subscribe to event updates
   */
  subscribeToEvent(eventId: string, callback: (update: RealtimeUpdate) => void): () => void {
    return this.subscribe(`event_${eventId}`, callback);
  }

  /**
   * Subscribe to bid updates
   */
  subscribeToBid(bidId: string, callback: (update: RealtimeUpdate) => void): () => void {
    return this.subscribe(`bid_${bidId}`, callback);
  }

  /**
   * Subscribe to all bids for an event
   */
  subscribeToEventBids(eventId: string, callback: (update: RealtimeUpdate) => void): () => void {
    return this.subscribe(`event_${eventId}`, (update) => {
      if (update.type === 'bid_update') {
        callback(update);
      }
    });
  }

  /**
   * Apply optimistic update for immediate UI feedback
   */
  applyOptimisticUpdate(update: OptimisticUpdate): void {
    this.optimisticUpdates.set(update.id, update);

    // Auto-rollback after 10 seconds if not confirmed
    setTimeout(() => {
      this.rollbackOptimisticUpdate(update.id);
    }, 10000);
  }

  /**
   * Confirm optimistic update (remove from pending rollbacks)
   */
  confirmOptimisticUpdate(updateId: string): void {
    const update = this.optimisticUpdates.get(updateId);
    if (update) {
      this.optimisticUpdates.delete(updateId);
    }
  }

  /**
   * Rollback optimistic update
   */
  private async rollbackOptimisticUpdate(updateId: string): Promise<void> {
    const update = this.optimisticUpdates.get(updateId);
    if (update && update.rollback) {
      try {
        await update.rollback();
        this.optimisticUpdates.delete(updateId);
        console.log(`Rolled back optimistic update: ${updateId}`);
      } catch (error) {
        console.error(`Failed to rollback optimistic update ${updateId}:`, error);
      }
    }
  }

  /**
   * Create optimistic bid status update
   */
  createOptimisticBidStatusUpdate(
    bidId: string,
    newStatus: string,
    currentStatus: string
  ): OptimisticUpdate {
    return {
      id: `bid_status_${bidId}_${Date.now()}`,
      type: 'bid_status',
      entityId: bidId,
      previousValue: currentStatus,
      newValue: newStatus,
      timestamp: Date.now(),
      rollback: async () => {
        // In a real implementation, this would revert the UI state
        console.log(`Rolling back bid status for ${bidId} from ${newStatus} to ${currentStatus}`);
      }
    };
  }

  /**
   * Create optimistic event status update
   */
  createOptimisticEventStatusUpdate(
    eventId: string,
    newStatus: string,
    currentStatus: string
  ): OptimisticUpdate {
    return {
      id: `event_status_${eventId}_${Date.now()}`,
      type: 'event_status',
      entityId: eventId,
      previousValue: currentStatus,
      newValue: newStatus,
      timestamp: Date.now(),
      rollback: async () => {
        console.log(`Rolling back event status for ${eventId} from ${newStatus} to ${currentStatus}`);
      }
    };
  }

  /**
   * Get connection status
   */
  isConnectedToRealtime(): boolean {
    return this.isConnected;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.subscribers.clear();
    this.optimisticUpdates.clear();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.isConnected = false;
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();









