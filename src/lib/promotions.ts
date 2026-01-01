/**
 * Promotional Code System for EventFoundry
 *
 * Handles promo code validation, discount calculation, and usage tracking
 * for customer acquisition and retention campaigns.
 */

import { supabase } from '../../lib/supabase';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export type DiscountType = 'percentage' | 'fixed_amount';
export type ApplicableTo = 'commission' | 'platform_fee' | 'both';
export type UserType = 'client' | 'vendor' | 'both';
export type PaymentMethod = 'online' | 'cash' | 'both';

export interface PromoCode {
  id: string;
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount?: number;
  min_order_value?: number;
  usage_limit?: number;
  usage_count: number;
  user_usage_limit: number;
  valid_from: string;
  valid_until?: string;
  applicable_to: ApplicableTo;
  user_type: UserType;
  payment_method: PaymentMethod;
  event_types?: string[];
  is_active: boolean;
  created_at: string;
}

export interface PromoValidationResult {
  isValid: boolean;
  errorMessage?: string;
  discountAmount?: number;
  promoCodeId?: string;
  promoCode?: PromoCode;
}

export interface CommissionWithPromo {
  projectValue: number;
  paymentMethod: 'online' | 'cash';

  // Base commission
  baseCommissionRate: number;
  baseCommission: number;
  tier: 'standard' | 'premium' | 'luxury';

  // Promo discount
  promoCode?: string;
  promoDiscount: number;

  // Final amounts
  finalCommission: number;
  platformFee: number;
  gstAmount: number;
  totalCommission: number;
  vendorPayout: number;

  // Commission invoice details (for cash payments)
  commissionInvoiceTotal?: number;
}

// =====================================================
// COMMISSION RATES
// =====================================================

export const COMMISSION_RATES = {
  online: {
    standard: 12.00,  // ≤₹5L
    premium: 10.00,   // ₹5L - ₹20L
    luxury: 8.00,     // >₹20L
  },
  cash: {
    standard: 8.00,   // ≤₹5L (33% lower)
    premium: 6.00,    // ₹5L - ₹20L (40% lower)
    luxury: 5.00,     // >₹20L (37.5% lower)
  },
};

export const PLATFORM_FEES = {
  online: 500,
  cash: {
    small: 1000,  // ≤₹1L
    large: 2000,  // >₹1L
  },
};

export const TIER_THRESHOLDS = {
  standard: { min: 0, max: 500000 },
  premium: { min: 500001, max: 2000000 },
  luxury: { min: 2000001, max: Infinity },
};

export const MINIMUM_COMMISSION = 1000; // ₹1,000 minimum commission after all discounts
export const GST_RATE = 0.18; // 18% GST on commission

// =====================================================
// PROMO CODE VALIDATION
// =====================================================

/**
 * Validates a promo code for a given user and project
 */
