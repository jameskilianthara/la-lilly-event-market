// EventFoundry Commission Calculation System
// Tiered commission structure based on project value

export interface CommissionBreakdown {
  projectValue: number;
  commissionRate: number;
  commissionAmount: number;
  platformFee: number;
  totalDeduction: number;
  vendorPayout: number;
  tier: 'standard' | 'premium' | 'luxury';
}

export interface CommissionTier {
  name: string;
  min: number;
  max: number | null;
  rate: number;
  description: string;
}

// Commission tier configuration
export const COMMISSION_TIERS: CommissionTier[] = [
  {
    name: 'Standard Events',
    min: 0,
    max: 500000, // ₹5L
    rate: 12.00,
    description: '₹50K - ₹5L: 12% commission'
  },
  {
    name: 'Premium Events',
    min: 500001,
    max: 2000000, // ₹20L
    rate: 10.00,
    description: '₹5L - ₹20L: 10% commission'
  },
  {
    name: 'Luxury Events',
    min: 2000001,
    max: null,
    rate: 8.00,
    description: '₹20L+: 8% commission'
  }
];

export const PLATFORM_FEE = 500.00; // Fixed ₹500 per event

/**
 * Calculate commission breakdown for a project
 * @param projectValue Total project value in rupees
 * @returns Detailed commission breakdown
 */
export function calculateCommission(projectValue: number): CommissionBreakdown {
  if (projectValue < 0) {
    throw new Error('Project value cannot be negative');
  }

  if (projectValue === 0) {
    return {
      projectValue: 0,
      commissionRate: 0,
      commissionAmount: 0,
      platformFee: 0,
      totalDeduction: 0,
      vendorPayout: 0,
      tier: 'standard'
    };
  }

  // Determine commission rate based on project value
  let rate: number;
  let tier: 'standard' | 'premium' | 'luxury';

  if (projectValue <= 500000) {
    rate = 12.00;
    tier = 'standard';
  } else if (projectValue <= 2000000) {
    rate = 10.00;
    tier = 'premium';
  } else {
    rate = 8.00;
    tier = 'luxury';
  }

  // Calculate commission
  const commissionAmount = (projectValue * rate) / 100;
  const totalDeduction = commissionAmount + PLATFORM_FEE;
  const vendorPayout = projectValue - totalDeduction;

  return {
    projectValue,
    commissionRate: rate,
    commissionAmount: Math.round(commissionAmount * 100) / 100, // Round to 2 decimals
    platformFee: PLATFORM_FEE,
    totalDeduction: Math.round(totalDeduction * 100) / 100,
    vendorPayout: Math.round(vendorPayout * 100) / 100,
    tier
  };
}

/**
 * Get commission tier info for a project value
 */
export function getCommissionTier(projectValue: number): CommissionTier {
  for (const tier of COMMISSION_TIERS) {
    if (projectValue >= tier.min && (tier.max === null || projectValue <= tier.max)) {
      return tier;
    }
  }
  return COMMISSION_TIERS[0]; // Default to standard
}

/**
 * Format currency in Indian format
 */
export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Calculate milestone payment breakdown
 * Common milestone structure: 30% deposit, 50% on start, 20% on completion
 */
export interface MilestonePayment {
  milestone: string;
  percentage: number;
  amount: number;
  commissionAmount: number;
  vendorReceives: number;
}

export function calculateMilestonePayments(
  projectValue: number,
  milestones: { name: string; percentage: number }[]
): MilestonePayment[] {
  const commission = calculateCommission(projectValue);
  const commissionPercentage = (commission.totalDeduction / projectValue) * 100;

  return milestones.map(milestone => {
    const amount = (projectValue * milestone.percentage) / 100;
    const commissionAmount = (amount * commissionPercentage) / 100;
    const vendorReceives = amount - commissionAmount;

    return {
      milestone: milestone.name,
      percentage: milestone.percentage,
      amount: Math.round(amount * 100) / 100,
      commissionAmount: Math.round(commissionAmount * 100) / 100,
      vendorReceives: Math.round(vendorReceives * 100) / 100
    };
  });
}

/**
 * Validate project value is within reasonable bounds
 */
export function validateProjectValue(projectValue: number): {
  valid: boolean;
  error?: string;
} {
  if (projectValue < 0) {
    return { valid: false, error: 'Project value cannot be negative' };
  }

  if (projectValue < 50000) {
    return {
      valid: false,
      error: 'Minimum project value is ₹50,000'
    };
  }

  if (projectValue > 100000000) {
    // ₹10 crore max
    return {
      valid: false,
      error: 'Project value exceeds maximum limit of ₹10 crore'
    };
  }

  return { valid: true };
}

/**
 * Calculate commission savings compared to industry standard (15%)
 */
export function calculateSavings(projectValue: number): {
  eventFoundryCommission: number;
  industryStandardCommission: number;
  savings: number;
  savingsPercentage: number;
} {
  const eventFoundryRate = calculateCommission(projectValue).commissionRate;
  const industryStandardRate = 15.0;

  const eventFoundryCommission = (projectValue * eventFoundryRate) / 100;
  const industryStandardCommission = (projectValue * industryStandardRate) / 100;
  const savings = industryStandardCommission - eventFoundryCommission;
  const savingsPercentage = ((savings / industryStandardCommission) * 100);

  return {
    eventFoundryCommission,
    industryStandardCommission,
    savings,
    savingsPercentage: Math.round(savingsPercentage * 10) / 10
  };
}

/**
 * Generate commission breakdown text for display
 */
export function generateCommissionSummary(projectValue: number): string {
  const breakdown = calculateCommission(projectValue);
  const tier = getCommissionTier(projectValue);

  return `
Project Value: ${formatIndianCurrency(projectValue)}
Tier: ${tier.name} (${breakdown.commissionRate}%)
Commission: ${formatIndianCurrency(breakdown.commissionAmount)}
Platform Fee: ${formatIndianCurrency(breakdown.platformFee)}
Total Deduction: ${formatIndianCurrency(breakdown.totalDeduction)}
Vendor Payout: ${formatIndianCurrency(breakdown.vendorPayout)}
  `.trim();
}

/**
 * Calculate refund amounts (commission non-refundable)
 */
export function calculateRefund(
  projectValue: number,
  refundPercentage: number
): {
  originalPayment: number;
  refundAmount: number;
  commissionRetained: number;
  platformFeeRetained: number;
} {
  const breakdown = calculateCommission(projectValue);
  const refundAmount = (projectValue * refundPercentage) / 100;
  const commissionRetained = breakdown.commissionAmount;
  const platformFeeRetained = breakdown.platformFee;

  return {
    originalPayment: projectValue,
    refundAmount: Math.round(refundAmount * 100) / 100,
    commissionRetained,
    platformFeeRetained
  };
}
