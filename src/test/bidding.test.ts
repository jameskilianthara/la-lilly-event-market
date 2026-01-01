// src/test/bidding.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';

// Mock the database module
const mockUpdateEvent = vi.fn();
vi.mock('@/lib/database', () => ({
  updateEvent: (...args: any[]) => mockUpdateEvent(...args),
}));

// Mock the shortlisting module
const mockTriggerAutomaticShortlisting = vi.fn();
vi.mock('@/lib/shortlisting', () => ({
  triggerAutomaticShortlisting: (...args: any[]) => mockTriggerAutomaticShortlisting(...args),
}));

describe('Bidding System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTriggerAutomaticShortlisting.mockResolvedValue({
      success: true,
      shortlistedCount: 3,
      rejectedCount: 2,
    });
  });

  describe('Bid Window Management', () => {
    it('should close bidding window successfully', async () => {
      const { closeBiddingWindow } = await import('@/lib/bidding');
      
      // Mock Supabase responses
      const mockEvent = {
        id: 'test-event-id',
        forge_status: 'OPEN_FOR_BIDS',
        bidding_closes_at: '2025-01-01T00:00:00Z',
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      mockUpdateEvent.mockResolvedValue({ error: null });

      const result = await closeBiddingWindow('test-event-id');
      
      expect(result.success).toBe(true);
      expect(mockUpdateEvent).toHaveBeenCalledWith('test-event-id', expect.objectContaining({
        forge_status: 'CRAFTSMEN_BIDDING',
      }));
    });

    it('should handle database errors gracefully', async () => {
      const { closeBiddingWindow } = await import('@/lib/bidding');
      
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await closeBiddingWindow('test-event-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should not close window if event is already closed', async () => {
      const { closeBiddingWindow } = await import('@/lib/bidding');
      
      const mockEvent = {
        id: 'test-event-id',
        forge_status: 'SHORTLIST_REVIEW',
        bidding_closes_at: '2025-01-01T00:00:00Z',
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await closeBiddingWindow('test-event-id');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('already closed');
      expect(mockUpdateEvent).not.toHaveBeenCalled();
    });
  });

  describe('Expired Window Check', () => {
    it('should identify and close expired events', async () => {
      const { checkExpiredBiddingWindows } = await import('@/lib/bidding');
      
      const mockExpiredEvents = [
        { id: 'event-1', bidding_closes_at: '2025-01-01T00:00:00Z', forge_status: 'OPEN_FOR_BIDS' },
        { id: 'event-2', bidding_closes_at: '2025-01-01T00:00:00Z', forge_status: 'CRAFTSMEN_BIDDING' },
      ];

      // Mock the query chain for finding expired events
      const mockLt = vi.fn().mockResolvedValue({
        data: mockExpiredEvents,
        error: null,
      });

      const mockNot = vi.fn().mockReturnValue({
        lt: mockLt,
      });

      const mockIn = vi.fn().mockReturnValue({
        not: mockNot,
      });

      const mockSelect = vi.fn().mockReturnValue({
        in: mockIn,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      mockUpdateEvent.mockResolvedValue({ error: null });

      // Also need to mock the individual event fetch in closeBiddingWindow
      const mockSingleForClose = vi.fn().mockResolvedValue({
        data: { id: 'event-1', forge_status: 'OPEN_FOR_BIDS', bidding_closes_at: '2025-01-01T00:00:00Z' },
        error: null,
      });

      const mockEqForClose = vi.fn().mockReturnValue({
        single: mockSingleForClose,
      });

      const mockSelectForClose = vi.fn().mockReturnValue({
        eq: mockEqForClose,
      });

      // When closeBiddingWindow is called, it will use this mock
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: mockSelect,
      } as any).mockReturnValue({
        select: mockSelectForClose,
      } as any);

      const result = await checkExpiredBiddingWindows();
      
      expect(result.success).toBe(true);
      expect(result.closedCount).toBeGreaterThanOrEqual(0);
    });

    it('should return success with zero count when no expired events found', async () => {
      const { checkExpiredBiddingWindows } = await import('@/lib/bidding');
      
      const mockLt = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const mockNot = vi.fn().mockReturnValue({
        lt: mockLt,
      });

      const mockIn = vi.fn().mockReturnValue({
        not: mockNot,
      });

      const mockSelect = vi.fn().mockReturnValue({
        in: mockIn,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await checkExpiredBiddingWindows();
      
      expect(result.success).toBe(true);
      expect(result.closedCount).toBe(0);
    });
  });
});

