import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock all dependencies BEFORE importing the routes
vi.mock('@/lib/supabase');
vi.mock('@/lib/database');
vi.mock('@/lib/api-handler');
// Don't mock @/lib/errors - use the real error classes for instanceof checks

// Import mocked modules first
import { supabase } from '@/lib/supabase';
import { createBid } from '@/lib/database';
import { withErrorHandler, validateRequired } from '@/lib/api-handler';
import { ValidationError, DatabaseError, ERROR_MESSAGES } from '@/lib/errors';

// Import the routes AFTER mocking
import { POST, GET } from '@/app/api/bids/route';

// Import the mocked modules
import { supabase } from '@/lib/supabase';
import { createBid } from '@/lib/database';
import { validateRequired } from '@/lib/api-handler';
import { ValidationError, DatabaseError } from '@/lib/errors';

describe('/api/bids', () => {
  let mockSupabaseFrom: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default successful mocks
    const mockedSupabase = vi.mocked(supabase);
    const mockedCreateBid = vi.mocked(createBid);
    const mockedValidateRequired = vi.mocked(validateRequired);
    const mockedWithErrorHandler = vi.mocked(withErrorHandler);

    // Mock withErrorHandler to just return the handler (no error wrapping for tests)
    mockedWithErrorHandler.mockImplementation((handler: any) => handler);

    // Mock validateRequired to do nothing by default
    mockedValidateRequired.mockImplementation(() => {});

    // Setup supabase mock chain
    mockSupabaseFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis()
    };

    mockedSupabase.from.mockReturnValue(mockSupabaseFrom as any);

    // Mock createBid to succeed by default
    mockedCreateBid.mockResolvedValue({ data: { id: 'bid-123' }, error: null });
  });

  describe('POST /api/bids', () => {
    it('should create a bid successfully', async () => {
      // Mock event exists and bidding is open
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: {
          id: 'event-123',
          forge_status: 'OPEN_FOR_BIDS',
          bidding_closes_at: '2024-12-31T23:59:59Z'
        },
        error: null
      });

      // Mock no existing bid
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/bids', {
        method: 'POST',
        body: JSON.stringify({
          event_id: 'event-123',
          vendor_id: 'vendor-456',
          totalAmount: 50000,
          proposal: 'Test proposal'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.bid).toEqual({ id: 'bid-123' });
      expect(data.message).toBe('Bid submitted successfully');

      expect(validateRequired).toHaveBeenCalledWith(
        expect.any(Object),
        ['event_id', 'vendor_id']
      );

      expect(createBid).toHaveBeenCalledWith({
        event_id: 'event-123',
        vendor_id: 'vendor-456',
        status: 'SUBMITTED',
        totalAmount: 50000,
        proposal: 'Test proposal'
      });
    });

    it('should validate required fields', async () => {
      (validateRequired as any).mockImplementation(() => {
        throw new ValidationError('event_id is required');
      });

      const request = new NextRequest('http://localhost:3000/api/bids', {
        method: 'POST',
        body: JSON.stringify({
          vendor_id: 'vendor-456'
          // missing event_id
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('event_id is required');
    });

    it('should validate bid amount is positive', async () => {
      const request = new NextRequest('http://localhost:3000/api/bids', {
        method: 'POST',
        body: JSON.stringify({
          event_id: 'event-123',
          vendor_id: 'vendor-456',
          totalAmount: 0
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Bid amount must be greater than zero');
    });

    it('should validate event exists', async () => {
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      });

      const request = new NextRequest('http://localhost:3000/api/bids', {
        method: 'POST',
        body: JSON.stringify({
          event_id: 'nonexistent-event',
          vendor_id: 'vendor-456',
          totalAmount: 50000
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Event not found');
    });

    it('should validate bidding is open', async () => {
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: {
          id: 'event-123',
          forge_status: 'CLOSED',
          bidding_closes_at: null
        },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/bids', {
        method: 'POST',
        body: JSON.stringify({
          event_id: 'event-123',
          vendor_id: 'vendor-456',
          totalAmount: 50000
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Bidding is closed for this event');
    });

    it('should validate bid deadline has not passed', async () => {
      const pastDeadline = new Date(Date.now() - 86400000).toISOString(); // 1 day ago

      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: {
          id: 'event-123',
          forge_status: 'OPEN_FOR_BIDS',
          bidding_closes_at: pastDeadline
        },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/bids', {
        method: 'POST',
        body: JSON.stringify({
          event_id: 'event-123',
          vendor_id: 'vendor-456',
          totalAmount: 50000
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Bid deadline has passed');
    });

    it('should prevent duplicate bids', async () => {
      // Mock event exists
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: {
          id: 'event-123',
          forge_status: 'OPEN_FOR_BIDS',
          bidding_closes_at: null
        },
        error: null
      });

      // Mock existing bid with SUBMITTED status
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: {
          id: 'existing-bid',
          status: 'SUBMITTED'
        },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/bids', {
        method: 'POST',
        body: JSON.stringify({
          event_id: 'event-123',
          vendor_id: 'vendor-456',
          totalAmount: 50000
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('You have already submitted a bid for this event');
    });

    it('should allow updating draft bids', async () => {
      // Mock event exists
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: {
          id: 'event-123',
          forge_status: 'OPEN_FOR_BIDS',
          bidding_closes_at: null
        },
        error: null
      });

      // Mock existing draft bid
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: {
          id: 'existing-bid',
          status: 'DRAFT'
        },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/bids', {
        method: 'POST',
        body: JSON.stringify({
          event_id: 'event-123',
          vendor_id: 'vendor-456',
          totalAmount: 60000,
          proposal: 'Updated proposal'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('should handle database errors during bid creation', async () => {
      // Mock successful validation checks
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: {
          id: 'event-123',
          forge_status: 'OPEN_FOR_BIDS',
          bidding_closes_at: null
        },
        error: null
      });

      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock database error
      (createBid as any).mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const request = new NextRequest('http://localhost:3000/api/bids', {
        method: 'POST',
        body: JSON.stringify({
          event_id: 'event-123',
          vendor_id: 'vendor-456',
          totalAmount: 50000
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to create bid');
    });
  });

  describe('GET /api/bids', () => {
    it('should fetch bids for an event', async () => {
      const mockBids = [
        { id: 'bid-1', event_id: 'event-123', vendor_id: 'vendor-1', totalAmount: 50000 },
        { id: 'bid-2', event_id: 'event-123', vendor_id: 'vendor-2', totalAmount: 45000 }
      ];

      mockSupabaseFrom.order.mockResolvedValue({
        data: mockBids,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/bids?event_id=event-123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.bids).toEqual(mockBids);
      expect(data.count).toBe(2);

      expect(supabase.from).toHaveBeenCalledWith('bids');
    });

    it('should validate event_id parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/bids');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required parameter: event_id');
    });

    it('should handle database errors', async () => {
      mockSupabaseFrom.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const request = new NextRequest('http://localhost:3000/api/bids?event_id=event-123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to fetch bids');
    });

    it('should return empty array when no bids exist', async () => {
      mockSupabaseFrom.order.mockResolvedValue({
        data: [],
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/bids?event_id=event-123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.bids).toEqual([]);
      expect(data.count).toBe(0);
    });
  });

  describe('Security & Input Validation', () => {
    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/bids', {
        method: 'POST',
        body: 'invalid json'
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });

    it('should handle SQL injection attempts in event_id', async () => {
      const maliciousEventId = "'; DROP TABLE bids; --";

      // Mock event check
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: {
          id: maliciousEventId,
          forge_status: 'OPEN_FOR_BIDS',
          bidding_closes_at: null
        },
        error: null
      });

      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/bids', {
        method: 'POST',
        body: JSON.stringify({
          event_id: maliciousEventId,
          vendor_id: 'vendor-456',
          totalAmount: 50000
        })
      });

      const response = await POST(request);

      // Should not crash and should use parameterized queries
      expect(response.status).toBe(201);
      expect(supabase.from).toHaveBeenCalledWith('events');
      expect(mockSupabaseFrom.eq).toHaveBeenCalledWith('id', maliciousEventId);
    });

    it('should handle XSS attempts in proposal text', async () => {
      const xssAttempt = '<script>alert("xss")</script>';

      // Mock successful validation
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: {
          id: 'event-123',
          forge_status: 'OPEN_FOR_BIDS',
          bidding_closes_at: null
        },
        error: null
      });

      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/bids', {
        method: 'POST',
        body: JSON.stringify({
          event_id: 'event-123',
          vendor_id: 'vendor-456',
          totalAmount: 50000,
          proposal: xssAttempt
        })
      });

      const response = await POST(request);

      // Should create bid without executing scripts
      expect(response.status).toBe(201);
      expect(createBid).toHaveBeenCalledWith(
        expect.objectContaining({
          proposal: xssAttempt // Should be stored as-is, not sanitized here
        })
      );
    });
  });
});
