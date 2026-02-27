/**
 * API Route: Razorpay Webhook Handler
 * POST /api/payments/webhook
 *
 * Handles Razorpay webhook events for payment confirmation,
 * commission collection, and vendor payout scheduling
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';
import {
  verifyWebhookSignature,
  capturePayment,
  paiseToRupees,
  type RazorpayWebhookEvent,
} from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    // =====================================================
    // 1. VERIFY WEBHOOK SIGNATURE
    // =====================================================

    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing webhook signature',
        },
        { status: 401 }
      );
    }

    const rawBody = await request.text();

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid signature',
        },
        { status: 401 }
      );
    }

    // =====================================================
    // 2. PARSE WEBHOOK EVENT
    // =====================================================

    const event: RazorpayWebhookEvent = JSON.parse(rawBody);

    console.log('Razorpay webhook event received:', event.event);

    // =====================================================
    // 3. HANDLE DIFFERENT EVENT TYPES
    // =====================================================

    switch (event.event) {
      case 'payment.authorized':
        return await handlePaymentAuthorized(event);

      case 'payment.captured':
        return await handlePaymentCaptured(event);

      case 'payment.failed':
        return await handlePaymentFailed(event);

      case 'order.paid':
        return await handleOrderPaid(event);

      case 'refund.created':
        return await handleRefundCreated(event);

      case 'payout.processed':
        return await handlePayoutProcessed(event);

      case 'payout.reversed':
        return await handlePayoutReversed(event);

      default:
        console.log('Unhandled webhook event:', event.event);
        return NextResponse.json({ success: true, message: 'Event not handled' });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}

// =====================================================
// EVENT HANDLERS
// =====================================================

/**
 * Handles payment.authorized event
 * Payment has been authorized but not yet captured
 */
async function handlePaymentAuthorized(event: RazorpayWebhookEvent) {
  try {
    const payment = event.payload.payment.entity;

    // Update payment status to PROCESSING
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'PROCESSING',
        razorpay_payment_id: payment.id,
        payment_method: payment.method,
        payment_metadata: {
          ...event.payload,
          authorized_at: new Date().toISOString(),
        },
      })
      .eq('razorpay_order_id', payment.order_id);

    if (error) {
      console.error('Error updating payment status:', error);
    }

    // Auto-capture the payment
    const captureResult = await capturePayment(payment.id, paiseToRupees(payment.amount));

    if (!captureResult.success) {
      console.error('Failed to capture payment:', captureResult.error);
    }

    return NextResponse.json({ success: true, message: 'Payment authorized and captured' });
  } catch (error) {
    console.error('Error handling payment.authorized:', error);
    return NextResponse.json({ success: false, error: 'Failed to handle payment authorization' }, { status: 500 });
  }
}

/**
 * Handles payment.captured event
 * Payment has been successfully captured - this is the key event
 */
async function handlePaymentCaptured(event: RazorpayWebhookEvent) {
  try {
    const payment = event.payload.payment.entity;
    const amountInRupees = paiseToRupees(payment.amount);

    // =====================================================
    // 1. FIND PAYMENT RECORD
    // =====================================================

    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .select('*, contracts(*)')
      .eq('razorpay_order_id', payment.order_id)
      .single();

    if (paymentError || !paymentRecord) {
      console.error('Payment record not found:', payment.order_id);
      return NextResponse.json({ success: false, error: 'Payment record not found' }, { status: 404 });
    }

    // =====================================================
    // 2. UPDATE PAYMENT STATUS TO COMPLETED
    // =====================================================

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'COMPLETED',
        razorpay_payment_id: payment.id,
        payment_method: payment.method,
        client_paid_at: new Date().toISOString(),
        commission_collected: paymentRecord.contracts.commission_amount,
        payment_metadata: {
          ...event.payload,
          captured_at: new Date().toISOString(),
        },
      })
      .eq('id', paymentRecord.id);

    if (updateError) {
      console.error('Error updating payment:', updateError);
    }

    // =====================================================
    // 3. UPDATE CONTRACT STATUS TO COMMISSIONED
    // =====================================================

    const { error: contractError } = await supabase
      .from('contracts')
      .update({
        status: 'COMMISSIONED',
      })
      .eq('id', paymentRecord.contract_id);

    if (contractError) {
      console.error('Error updating contract status:', contractError);
    }

    // =====================================================
    // 4. RECORD COMMISSION REVENUE
    // =====================================================

    const { error: revenueError } = await supabase.from('commission_revenue').insert({
      contract_id: paymentRecord.contract_id,
      payment_id: paymentRecord.id,
      project_value: paymentRecord.contracts.project_value,
      commission_rate: paymentRecord.contracts.commission_rate,
      commission_amount: paymentRecord.contracts.commission_amount,
      platform_fee: paymentRecord.contracts.platform_fee,
      total_revenue: paymentRecord.contracts.commission_amount + paymentRecord.contracts.platform_fee,
      commission_tier: paymentRecord.contracts.commission_tier,
      collected_at: new Date().toISOString(),
    });

    if (revenueError) {
      console.error('Error recording commission revenue:', revenueError);
    }

    // =====================================================
    // 5. SCHEDULE VENDOR PAYOUT (48 hours after payment)
    // =====================================================

    const payoutScheduledAt = new Date();
    payoutScheduledAt.setHours(payoutScheduledAt.getHours() + 48);

    const { error: payoutError } = await supabase
      .from('payments')
      .update({
        payout_scheduled_at: payoutScheduledAt.toISOString(),
      })
      .eq('id', paymentRecord.id);

    if (payoutError) {
      console.error('Error scheduling payout:', payoutError);
    }

    // =====================================================
    // 6. UPDATE EVENT STATUS
    // =====================================================

    const { error: eventError } = await supabase
      .from('events')
      .update({
        forge_status: 'IN_FORGE',
      })
      .eq('id', paymentRecord.contracts.event_id);

    if (eventError) {
      console.error('Error updating event status:', eventError);
    }

    console.log('Payment captured successfully:', {
      paymentId: payment.id,
      amount: amountInRupees,
      contractId: paymentRecord.contract_id,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment processed and commission collected',
    });
  } catch (error) {
    console.error('Error handling payment.captured:', error);
    return NextResponse.json({ success: false, error: 'Failed to process payment' }, { status: 500 });
  }
}

