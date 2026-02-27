/**
 * API Route: Create Payment Order
 * POST /api/payments/create
 *
 * Creates a Razorpay order for client payment after contract signing
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { calculateCommission } from '@/lib/commission';
import { createRazorpayOrder, validateRazorpayConfig } from '@/lib/razorpay';
import { withErrorHandler, validateRequired } from '@/lib/api-handler';
import { ValidationError, PaymentError, DatabaseError, AuthenticationError } from '@/lib/errors';

export const POST = withErrorHandler(async (request: NextRequest) => {
  // =====================================================
  // 1. VALIDATE RAZORPAY CONFIGURATION
  // =====================================================

  const configValidation = validateRazorpayConfig();
  if (!configValidation.valid) {
    throw new PaymentError(`Razorpay not configured: ${configValidation.errors.join(', ')}`);
  }

  // =====================================================
  // 2. PARSE REQUEST BODY
  // =====================================================

  // =====================================================
  // 2. VERIFY JWT
  // =====================================================

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or invalid Authorization header');
  }
  const token = authHeader.slice(7);
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user: jwtUser }, error: jwtError } = await authClient.auth.getUser(token);
  if (jwtError || !jwtUser) {
    throw new AuthenticationError('Invalid or expired token');
  }
  const userId = jwtUser.id;

  // =====================================================
  // 3. PARSE REQUEST BODY
  // =====================================================

  const body = await request.json();
  const { contractId } = body;

  validateRequired(body, ['contractId']);

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
    throw new ValidationError('Contract not found');
  }

  // =====================================================
  // 4. VERIFY USER AUTHORIZATION
  // =====================================================

  if (contract.events.owner_user_id !== userId) {
    throw new AuthenticationError('Unauthorized: You are not the event owner');
  }

  // =====================================================
  // 5. CHECK CONTRACT STATUS
  // =====================================================

  if (contract.status !== 'SIGNED') {
    throw new ValidationError('Contract must be signed before payment');
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
    throw new ValidationError('Payment already completed for this contract');
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
    throw new ValidationError('Client user not found');
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
    throw new PaymentError(orderResult.error || 'Failed to create Razorpay order');
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
    throw new DatabaseError('Failed to create payment record');
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
});