export async function validatePromoCode(
  code: string,
  userId: string,
  projectValue: number,
  paymentMethod: 'online' | 'cash' = 'online',
  eventType?: string
): Promise<PromoValidationResult> {
  try {
    // Fetch promo code
    const { data: promoCode, error: fetchError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (fetchError || !promoCode) {
      return {
        isValid: false,
        errorMessage: 'Invalid or inactive promo code',
      };
    }

    // Check validity period
    const now = new Date();
    const validFrom = new Date(promoCode.valid_from);
    const validUntil = promoCode.valid_until ? new Date(promoCode.valid_until) : null;

    if (now < validFrom) {
      return {
        isValid: false,
        errorMessage: `Promo code will be active from ${validFrom.toLocaleDateString()}`,
      };
    }

    if (validUntil && now > validUntil) {
      return {
        isValid: false,
        errorMessage: 'Promo code has expired',
      };
    }

    // Check total usage limit
    if (promoCode.usage_limit !== null && promoCode.usage_count >= promoCode.usage_limit) {
      return {
        isValid: false,
        errorMessage: 'Promo code usage limit has been reached',
      };
    }

    // Check user usage limit
    const { data: userUsage, error: usageError } = await supabase
      .from('promo_usage')
      .select('id')
      .eq('promo_code_id', promoCode.id)
      .eq('user_id', userId);

    if (usageError) {
      console.error('Error checking promo usage:', usageError);
      return {
        isValid: false,
        errorMessage: 'Error validating promo code',
      };
    }

    const userUsageCount = userUsage?.length || 0;
    if (userUsageCount >= promoCode.user_usage_limit) {
      return {
        isValid: false,
        errorMessage: 'You have already used this promo code',
      };
    }

    // Check minimum order value
    if (promoCode.min_order_value && projectValue < promoCode.min_order_value) {
      return {
        isValid: false,
        errorMessage: `Minimum order value of ${formatIndianCurrency(promoCode.min_order_value)} required`,
      };
    }

    // Check payment method compatibility
    if (promoCode.payment_method !== 'both' && promoCode.payment_method !== paymentMethod) {
      return {
        isValid: false,
        errorMessage: `Promo code only valid for ${promoCode.payment_method} payments`,
      };
    }

    // Check event type compatibility
    if (promoCode.event_types && promoCode.event_types.length > 0 && eventType) {
      if (!promoCode.event_types.includes(eventType)) {
        return {
          isValid: false,
          errorMessage: 'Promo code not valid for this event type',
        };
      }
    }

    // Calculate discount amount
    const baseCommission = calculateBaseCommission(projectValue, paymentMethod).baseCommission;
    let discountAmount = 0;

    if (promoCode.applicable_to === 'commission' || promoCode.applicable_to === 'both') {
      if (promoCode.discount_type === 'percentage') {
        discountAmount = (baseCommission * promoCode.discount_value) / 100;
        if (promoCode.max_discount) {
          discountAmount = Math.min(discountAmount, promoCode.max_discount);
        }
      } else {
        // Fixed amount
        discountAmount = promoCode.discount_value;
      }
    }

    // Ensure final commission doesn't go below minimum
    const finalCommission = Math.max(MINIMUM_COMMISSION, baseCommission - discountAmount);
    discountAmount = baseCommission - finalCommission;

    return {
      isValid: true,
      discountAmount,
      promoCodeId: promoCode.id,
      promoCode: promoCode as PromoCode,
    };
  } catch (error) {
    console.error('Error validating promo code:', error);
    return {
      isValid: false,
      errorMessage: 'Error validating promo code',
    };
  }
}

// =====================================================
// COMMISSION CALCULATION
// =====================================================

/**
 * Determines commission tier based on project value
 */
export function determineCommissionTier(projectValue: number): 'standard' | 'premium' | 'luxury' {
  if (projectValue <= TIER_THRESHOLDS.standard.max) {
    return 'standard';
  } else if (projectValue <= TIER_THRESHOLDS.premium.max) {
    return 'premium';
  } else {
    return 'luxury';
  }
}

/**
 * Calculates base commission without promo code
 */
export function calculateBaseCommission(
  projectValue: number,
  paymentMethod: 'online' | 'cash'
): { baseCommission: number; baseCommissionRate: number; tier: 'standard' | 'premium' | 'luxury' } {
  const tier = determineCommissionTier(projectValue);
  const baseCommissionRate = COMMISSION_RATES[paymentMethod][tier];
  const baseCommission = (projectValue * baseCommissionRate) / 100;

  return {
    baseCommission,
    baseCommissionRate,
    tier,
  };
}

/**
 * Calculates platform fee based on payment method and project value
 */
export function calculatePlatformFee(projectValue: number, paymentMethod: 'online' | 'cash'): number {
  if (paymentMethod === 'online') {
    return PLATFORM_FEES.online;
  } else {
    return projectValue <= 100000 ? PLATFORM_FEES.cash.small : PLATFORM_FEES.cash.large;
  }
}

/**
 * Calculates commission with promo code discount
 */
export async function calculateCommissionWithPromo(
  projectValue: number,
  paymentMethod: 'online' | 'cash',
  promoCode?: string,
  userId?: string,
  eventType?: string
): Promise<CommissionWithPromo> {
  // Calculate base commission
  const { baseCommission, baseCommissionRate, tier } = calculateBaseCommission(projectValue, paymentMethod);

  // Calculate platform fee
  const platformFee = calculatePlatformFee(projectValue, paymentMethod);

  // Default result (no promo)
  let promoDiscount = 0;
  let appliedPromoCode: string | undefined = undefined;

  // Validate and apply promo code if provided
  if (promoCode && userId) {
    const validation = await validatePromoCode(promoCode, userId, projectValue, paymentMethod, eventType);

    if (validation.isValid && validation.discountAmount) {
      promoDiscount = validation.discountAmount;
      appliedPromoCode = promoCode.toUpperCase();
    }
  }

  // Calculate final commission (ensuring minimum)
  const finalCommission = Math.max(MINIMUM_COMMISSION, baseCommission - promoDiscount);

  // Recalculate actual discount if minimum was applied
  const actualDiscount = baseCommission - finalCommission;

  // Calculate GST (18% on final commission)
  const gstAmount = finalCommission * GST_RATE;

  // Total commission invoice amount (for cash payments)
  const commissionInvoiceTotal = finalCommission + gstAmount + platformFee;

  // Vendor payout (what vendor receives from client, minus what they owe platform)
  const vendorPayout = projectValue - commissionInvoiceTotal;

  return {
    projectValue,
    paymentMethod,
    baseCommissionRate,
    baseCommission,
    tier,
    promoCode: appliedPromoCode,
    promoDiscount: actualDiscount,
    finalCommission,
    platformFee,
    gstAmount,
    totalCommission: commissionInvoiceTotal,
    vendorPayout,
    commissionInvoiceTotal: paymentMethod === 'cash' ? commissionInvoiceTotal : undefined,
  };
}

// =====================================================
// PROMO USAGE TRACKING
// =====================================================

/**
 * Records promo code usage after contract creation
 */
export async function recordPromoUsage(
  promoCodeId: string,
  userId: string,
  contractId: string,
  projectValue: number,
  discountApplied: number,
  originalCommission: number,
  finalCommission: number,
  paymentMethod: 'online' | 'cash',
  eventType?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Insert usage record
    const { error: insertError } = await supabase.from('promo_usage').insert({
      promo_code_id: promoCodeId,
      user_id: userId,
      contract_id: contractId,
      project_value: projectValue,
      discount_applied: discountApplied,
      original_commission: originalCommission,
      final_commission: finalCommission,
      payment_method: paymentMethod,
      event_type: eventType,
    });

    if (insertError) {
      console.error('Error recording promo usage:', insertError);
      return { success: false, error: insertError.message };
    }

    // Increment usage count
    const { error: updateError } = await supabase.rpc('increment', {
      table_name: 'promo_codes',
      row_id: promoCodeId,
      column_name: 'usage_count',
    });

    // If RPC not available, use update query
    if (updateError) {
      // Increment usage count - fetch current value first
      const { data: currentCode } = await supabase
        .from('promo_codes')
        .select('usage_count')
        .eq('id', promoCodeId)
        .single();
      
      if (currentCode) {
        await supabase
          .from('promo_codes')
          .update({ usage_count: (currentCode.usage_count || 0) + 1 })
          .eq('id', promoCodeId);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error recording promo usage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =====================================================
// PROMO CODE MANAGEMENT (Admin)
// =====================================================

/**
 * Creates a new promo code (admin only)
 */
export async function createPromoCode(
  promoData: Partial<PromoCode>,
  createdBy: string
): Promise<{ success: boolean; data?: PromoCode; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .insert({
        ...promoData,
        code: promoData.code?.toUpperCase(),
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PromoCode };
  } catch (error) {
    console.error('Error creating promo code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Deactivates a promo code (admin only)
 */
export async function deactivatePromoCode(
  promoCodeId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('promo_codes')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivation_reason: reason,
      })
      .eq('id', promoCodeId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deactivating promo code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gets all promo codes (admin only)
 */
export async function getAllPromoCodes(): Promise<{ success: boolean; data?: PromoCode[]; error?: string }> {
  try {
    const { data, error } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PromoCode[] };
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gets promo usage analytics
 */
export async function getPromoAnalytics(promoCodeId?: string) {
  try {
    let query = supabase.from('promo_usage').select('*');

    if (promoCodeId) {
      query = query.eq('promo_code_id', promoCodeId);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    // Calculate analytics
    const totalUsage = data?.length || 0;
    const totalDiscountGiven = data?.reduce((sum, usage) => sum + (usage.discount_applied || 0), 0) || 0;
    const totalProjectValue = data?.reduce((sum, usage) => sum + (usage.project_value || 0), 0) || 0;
    const averageDiscount = totalUsage > 0 ? totalDiscountGiven / totalUsage : 0;

    return {
      success: true,
      analytics: {
        totalUsage,
        totalDiscountGiven,
        totalProjectValue,
        averageDiscount,
        usageByPaymentMethod: {
          online: data?.filter(u => u.payment_method === 'online').length || 0,
          cash: data?.filter(u => u.payment_method === 'cash').length || 0,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching promo analytics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Formats currency in Indian format
 */
export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculates savings from using a promo code
 */
export function calculateSavings(baseCommission: number, finalCommission: number): {
  savings: number;
  savingsPercentage: number;
} {
  const savings = baseCommission - finalCommission;
  const savingsPercentage = (savings / baseCommission) * 100;

  return {
    savings,
    savingsPercentage,
  };
}

/**
 * Gets user's available promo codes
 */
export async function getUserAvailablePromoCodes(
  userId: string,
  projectValue: number,
  paymentMethod: 'online' | 'cash',
  eventType?: string
): Promise<{ success: boolean; data?: PromoCode[]; error?: string }> {
  try {
    const now = new Date().toISOString();

    // Fetch active promo codes
    const { data: promoCodes, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('is_active', true)
      .lte('valid_from', now)
      .or(`valid_until.is.null,valid_until.gte.${now}`);

    if (error) {
      return { success: false, error: error.message };
    }

    // Filter applicable codes
    const applicableCodes: PromoCode[] = [];

    for (const code of promoCodes || []) {
      // Check minimum order value
      if (code.min_order_value && projectValue < code.min_order_value) {
        continue;
      }

      // Check payment method
      if (code.payment_method !== 'both' && code.payment_method !== paymentMethod) {
        continue;
      }

      // Check event type
      if (code.event_types && code.event_types.length > 0 && eventType) {
        if (!code.event_types.includes(eventType)) {
          continue;
        }
      }

      // Check user usage limit
      const { data: usage } = await supabase
        .from('promo_usage')
        .select('id')
        .eq('promo_code_id', code.id)
        .eq('user_id', userId);

      const userUsageCount = usage?.length || 0;
      if (userUsageCount >= code.user_usage_limit) {
        continue;
      }

      // Check total usage limit
      if (code.usage_limit !== null && code.usage_count >= code.usage_limit) {
        continue;
      }

      applicableCodes.push(code as PromoCode);
    }

    return { success: true, data: applicableCodes };
  } catch (error) {
    console.error('Error fetching available promo codes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