/**
 * Handles payment.failed event
 */
async function handlePaymentFailed(event: RazorpayWebhookEvent) {
  try {
    const payment = event.payload.payment.entity;

    const { error } = await supabase
      .from('payments')
      .update({
        status: 'FAILED',
        payment_metadata: {
          ...event.payload,
          failed_at: new Date().toISOString(),
        },
      })
      .eq('razorpay_order_id', payment.order_id);

    if (error) {
      console.error('Error updating payment status:', error);
    }

    return NextResponse.json({ success: true, message: 'Payment failure recorded' });
  } catch (error) {
    console.error('Error handling payment.failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to handle payment failure' }, { status: 500 });
  }
}

/**
 * Handles order.paid event
 */
async function handleOrderPaid(event: RazorpayWebhookEvent) {
  // This is a secondary confirmation - main processing happens in payment.captured
  console.log('Order paid event received:', event.payload.order?.entity.id);
  return NextResponse.json({ success: true, message: 'Order paid event logged' });
}

/**
 * Handles refund.created event
 */
async function handleRefundCreated(event: RazorpayWebhookEvent) {
  try {
    const payment = event.payload.payment.entity;

    const { error } = await supabase
      .from('payments')
      .update({
        status: 'REFUNDED',
        payment_metadata: {
          ...event.payload,
          refunded_at: new Date().toISOString(),
        },
      })
      .eq('razorpay_payment_id', payment.id);

    if (error) {
      console.error('Error updating payment status:', error);
    }

    return NextResponse.json({ success: true, message: 'Refund recorded' });
  } catch (error) {
    console.error('Error handling refund.created:', error);
    return NextResponse.json({ success: false, error: 'Failed to handle refund' }, { status: 500 });
  }
}

/**
 * Handles payout.processed event
 */
async function handlePayoutProcessed(event: RazorpayWebhookEvent) {
  try {
    // Extract payout details from event payload
    const payout = (event.payload as any).payout.entity; // Razorpay payout webhook structure

    // Find vendor payout record
    const { data: vendorPayout, error: findError } = await supabase
      .from('vendor_payouts')
      .select('*')
      .eq('razorpay_payout_id', payout.id)
      .single();

    if (findError || !vendorPayout) {
      console.error('Vendor payout record not found:', payout.id);
      return NextResponse.json({ success: false, error: 'Payout record not found' }, { status: 404 });
    }

    // Update payout status
    const { error: updateError } = await supabase
      .from('vendor_payouts')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
      })
      .eq('id', vendorPayout.id);

    if (updateError) {
      console.error('Error updating payout status:', updateError);
    }

    // Update payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        vendor_paid_at: new Date().toISOString(),
        vendor_payout_id: payout.id,
      })
      .eq('id', vendorPayout.payment_id);

    if (paymentError) {
      console.error('Error updating payment record:', paymentError);
    }

    console.log('Vendor payout processed:', vendorPayout.id);

    return NextResponse.json({ success: true, message: 'Vendor payout processed' });
  } catch (error) {
    console.error('Error handling payout.processed:', error);
    return NextResponse.json({ success: false, error: 'Failed to handle payout' }, { status: 500 });
  }
}

/**
 * Handles payout.reversed event
 */
async function handlePayoutReversed(event: RazorpayWebhookEvent) {
  try {
    const payout = (event.payload as any).payout.entity;

    const { error } = await supabase
      .from('vendor_payouts')
      .update({
        status: 'FAILED',
        failed_at: new Date().toISOString(),
        failure_reason: 'Payout reversed by Razorpay',
      })
      .eq('razorpay_payout_id', payout.id);

    if (error) {
      console.error('Error updating payout status:', error);
    }

    return NextResponse.json({ success: true, message: 'Payout reversal recorded' });
  } catch (error) {
    console.error('Error handling payout.reversed:', error);
    return NextResponse.json({ success: false, error: 'Failed to handle payout reversal' }, { status: 500 });
  }
}
