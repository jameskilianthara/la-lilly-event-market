/**
 * Razorpay Integration Utilities for EventFoundry
 *
 * Handles payment processing, webhook verification, and vendor payouts
 * using Razorpay API for Indian market compliance.
 */

import crypto from 'crypto';
import { calculateCommission, type CommissionBreakdown } from './commission';

// =====================================================
// CONFIGURATION & TYPES
// =====================================================

export const RAZORPAY_CONFIG = {
  keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  currency: 'INR',
  enableTestMode: process.env.NODE_ENV === 'development',
};

export interface RazorpayOrder {
  id: string;
  entity: 'order';
  amount: number; // Amount in smallest currency unit (paise for INR)
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
  attempts: number;
  notes: Record<string, any>;
  created_at: number;
}

export interface RazorpayPayment {
  id: string;
  entity: 'payment';
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  order_id: string;
  method: 'card' | 'netbanking' | 'wallet' | 'upi' | 'emi';
  captured: boolean;
  email: string;
  contact: string;
  created_at: number;
  notes: Record<string, any>;
}

export interface RazorpayWebhookEvent {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment: {
      entity: RazorpayPayment;
    };
    order?: {
      entity: RazorpayOrder;
    };
  };
  created_at: number;
}

export interface CreateOrderParams {
  contractId: string;
  projectValue: number;
  clientEmail: string;
  clientPhone: string;
  commission: CommissionBreakdown;
}

export interface CreatePayoutParams {
  vendorId: string;
  contractId: string;
  payoutAmount: number;
  bankAccountNumber: string;
  bankIfscCode: string;
  bankAccountName: string;
}

// =====================================================
// RAZORPAY ORDER CREATION
// =====================================================

/**
 * Creates a Razorpay order for client payment
 * Amount includes project value (vendor gets value - commission)
 */
export async function createRazorpayOrder(
  params: CreateOrderParams
): Promise<{ success: boolean; order?: RazorpayOrder; error?: string }> {
  try {
    const { contractId, projectValue, clientEmail, clientPhone, commission } = params;

    // Convert to paise (smallest unit)
    const amountInPaise = Math.round(projectValue * 100);

    // Create order via Razorpay API
    const orderData = {
      amount: amountInPaise,
      currency: RAZORPAY_CONFIG.currency,
      receipt: `contract_${contractId}`,
      notes: {
        contract_id: contractId,
        project_value: projectValue,
        commission_amount: commission.commissionAmount,
        platform_fee: commission.platformFee,
        vendor_payout: commission.vendorPayout,
        commission_tier: commission.tier,
      },
    };

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${RAZORPAY_CONFIG.keyId}:${RAZORPAY_CONFIG.keySecret}`
        ).toString('base64')}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error?.description || 'Failed to create Razorpay order',
      };
    }

    const order: RazorpayOrder = await response.json();

    return { success: true, order };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating order',
    };
  }
}

// =====================================================
// PAYMENT VERIFICATION
// =====================================================

/**
 * Verifies Razorpay payment signature
 * Critical security check before marking payment as successful
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_CONFIG.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

/**
 * Verifies Razorpay webhook signature
 * Ensures webhook requests are authentic
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  try {
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_CONFIG.webhookSecret)
      .update(payload)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// =====================================================
// PAYMENT CAPTURE
// =====================================================

/**
 * Captures an authorized payment
 * Razorpay payments are authorized first, then captured
 */
export async function capturePayment(
  paymentId: string,
  amount: number
): Promise<{ success: boolean; payment?: RazorpayPayment; error?: string }> {
  try {
    const amountInPaise = Math.round(amount * 100);

    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${RAZORPAY_CONFIG.keyId}:${RAZORPAY_CONFIG.keySecret}`
        ).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: RAZORPAY_CONFIG.currency,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error?.description || 'Failed to capture payment',
      };
    }

    const payment: RazorpayPayment = await response.json();

    return { success: true, payment };
  } catch (error) {
    console.error('Error capturing payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error capturing payment',
    };
  }
}

// =====================================================
// REFUND PROCESSING
// =====================================================

export interface CreateRefundParams {
  paymentId: string;
  amount?: number; // If not provided, full refund
  reason?: string;
  notes?: Record<string, any>;
}

/**
 * Creates a refund for a payment
 * Used for cancellations or disputes
 */
export async function createRefund(
  params: CreateRefundParams
): Promise<{ success: boolean; refund?: any; error?: string }> {
  try {
    const { paymentId, amount, reason, notes } = params;

    const refundData: any = {
      notes: notes || {},
    };

    // Partial refund if amount specified
    if (amount) {
      refundData.amount = Math.round(amount * 100); // Convert to paise
    }

    if (reason) {
      refundData.notes.reason = reason;
    }

    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${RAZORPAY_CONFIG.keyId}:${RAZORPAY_CONFIG.keySecret}`
        ).toString('base64')}`,
      },
      body: JSON.stringify(refundData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error?.description || 'Failed to create refund',
      };
    }

    const refund = await response.json();

    return { success: true, refund };
  } catch (error) {
    console.error('Error creating refund:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating refund',
    };
  }
}

