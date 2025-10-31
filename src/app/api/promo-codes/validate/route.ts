/**
 * API Route: Validate Promo Code
 * POST /api/promo-codes/validate
 *
 * Validates a promo code for a given project and returns discount details
 */

import { NextRequest, NextResponse } from 'next/server';
import { validatePromoCode, calculateCommissionWithPromo } from '@/lib/promotions';

export async function POST(request: NextRequest) {
  try {
    // =====================================================
    // 1. PARSE REQUEST BODY
    // =====================================================

    const body = await request.json();
    const { promoCode, userId, projectValue, paymentMethod, eventType } = body;

    if (!promoCode || !userId || !projectValue) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: promoCode, userId, projectValue',
        },
        { status: 400 }
      );
    }

    // Validate project value
    if (projectValue <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid project value',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 2. VALIDATE PROMO CODE
    // =====================================================

    const validation = await validatePromoCode(
      promoCode,
      userId,
      projectValue,
      paymentMethod || 'online',
      eventType
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.errorMessage || 'Invalid promo code',
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 3. CALCULATE COMMISSION WITH PROMO
    // =====================================================

    const commission = await calculateCommissionWithPromo(
      projectValue,
      paymentMethod || 'online',
      promoCode,
      userId,
      eventType
    );

    // =====================================================
    // 4. RETURN DISCOUNT DETAILS
    // =====================================================

    return NextResponse.json({
      success: true,
      data: {
        promoCode: validation.promoCode,
        discount: {
          amount: commission.promoDiscount,
          originalCommission: commission.baseCommission,
          finalCommission: commission.finalCommission,
          savings: commission.promoDiscount,
          savingsPercentage:
            commission.baseCommission > 0
              ? ((commission.promoDiscount / commission.baseCommission) * 100).toFixed(1)
              : 0,
        },
        commission: {
          projectValue: commission.projectValue,
          paymentMethod: commission.paymentMethod,
          tier: commission.tier,
          baseCommissionRate: commission.baseCommissionRate,
          baseCommission: commission.baseCommission,
          promoDiscount: commission.promoDiscount,
          finalCommission: commission.finalCommission,
          platformFee: commission.platformFee,
          gstAmount: commission.gstAmount,
          totalCommission: commission.totalCommission,
          vendorPayout: commission.vendorPayout,
        },
        message: `Promo code applied! You save ₹${commission.promoDiscount.toLocaleString('en-IN')} on commission`,
      },
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
