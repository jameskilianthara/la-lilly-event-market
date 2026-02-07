/**
 * Real-time Bids Hook
 * Provides real-time updates for bids using Supabase subscriptions
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface RealtimeBid {
  id: string;
  event_id: string;
  craftsman_id: string;
  status: string;
  total_forge_cost: number;
  bid_items: any[];
  notes: string;
  created_at: string;
  updated_at: string;
  shortlisted_at?: string;
  rejected_at?: string;
  competitive_intelligence?: any;
}

export function useRealtimeBids(eventId: string) {
  const [bids, setBids] = useState<RealtimeBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId || !supabase) {
      setLoading(false);
      return;
    }

    let subscription: any;

    async function setupRealtimeSubscription() {
      try {
        // 1. Initial fetch of bids
        const { data: initialBids, error: fetchError } = await supabase
          .from('bids')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Error fetching bids:', fetchError);
          setError(fetchError.message);
          setLoading(false);
          return;
        }

        setBids(initialBids || []);
        setLoading(false);

        // 2. Set up real-time subscription
        subscription = supabase
          .channel(`event-${eventId}-bids`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'bids',
              filter: `event_id=eq.${eventId}`
            },
            (payload) => {
              console.log('New bid received:', payload.new);
              setBids(prev => [payload.new as RealtimeBid, ...prev]);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'bids',
              filter: `event_id=eq.${eventId}`
            },
            (payload) => {
              console.log('Bid updated:', payload.new);
              setBids(prev =>
                prev.map(bid =>
                  bid.id === payload.new.id ? (payload.new as RealtimeBid) : bid
                )
              );
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'bids',
              filter: `event_id=eq.${eventId}`
            },
            (payload) => {
              console.log('Bid deleted:', payload.old);
              setBids(prev => prev.filter(bid => bid.id !== payload.old.id));
            }
          )
          .subscribe((status) => {
            console.log('Subscription status:', status);
          });
      } catch (err) {
        console.error('Error setting up realtime subscription:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    setupRealtimeSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        console.log('Unsubscribing from realtime updates');
        supabase.removeChannel(subscription);
      }
    };
  }, [eventId]);

  return { bids, loading, error, refetch: () => {
    // Trigger a manual refetch if needed
    setLoading(true);
    supabase
      .from('bids')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBids(data || []);
        setLoading(false);
      });
  }};
}
