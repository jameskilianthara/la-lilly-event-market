/**
 * API Route: Initiate Vendor Payout
 * POST /api/payments/payout
 *
 * Initiates payout to vendor after successful client payment
 * Typically called 48 hours after payment capture
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';
import { createVendorPayout } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    // =====================================================
    // 1. PARSE REQUEST BODY
    // =====================================================

    const body = await request.json();
    const { paymentId, adminUserId } = body;

    if (!paymentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: paymentId',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 2. VERIFY ADMIN AUTHORIZATION
    // =====================================================

    if (adminUserId) {
      const { data: adminUser } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', adminUserId)
        .single();

      if (!adminUser || adminUser.user_type !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized: Admin access required',
          },
          { status: 403 }
        );
      }
    }

    // =====================================================
    // 3. FETCH PAYMENT AND CONTRACT DETAILS
    // =====================================================

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(
        `
        *,
        contracts (
          id,
          vendor_payout,
          event_id,
          bids (
            vendor_id,
            vendors (
              id,
              company_name,
              bank_account_number,
              bank_ifsc_code,
              bank_account_name,
              user_id
            )
          )
        )
      `
      )
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment not found',
        },
        { status: 404 }
      );
    }

    // =====================================================
    // 4. VALIDATE PAYMENT STATUS
    // =====================================================

    if (payment.status !== 'COMPLETED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment must be completed before initiating payout',
        },
        { status: 400 }
      );
    }

    if (payment.vendor_paid_at) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vendor has already been paid for this contract',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 5. CHECK PAYOUT ELIGIBILITY (48 hours after payment)
    // =====================================================

    const paymentDate = new Date(payment.client_paid_at);
    const now = new Date();
    const hoursSincePayment = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60);

    if (hoursSincePayment < 48 && !adminUserId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payout can only be initiated 48 hours after payment',
          hoursRemaining: Math.ceil(48 - hoursSincePayment),
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 6. VALIDATE VENDOR BANK DETAILS
    // =====================================================

    const vendor = payment.contracts.bids.vendors;

    if (!vendor.bank_account_number || !vendor.bank_ifsc_code || !vendor.bank_account_name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vendor bank details not configured',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 7. CHECK FOR EXISTING PAYOUT
    // =====================================================

    const { data: existingPayout } = await supabase
      .from('vendor_payouts')
      .select('*')
      .eq('payment_id', paymentId)
      .eq('status', 'COMPLETED')
      .single();

    if (existingPayout) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payout already completed for this payment',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 8. CREATE VENDOR PAYOUT VIA RAZORPAY
    // =====================================================

    const payoutAmount = payment.contracts.vendor_payout;

    const payoutResult = await createVendorPayout({
      vendorId: vendor.user_id,
      contractId: payment.contracts.id,
      payoutAmount,
      bankAccountNumber: vendor.bank_account_number,
      bankIfscCode: vendor.bank_ifsc_code,
      bankAccountName: vendor.bank_account_name,
    });

    if (!payoutResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: payoutResult.error || 'Failed to create payout',
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 9. CREATE VENDOR PAYOUT RECORD
    // =====================================================

    const { data: vendorPayout, error: vendorPayoutError } = await supabase
      .from('vendor_payouts')
      .insert({
        vendor_id: vendor.id,
        contract_id: payment.contracts.id,
        payment_id: payment.id,
        payout_amount: payoutAmount,
        razorpay_payout_id: payoutResult.payout.id,
        razorpay_fund_account_id: payoutResult.payout.fund_account_id,
        status: 'PROCESSING',
        initiated_at: new Date().toISOString(),
        bank_account_number: vendor.bank_account_number,
        bank_ifsc_code: vendor.bank_ifsc_code,
        bank_account_name: vendor.bank_account_name,
        payout_metadata: payoutResult.payout,
      })
      .select()
      .single();

    if (vendorPayoutError || !vendorPayout) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create payout record',
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 10. UPDATE PAYMENT STATUS
    // =====================================================

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'PAYOUT_PROCESSING',
        vendor_payout_amount: payoutAmount,
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
    }

    // =====================================================
    // 11. RETURN SUCCESS
    // =====================================================

    return NextResponse.json({
      success: true,
      data: {
        payoutId: vendorPayout.id,
        razorpayPayoutId: payoutResult.payout.id,
        vendorName: vendor.company_name,
        payoutAmount,
        status: 'PROCESSING',
        estimatedTime: '1-2 business days',
      },
    });
  } catch (error) {
    console.error('Error initiating vendor payout:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// =====================================================
// GET PAYOUT STATUS
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const vendorId = searchParams.get('vendorId');

    if (!paymentId && !vendorId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: paymentId or vendorId',
        },
        { status: 400 }
      );
    }

    let query = supabase.from('vendor_payouts').select('*');

    if (paymentId) {
      query = query.eq('payment_id', paymentId);
    } else if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }

    const { data: payouts, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch payout status',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: payouts,
    });
  } catch (error) {
    console.error('Error fetching payout status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
