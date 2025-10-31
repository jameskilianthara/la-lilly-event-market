/**
 * API Route: Create Payment Order
 * POST /api/payments/create
 *
 * Creates a Razorpay order for client payment after contract signing
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';
import { calculateCommission } from '@/lib/commission';
import { createRazorpayOrder, validateRazorpayConfig } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    // =====================================================
    // 1. VALIDATE RAZORPAY CONFIGURATION
    // =====================================================

    const configValidation = validateRazorpayConfig();
    if (!configValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Razorpay not configured',
          details: configValidation.errors,
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 2. PARSE REQUEST BODY
    // =====================================================

    const body = await request.json();
    const { contractId, userId } = body;

    if (!contractId || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: contractId and userId',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 3. FETCH CONTRACT DETAILS
    // =====================================================

    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(
        `
        *,
        events (
          id,
          title,
          owner_user_id,
          client_brief
        ),
        bids (
          id,
          total_forge_cost,
          vendor_id,
          vendors (
            id,
            company_name
          )
        )
      `
      )
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contract not found',
        },
        { status: 404 }
      );
    }

    // =====================================================
    // 4. VERIFY USER AUTHORIZATION
    // =====================================================

    if (contract.events.owner_user_id !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: You are not the event owner',
        },
        { status: 403 }
      );
    }

    // =====================================================
    // 5. CHECK CONTRACT STATUS
    // =====================================================

    if (contract.status !== 'SIGNED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Contract must be signed before payment',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 6. CHECK IF PAYMENT ALREADY EXISTS
    // =====================================================

    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('contract_id', contractId)
      .eq('status', 'COMPLETED')
      .single();

    if (existingPayment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment already completed for this contract',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 7. GET CLIENT DETAILS
    // =====================================================

    const { data: clientUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !clientUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client user not found',
        },
        { status: 404 }
      );
    }

    // =====================================================
    // 8. CALCULATE COMMISSION
    // =====================================================

    const projectValue = contract.bids.total_forge_cost;
    const commission = calculateCommission(projectValue);

    // =====================================================
    // 9. CREATE RAZORPAY ORDER
    // =====================================================

    const orderResult = await createRazorpayOrder({
      contractId: contract.id,
      projectValue,
      clientEmail: clientUser.email,
      clientPhone: clientUser.phone || '',
      commission,
    });

    if (!orderResult.success || !orderResult.order) {
      return NextResponse.json(
        {
          success: false,
          error: orderResult.error || 'Failed to create Razorpay order',
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 10. UPDATE CONTRACT WITH COMMISSION DETAILS
    // =====================================================

    const { error: contractUpdateError } = await supabase
      .from('contracts')
      .update({
        project_value: projectValue,
        commission_rate: commission.commissionRate,
        commission_amount: commission.commissionAmount,
        platform_fee: commission.platformFee,
        vendor_payout: commission.vendorPayout,
        commission_tier: commission.tier,
      })
      .eq('id', contractId);

    if (contractUpdateError) {
      console.error('Error updating contract commission:', contractUpdateError);
      // Continue anyway - we can update later
    }

    // =====================================================
    // 11. CREATE PAYMENT RECORD
    // =====================================================

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        contract_id: contractId,
        amount: projectValue,
        status: 'PENDING',
        payment_type: 'FULL_PAYMENT',
        razorpay_order_id: orderResult.order.id,
        commission_collected: 0, // Will be updated after payment success
        payment_metadata: {
          commission: commission,
          order_details: orderResult.order,
        },
      })
      .select()
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create payment record',
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 12. RETURN SUCCESS WITH ORDER DETAILS
    // =====================================================

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        razorpayOrderId: orderResult.order.id,
        razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: projectValue,
        currency: 'INR',
        commission: commission,
        contract: {
          id: contract.id,
          title: contract.events.title,
          vendorName: contract.bids.vendors.company_name,
        },
        clientDetails: {
          name: clientUser.full_name,
          email: clientUser.email,
          phone: clientUser.phone,
        },
      },
    });
  } catch (error) {
    console.error('Error in payment creation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
