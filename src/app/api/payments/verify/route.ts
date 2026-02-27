/**
 * API Route: Verify Payment
 * POST /api/payments/verify
 *
 * Verifies Razorpay payment signature after client completes payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { verifyPaymentSignature } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    // =====================================================
    // 1. VERIFY JWT
    // =====================================================

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const token = authHeader.slice(7);
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user: jwtUser }, error: jwtError } = await authClient.auth.getUser(token);
    if (jwtError || !jwtUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // =====================================================
    // 2. PARSE REQUEST BODY
    // =====================================================

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 2. VERIFY PAYMENT SIGNATURE
    // =====================================================

    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      console.error('Invalid payment signature:', {
        razorpay_order_id,
        razorpay_payment_id,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment signature',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 3. FIND PAYMENT RECORD
    // =====================================================

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment record not found',
        },
        { status: 404 }
      );
    }

    // =====================================================
    // 4. UPDATE PAYMENT WITH SIGNATURE
    // =====================================================

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'PROCESSING',
        payment_metadata: {
          ...payment.payment_metadata,
          signature_verified_at: new Date().toISOString(),
        },
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update payment record',
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 5. RETURN SUCCESS
    // =====================================================

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentId: payment.id,
        status: 'PROCESSING',
        razorpay_payment_id,
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
