-- Migration: Add Payment Tracking and Commission Fields
-- Created: 2025-01-31
-- Purpose: Enable commission collection and payment processing with Razorpay integration

-- =====================================================
-- PART 1: Add Commission Fields to Contracts Table
-- =====================================================

ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS project_value DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(8,2) DEFAULT 500.00,
ADD COLUMN IF NOT EXISTS vendor_payout DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS commission_tier VARCHAR(20); -- 'standard' | 'premium' | 'luxury'

COMMENT ON COLUMN public.contracts.project_value IS 'Total project value (winning bid amount)';
COMMENT ON COLUMN public.contracts.commission_rate IS 'Commission percentage (8.00, 10.00, or 12.00)';
COMMENT ON COLUMN public.contracts.commission_amount IS 'Calculated commission amount';
COMMENT ON COLUMN public.contracts.platform_fee IS 'Fixed platform fee per event (default ₹500)';
COMMENT ON COLUMN public.contracts.vendor_payout IS 'Amount vendor receives after commission deduction';
COMMENT ON COLUMN public.contracts.commission_tier IS 'Commission tier: standard/premium/luxury';

-- =====================================================
-- PART 2: Add Payment Tracking Fields to Payments Table
-- =====================================================

ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(512),
ADD COLUMN IF NOT EXISTS commission_collected DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS vendor_payout_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS vendor_payout_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
ADD COLUMN IF NOT EXISTS client_paid_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS vendor_paid_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS payout_scheduled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS payment_metadata JSONB;

COMMENT ON COLUMN public.payments.razorpay_payment_id IS 'Razorpay payment ID (unique identifier)';
COMMENT ON COLUMN public.payments.razorpay_order_id IS 'Razorpay order ID for this payment';
COMMENT ON COLUMN public.payments.razorpay_signature IS 'Razorpay signature for webhook verification';
COMMENT ON COLUMN public.payments.commission_collected IS 'Commission amount collected from this payment';
COMMENT ON COLUMN public.payments.vendor_payout_id IS 'Razorpay payout ID when vendor is paid';
COMMENT ON COLUMN public.payments.vendor_payout_amount IS 'Amount paid out to vendor';
COMMENT ON COLUMN public.payments.payment_method IS 'Payment method used (card/upi/netbanking/wallet)';
COMMENT ON COLUMN public.payments.client_paid_at IS 'Timestamp when client completed payment';
COMMENT ON COLUMN public.payments.vendor_paid_at IS 'Timestamp when vendor received payout';
COMMENT ON COLUMN public.payments.payout_scheduled_at IS 'Timestamp when payout was scheduled';
COMMENT ON COLUMN public.payments.payment_metadata IS 'Additional payment metadata from Razorpay';

-- =====================================================
-- PART 3: Create Payment Status Enum (if not exists)
-- =====================================================

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'PENDING',
        'PROCESSING',
        'COMPLETED',
        'FAILED',
        'REFUNDED',
        'PARTIALLY_REFUNDED',
        'PAYOUT_PENDING',
        'PAYOUT_PROCESSING',
        'PAYOUT_COMPLETED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update payments table to use enum if status column exists
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payments' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.payments ALTER COLUMN status TYPE VARCHAR(50);
    ELSE
        ALTER TABLE public.payments ADD COLUMN status VARCHAR(50) DEFAULT 'PENDING';
    END IF;
END $$;

-- =====================================================
-- PART 4: Create Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id
ON public.payments(razorpay_payment_id);

CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id
ON public.payments(razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_payments_contract_id
ON public.payments(contract_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
ON public.payments(status);

CREATE INDEX IF NOT EXISTS idx_payments_client_paid_at
ON public.payments(client_paid_at);

CREATE INDEX IF NOT EXISTS idx_payments_vendor_paid_at
ON public.payments(vendor_paid_at);

-- =====================================================
-- PART 5: Create Vendor Payouts Tracking Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.vendor_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,

    -- Payout details
    payout_amount DECIMAL(12,2) NOT NULL,
    razorpay_payout_id VARCHAR(255) UNIQUE,
    razorpay_fund_account_id VARCHAR(255),

    -- Status tracking
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING | PROCESSING | COMPLETED | FAILED | CANCELLED
    initiated_at TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT,

    -- Bank details (stored at payout time for audit)
    bank_account_number VARCHAR(50),
    bank_ifsc_code VARCHAR(20),
    bank_account_name VARCHAR(255),

    -- Metadata
    payout_metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT vendor_payouts_payout_amount_positive CHECK (payout_amount > 0)
);

COMMENT ON TABLE public.vendor_payouts IS 'Tracks vendor payouts after commission deduction';

CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_id
ON public.vendor_payouts(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_payouts_contract_id
ON public.vendor_payouts(contract_id);

CREATE INDEX IF NOT EXISTS idx_vendor_payouts_status
ON public.vendor_payouts(status);

CREATE INDEX IF NOT EXISTS idx_vendor_payouts_razorpay_payout_id
ON public.vendor_payouts(razorpay_payout_id);

-- =====================================================
-- PART 6: Create Commission Revenue Tracking Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.commission_revenue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,

    -- Commission details
    project_value DECIMAL(12,2) NOT NULL,
    commission_rate DECIMAL(4,2) NOT NULL,
    commission_amount DECIMAL(12,2) NOT NULL,
    platform_fee DECIMAL(8,2) NOT NULL DEFAULT 500.00,
    total_revenue DECIMAL(12,2) NOT NULL, -- commission_amount + platform_fee
    commission_tier VARCHAR(20) NOT NULL, -- 'standard' | 'premium' | 'luxury'

    -- Timestamps
    collected_at TIMESTAMP,
    reconciled_at TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT commission_revenue_amounts_positive CHECK (
        project_value > 0 AND
        commission_amount >= 0 AND
        platform_fee >= 0 AND
        total_revenue >= 0
    ),
    CONSTRAINT commission_revenue_tier_valid CHECK (
        commission_tier IN ('standard', 'premium', 'luxury')
    )
);

COMMENT ON TABLE public.commission_revenue IS 'Tracks platform commission revenue for financial reporting';

CREATE INDEX IF NOT EXISTS idx_commission_revenue_contract_id
ON public.commission_revenue(contract_id);

CREATE INDEX IF NOT EXISTS idx_commission_revenue_collected_at
ON public.commission_revenue(collected_at);

CREATE INDEX IF NOT EXISTS idx_commission_revenue_tier
ON public.commission_revenue(commission_tier);

-- =====================================================
-- PART 7: Update Triggers for Timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to vendor_payouts
DROP TRIGGER IF EXISTS update_vendor_payouts_updated_at ON public.vendor_payouts;
CREATE TRIGGER update_vendor_payouts_updated_at
    BEFORE UPDATE ON public.vendor_payouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to commission_revenue
DROP TRIGGER IF EXISTS update_commission_revenue_updated_at ON public.commission_revenue;
CREATE TRIGGER update_commission_revenue_updated_at
    BEFORE UPDATE ON public.commission_revenue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 8: Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_revenue ENABLE ROW LEVEL SECURITY;

-- Vendor payouts: Vendors can only view their own payouts
CREATE POLICY vendor_payouts_select_own ON public.vendor_payouts
    FOR SELECT
    USING (
        vendor_id IN (
            SELECT id FROM public.vendors
            WHERE user_id = auth.uid()
        )
    );

-- Vendor payouts: Only admins can insert/update
CREATE POLICY vendor_payouts_admin_all ON public.vendor_payouts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Commission revenue: Only admins can access
CREATE POLICY commission_revenue_admin_only ON public.commission_revenue
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- =====================================================
-- PART 9: Sample Data Functions (for testing)
-- =====================================================

-- Function to calculate and store commission for a contract
CREATE OR REPLACE FUNCTION calculate_contract_commission(
    p_contract_id UUID,
    p_project_value DECIMAL
) RETURNS VOID AS $$
DECLARE
    v_rate DECIMAL(4,2);
    v_tier VARCHAR(20);
    v_commission DECIMAL(12,2);
    v_platform_fee DECIMAL(8,2) := 500.00;
    v_payout DECIMAL(12,2);
BEGIN
    -- Determine tier and rate
    IF p_project_value <= 500000 THEN
        v_rate := 12.00;
        v_tier := 'standard';
    ELSIF p_project_value <= 2000000 THEN
        v_rate := 10.00;
        v_tier := 'premium';
    ELSE
        v_rate := 8.00;
        v_tier := 'luxury';
    END IF;

    -- Calculate amounts
    v_commission := ROUND((p_project_value * v_rate / 100)::NUMERIC, 2);
    v_payout := p_project_value - v_commission - v_platform_fee;

    -- Update contract
    UPDATE public.contracts
    SET
        project_value = p_project_value,
        commission_rate = v_rate,
        commission_amount = v_commission,
        platform_fee = v_platform_fee,
        vendor_payout = v_payout,
        commission_tier = v_tier
    WHERE id = p_contract_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_contract_commission IS 'Calculates and updates commission fields for a contract based on project value';

-- =====================================================
-- MIGRATION VERIFICATION QUERIES
-- =====================================================

-- Verify contracts table columns
DO $$
BEGIN
    RAISE NOTICE 'Verifying contracts table columns...';
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contracts'
        AND column_name = 'commission_amount'
    ) THEN
        RAISE NOTICE '✓ Commission fields added to contracts table';
    ELSE
        RAISE WARNING '✗ Commission fields missing from contracts table';
    END IF;
END $$;

-- Verify payments table columns
DO $$
BEGIN
    RAISE NOTICE 'Verifying payments table columns...';
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payments'
        AND column_name = 'razorpay_payment_id'
    ) THEN
        RAISE NOTICE '✓ Razorpay fields added to payments table';
    ELSE
        RAISE WARNING '✗ Razorpay fields missing from payments table';
    END IF;
END $$;

-- Verify new tables created
DO $$
BEGIN
    RAISE NOTICE 'Verifying new tables...';
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'vendor_payouts'
    ) THEN
        RAISE NOTICE '✓ vendor_payouts table created';
    ELSE
        RAISE WARNING '✗ vendor_payouts table missing';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'commission_revenue'
    ) THEN
        RAISE NOTICE '✓ commission_revenue table created';
    ELSE
        RAISE WARNING '✗ commission_revenue table missing';
    END IF;
END $$;
