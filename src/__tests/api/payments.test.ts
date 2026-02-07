import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payments/create/route';

// Mock all dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }
}));

vi.mock('@/lib/commission', () => ({
  calculateCommission: vi.fn()
}));

vi.mock('@/lib/razorpay', () => ({
  createRazorpayOrder: vi.fn(),
  validateRazorpayConfig: vi.fn()
}));

vi.mock('@/lib/api-handler', () => ({
  withErrorHandler: (handler: any) => handler,
  validateRequired: vi.fn()
}));

vi.mock('@/lib/errors', () => ({
  ValidationError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  },
  PaymentError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'PaymentError';
    }
  },
  DatabaseError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'DatabaseError';
    }
  },
  AuthenticationError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthenticationError';
    }
  }
}));

// Import mocked modules
import { supabase } from '@/lib/supabase';
import { calculateCommission } from '@/lib/commission';
import { createRazorpayOrder, validateRazorpayConfig } from '@/lib/razorpay';
import { validateRequired } from '@/lib/api-handler';
import { ValidationError, PaymentError, DatabaseError, AuthenticationError } from '@/lib/errors';

describe('/api/payments/create', () => {
  let mockSupabaseFrom: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock chain
    mockSupabaseFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis()
    };

    (supabase.from as any).mockReturnValue(mockSupabaseFrom);

    // Default mock implementations
    (validateRazorpayConfig as any).mockReturnValue({ valid: true });
    (calculateCommission as any).mockReturnValue({
      commissionRate: 0.1,
      commissionAmount: 5000,
      platformFee: 5000,
      vendorPayout: 45000,
      tier: 'standard'
    });
    (createRazorpayOrder as any).mockResolvedValue({
      success: true,
      order: { id: 'order_123' }
    });
  });

  describe('Razorpay Configuration Validation', () => {
    it('should fail when Razorpay is not configured', async () => {
      (validateRazorpayConfig as any).mockReturnValue({
        valid: false,
        errors: ['Missing API key', 'Missing secret']
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          contractId: 'contract-123',
          userId: 'user-456'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Razorpay not configured');
    });
  });

  describe('Input Validation', () => {
    it('should validate required fields', async () => {
      (validateRequired as any).mockImplementation(() => {
        throw new ValidationError('contractId is required');
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-456'
          // missing contractId
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('contractId is required');
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/create', {
        method: 'POST',
        body: 'invalid json'
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });

  describe('Contract Validation', () => {
    it('should fail when contract does not exist', async () => {
      mockSupabaseFrom.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          contractId: 'nonexistent-contract',
          userId: 'user-456'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Contract not found');
    });

    it('should validate contract belongs to user', async () => {
      mockSupabaseFrom.single.mockResolvedValue({
        data: {
          id: 'contract-123',
          status: 'SIGNED',
          events: {
            owner_user_id: 'different-user',
            title: 'Test Event'
          },
          bids: {
            total_forge_cost: 50000,
            vendor_id: 'vendor-123',
            vendors: { company_name: 'Test Vendor' }
          }
        },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          contractId: 'contract-123',
          userId: 'user-456'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized: You are not the event owner');
    });

    it('should validate contract is signed', async () => {
      mockSupabaseFrom.single.mockResolvedValue({
        data: {
          id: 'contract-123',
          status: 'PENDING',
          events: {
            owner_user_id: 'user-456',
            title: 'Test Event'
          },
          bids: {
            total_forge_cost: 50000,
            vendor_id: 'vendor-123',
            vendors: { company_name: 'Test Vendor' }
          }
        },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          contractId: 'contract-123',
          userId: 'user-456'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Contract must be signed before payment');
    });
  });

  describe('Payment Validation', () => {
    beforeEach(() => {
      // Setup valid contract mock
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: {
          id: 'contract-123',
          status: 'SIGNED',
          events: {
            owner_user_id: 'user-456',
            title: 'Test Event'
          },
          bids: {
            total_forge_cost: 50000,
            vendor_id: 'vendor-123',
            vendors: { company_name: 'Test Vendor' }
          }
        },
        error: null
      });
    });

    it('should prevent duplicate payments', async () => {
      // Mock existing completed payment
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: { id: 'payment-123', status: 'COMPLETED' },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          contractId: 'contract-123',
          userId: 'user-456'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Payment already completed for this contract');
    });

    it('should validate client user exists', async () => {
      // Mock no existing payment
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock client user not found
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          contractId: 'contract-123',
          userId: 'user-456'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Client user not found');
    });
  });

  describe('Payment Creation Flow', () => {
    beforeEach(() => {
      // Setup all valid mocks
      mockSupabaseFrom.single
        // Contract fetch
        .mockResolvedValueOnce({
          data: {
            id: 'contract-123',
            status: 'SIGNED',
            events: {
              owner_user_id: 'user-456',
              title: 'Test Event'
            },
            bids: {
              total_forge_cost: 50000,
              vendor_id: 'vendor-123',
              vendors: { company_name: 'Test Vendor' }
            }
          },
          error: null
        })
        // Payment check
        .mockResolvedValueOnce({
          data: null,
          error: null
        })
        // Client user fetch
        .mockResolvedValueOnce({
          data: {
            id: 'user-456',
            email: 'client@example.com',
            full_name: 'Test Client',
            phone: '+1234567890'
          },
          error: null
        });

      // Contract update mock
      mockSupabaseFrom.update.mockResolvedValue({
        error: null
      });

      // Payment insert mock
      mockSupabaseFrom.insert.mockReturnThis();
      mockSupabaseFrom.select.mockReturnThis();
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: { id: 'payment-123' },
        error: null
      });
    });

    it('should create payment order successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          contractId: 'contract-123',
          userId: 'user-456'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        paymentId: 'payment-123',
        razorpayOrderId: 'order_123',
        razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: 50000,
        currency: 'INR',
        commission: {
          commissionRate: 0.1,
          commissionAmount: 5000,
          platformFee: 5000,
          vendorPayout: 45000,
          tier: 'standard'
        },
        contract: {
          id: 'contract-123',
          title: 'Test Event',
          vendorName: 'Test Vendor'
        },
        clientDetails: {
          name: 'Test Client',
          email: 'client@example.com',
          phone: '+1234567890'
        }
      });

      // Verify commission calculation
      expect(calculateCommission).toHaveBeenCalledWith(50000);

      // Verify Razorpay order creation
      expect(createRazorpayOrder).toHaveBeenCalledWith({
        contractId: 'contract-123',
        projectValue: 50000,
        clientEmail: 'client@example.com',
        clientPhone: '+1234567890',
        commission: {
          commissionRate: 0.1,
          commissionAmount: 5000,
          platformFee: 5000,
          vendorPayout: 45000,
          tier: 'standard'
        }
      });
    });

    it('should handle Razorpay order creation failure', async () => {
      (createRazorpayOrder as any).mockResolvedValue({
        success: false,
        error: 'Razorpay API error'
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          contractId: 'contract-123',
          userId: 'user-456'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Razorpay API error');
    });

    it('should handle payment record creation failure', async () => {
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Insert failed' }
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          contractId: 'contract-123',
          userId: 'user-456'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create payment record');
    });
  });

  describe('Contract Update', () => {
    beforeEach(() => {
      // Setup valid mocks
      mockSupabaseFrom.single
        .mockResolvedValueOnce({
          data: {
            id: 'contract-123',
            status: 'SIGNED',
            events: {
              owner_user_id: 'user-456',
              title: 'Test Event'
            },
            bids: {
              total_forge_cost: 50000,
              vendor_id: 'vendor-123',
              vendors: { company_name: 'Test Vendor' }
            }
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: null,
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            id: 'user-456',
            email: 'client@example.com',
            full_name: 'Test Client',
            phone: '+1234567890'
          },
          error: null
        });

      mockSupabaseFrom.insert.mockReturnThis();
      mockSupabaseFrom.select.mockReturnThis();
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: { id: 'payment-123' },
        error: null
      });
    });

    it('should update contract with commission details', async () => {
      mockSupabaseFrom.update.mockResolvedValue({
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          contractId: 'contract-123',
          userId: 'user-456'
        })
      });

      await POST(request);

      expect(mockSupabaseFrom.update).toHaveBeenCalledWith({
        project_value: 50000,
        commission_rate: 0.1,
        commission_amount: 5000,
        platform_fee: 5000,
        vendor_payout: 45000,
        commission_tier: 'standard'
      });
      expect(mockSupabaseFrom.eq).toHaveBeenCalledWith('id', 'contract-123');
    });

    it('should continue if contract update fails', async () => {
      mockSupabaseFrom.update.mockResolvedValue({
        error: { message: 'Update failed' }
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          contractId: 'contract-123',
          userId: 'user-456'
        })
      });

      const response = await POST(request);

      // Should still succeed despite contract update failure
      expect(response.status).toBe(200);
    });
  });

  describe('Security & Edge Cases', () => {
    it('should handle SQL injection attempts in contractId', async () => {
      const maliciousContractId = "'; DROP TABLE contracts; --";

      mockSupabaseFrom.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          contractId: maliciousContractId,
          userId: 'user-456'
        })
      });

      const response = await POST(request);

      // Should use parameterized queries, not crash
      expect(response.status).toBe(400);
      expect(mockSupabaseFrom.eq).toHaveBeenCalledWith('id', maliciousContractId);
    });

    it('should validate commission calculation input', async () => {
      // Setup valid contract with zero cost
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: {
          id: 'contract-123',
          status: 'SIGNED',
          events: {
            owner_user_id: 'user-456',
            title: 'Test Event'
          },
          bids: {
            total_forge_cost: 0, // Edge case
            vendor_id: 'vendor-123',
            vendors: { company_name: 'Test Vendor' }
          }
        },
        error: null
      });

      mockSupabaseFrom.single
        .mockResolvedValueOnce({ data: null, error: null }) // No existing payment
        .mockResolvedValueOnce({
          data: {
            id: 'user-456',
            email: 'client@example.com',
            full_name: 'Test Client'
          },
          error: null
        });

      mockSupabaseFrom.insert.mockReturnThis();
      mockSupabaseFrom.select.mockReturnThis();
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: { id: 'payment-123' },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          contractId: 'contract-123',
          userId: 'user-456'
        })
      });

      const response = await POST(request);

      // Should handle zero cost gracefully
      expect(response.status).toBe(200);
      expect(calculateCommission).toHaveBeenCalledWith(0);
    });

    it('should handle missing environment variables', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      // Setup valid mocks
      mockSupabaseFrom.single
        .mockResolvedValueOnce({
          data: {
            id: 'contract-123',
            status: 'SIGNED',
            events: {
              owner_user_id: 'user-456',
              title: 'Test Event'
            },
            bids: {
              total_forge_cost: 50000,
              vendor_id: 'vendor-123',
              vendors: { company_name: 'Test Vendor' }
            }
          },
          error: null
        })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({
          data: {
            id: 'user-456',
            email: 'client@example.com',
            full_name: 'Test Client'
          },
          error: null
        });

      mockSupabaseFrom.insert.mockReturnThis();
      mockSupabaseFrom.select.mockReturnThis();
      mockSupabaseFrom.single.mockResolvedValueOnce({
        data: { id: 'payment-123' },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          contractId: 'contract-123',
          userId: 'user-456'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.razorpayKeyId).toBeUndefined();

      // Restore env
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = originalEnv;
    });
  });
});