// =====================================================
// VENDOR PAYOUT (using Razorpay X)
// =====================================================

/**
 * Creates a payout to vendor's bank account
 * Uses Razorpay X (requires separate activation)
 */
export async function createVendorPayout(
  params: CreatePayoutParams
): Promise<{ success: boolean; payout?: any; error?: string }> {
  try {
    const {
      vendorId,
      contractId,
      payoutAmount,
      bankAccountNumber,
      bankIfscCode,
      bankAccountName,
    } = params;

    // Step 1: Create Fund Account (if not already exists)
    const fundAccountData = {
      contact_id: vendorId, // Assumes contact created during vendor onboarding
      account_type: 'bank_account',
      bank_account: {
        name: bankAccountName,
        ifsc: bankIfscCode,
        account_number: bankAccountNumber,
      },
    };

    const fundAccountResponse = await fetch('https://api.razorpay.com/v1/fund_accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${RAZORPAY_CONFIG.keyId}:${RAZORPAY_CONFIG.keySecret}`
        ).toString('base64')}`,
      },
      body: JSON.stringify(fundAccountData),
    });

    if (!fundAccountResponse.ok) {
      const errorData = await fundAccountResponse.json();
      return {
        success: false,
        error: errorData.error?.description || 'Failed to create fund account',
      };
    }

    const fundAccount = await fundAccountResponse.json();

    // Step 2: Create Payout
    const payoutData = {
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER || '', // Your business account
      fund_account_id: fundAccount.id,
      amount: Math.round(payoutAmount * 100), // Convert to paise
      currency: RAZORPAY_CONFIG.currency,
      mode: 'IMPS', // Immediate payment
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: `contract_${contractId}`,
      narration: `EventFoundry project payment - Contract ${contractId}`,
      notes: {
        contract_id: contractId,
        vendor_id: vendorId,
      },
    };

    const payoutResponse = await fetch('https://api.razorpay.com/v1/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${RAZORPAY_CONFIG.keyId}:${RAZORPAY_CONFIG.keySecret}`
        ).toString('base64')}`,
      },
      body: JSON.stringify(payoutData),
    });

    if (!payoutResponse.ok) {
      const errorData = await payoutResponse.json();
      return {
        success: false,
        error: errorData.error?.description || 'Failed to create payout',
      };
    }

    const payout = await payoutResponse.json();

    return { success: true, payout };
  } catch (error) {
    console.error('Error creating vendor payout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating payout',
    };
  }
}

// =====================================================
// PAYMENT STATUS CHECKING
// =====================================================

/**
 * Fetches payment details from Razorpay
 */
export async function getPaymentDetails(
  paymentId: string
): Promise<{ success: boolean; payment?: RazorpayPayment; error?: string }> {
  try {
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${RAZORPAY_CONFIG.keyId}:${RAZORPAY_CONFIG.keySecret}`
        ).toString('base64')}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error?.description || 'Failed to fetch payment details',
      };
    }

    const payment: RazorpayPayment = await response.json();

    return { success: true, payment };
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error fetching payment',
    };
  }
}

/**
 * Fetches order details from Razorpay
 */
export async function getOrderDetails(
  orderId: string
): Promise<{ success: boolean; order?: RazorpayOrder; error?: string }> {
  try {
    const response = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${RAZORPAY_CONFIG.keyId}:${RAZORPAY_CONFIG.keySecret}`
        ).toString('base64')}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error?.description || 'Failed to fetch order details',
      };
    }

    const order: RazorpayOrder = await response.json();

    return { success: true, order };
  } catch (error) {
    console.error('Error fetching order details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error fetching order',
    };
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Converts amount from rupees to paise
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Converts amount from paise to rupees
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Formats amount for display
 */
export function formatRazorpayAmount(amountInPaise: number): string {
  const rupees = paiseToRupees(amountInPaise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Validates Razorpay configuration
 */
export function validateRazorpayConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!RAZORPAY_CONFIG.keyId) {
    errors.push('NEXT_PUBLIC_RAZORPAY_KEY_ID is not configured');
  }

  if (!RAZORPAY_CONFIG.keySecret) {
    errors.push('RAZORPAY_KEY_SECRET is not configured');
  }

  if (!RAZORPAY_CONFIG.webhookSecret) {
    errors.push('RAZORPAY_WEBHOOK_SECRET is not configured');
  }

  if (!process.env.RAZORPAY_ACCOUNT_NUMBER) {
    errors.push('RAZORPAY_ACCOUNT_NUMBER is not configured');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
