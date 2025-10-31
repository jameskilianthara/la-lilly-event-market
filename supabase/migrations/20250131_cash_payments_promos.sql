-- Migration: Cash Payments + Promotional System with Hybrid Commission Model
-- Created: 2025-01-31
-- Purpose: Enable cash payment option with reduced commissions + promo code system

-- =====================================================
-- PART 1: Add Cash Payment Fields to Contracts
-- =====================================================

ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'online' CHECK (payment_method IN ('online', 'cash')),
ADD COLUMN IF NOT EXISTS cash_payment_confirmed_by_client BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cash_payment_confirmed_by_vendor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cash_payment_confirmed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS commission_invoice_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS commission_paid_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS commission_payment_method VARCHAR(50);

COMMENT ON COLUMN public.contracts.payment_method IS 'Payment method: online (Razorpay) or cash';
COMMENT ON COLUMN public.contracts.cash_payment_confirmed_by_client IS 'Client confirms cash payment made to vendor';
COMMENT ON COLUMN public.contracts.cash_payment_confirmed_by_vendor IS 'Vendor confirms cash payment received from client';
COMMENT ON COLUMN public.contracts.commission_invoice_sent_at IS 'When commission invoice sent to vendor';
COMMENT ON COLUMN public.contracts.commission_paid_at IS 'When vendor paid commission to platform';

-- =====================================================
-- PART 2: Add Promotional Fields to Contracts
-- =====================================================

ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS promo_code_used VARCHAR(50),
ADD COLUMN IF NOT EXISTS promo_discount_applied DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_commission_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN public.contracts.promo_code_used IS 'Promo code applied to this contract';
COMMENT ON COLUMN public.contracts.promo_discount_applied IS 'Discount amount from promo code';
COMMENT ON COLUMN public.contracts.final_commission_amount IS 'Final commission after promo discount';
COMMENT ON COLUMN public.contracts.gst_amount IS 'GST on commission (18%)';

-- =====================================================
-- PART 3: Create Promo Codes Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Code details
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    internal_notes TEXT, -- For admin tracking

    -- Discount configuration
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL,
    max_discount DECIMAL(10,2), -- Cap for percentage discounts
    min_order_value DECIMAL(10,2), -- Minimum project value required

    -- Usage limits
    usage_limit INTEGER, -- Total uses allowed (NULL = unlimited)
    usage_count INTEGER DEFAULT 0,
    user_usage_limit INTEGER DEFAULT 1, -- Per user limit

    -- Validity period
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,

    -- Applicability
    applicable_to VARCHAR(20) DEFAULT 'commission' CHECK (applicable_to IN ('commission', 'platform_fee', 'both')),
    user_type VARCHAR(20) DEFAULT 'both' CHECK (user_type IN ('client', 'vendor', 'both')),
    payment_method VARCHAR(20) DEFAULT 'both' CHECK (payment_method IN ('online', 'cash', 'both')),

    -- Event type targeting (optional)
    event_types TEXT[], -- Array of event types this promo applies to

    -- Status
    is_active BOOLEAN DEFAULT true,
    deactivated_at TIMESTAMP,
    deactivation_reason TEXT,

    -- Tracking
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT promo_codes_discount_value_positive CHECK (discount_value > 0),
    CONSTRAINT promo_codes_percentage_valid CHECK (
        discount_type != 'percentage' OR discount_value <= 100
    ),
    CONSTRAINT promo_codes_usage_limits_valid CHECK (
        usage_limit IS NULL OR usage_limit > 0
    )
);

COMMENT ON TABLE public.promo_codes IS 'Promotional codes for commission discounts and customer acquisition';

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON public.promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid_until ON public.promo_codes(valid_until);

-- =====================================================
-- PART 4: Create Promo Usage Tracking Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.promo_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,

    -- Discount details
    project_value DECIMAL(12,2) NOT NULL,
    discount_applied DECIMAL(10,2) NOT NULL,
    original_commission DECIMAL(10,2) NOT NULL,
    final_commission DECIMAL(10,2) NOT NULL,

    -- Context
    payment_method VARCHAR(50),
    event_type VARCHAR(100),

    -- Tracking
    used_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT promo_usage_amounts_valid CHECK (
        discount_applied >= 0 AND
        final_commission >= 0 AND
        original_commission >= final_commission
    )
);

COMMENT ON TABLE public.promo_usage IS 'Tracks every use of promotional codes for analytics';

CREATE INDEX IF NOT EXISTS idx_promo_usage_promo_code_id ON public.promo_usage(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_user_id ON public.promo_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_contract_id ON public.promo_usage(contract_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_used_at ON public.promo_usage(used_at);

-- =====================================================
-- PART 5: Create Commission Invoices Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.commission_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,

    -- Invoice details
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,

    -- Amounts
    project_value DECIMAL(12,2) NOT NULL,
    base_commission DECIMAL(10,2) NOT NULL,
    promo_discount DECIMAL(10,2) DEFAULT 0,
    commission_after_discount DECIMAL(10,2) NOT NULL,
    gst_amount DECIMAL(10,2) NOT NULL, -- 18% GST
    platform_fee DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,

    -- Payment tracking
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'OVERDUE', 'PAID', 'CANCELLED')),
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    paid_at TIMESTAMP,

    -- Documents
    pdf_url TEXT,

    -- Reminders
    reminder_sent_at TIMESTAMP,
    reminder_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT commission_invoices_amounts_positive CHECK (
        project_value > 0 AND
        base_commission >= 0 AND
        promo_discount >= 0 AND
        gst_amount >= 0 AND
        total_amount >= 0
    ),
    CONSTRAINT commission_invoices_due_date_valid CHECK (due_date >= invoice_date)
);

COMMENT ON TABLE public.commission_invoices IS 'Commission invoices for cash payment contracts';

CREATE INDEX IF NOT EXISTS idx_commission_invoices_vendor_id ON public.commission_invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_commission_invoices_contract_id ON public.commission_invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_commission_invoices_status ON public.commission_invoices(status);
CREATE INDEX IF NOT EXISTS idx_commission_invoices_due_date ON public.commission_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_commission_invoices_invoice_number ON public.commission_invoices(invoice_number);

-- =====================================================
-- PART 6: Create Invoice Number Generator Function
-- =====================================================

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    invoice_num TEXT;
    year_month TEXT;
    sequence_num INTEGER;
BEGIN
    -- Format: EF-YYYYMM-XXXX (e.g., EF-202501-0001)
    year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');

    -- Get next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 11) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.commission_invoices
    WHERE invoice_number LIKE 'EF-' || year_month || '-%';

    -- Format with leading zeros
    invoice_num := 'EF-' || year_month || '-' || LPAD(sequence_num::TEXT, 4, '0');

    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 7: Update Triggers
-- =====================================================

-- Trigger to update updated_at on promo_codes
DROP TRIGGER IF EXISTS update_promo_codes_updated_at ON public.promo_codes;
CREATE TRIGGER update_promo_codes_updated_at
    BEFORE UPDATE ON public.promo_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on commission_invoices
DROP TRIGGER IF EXISTS update_commission_invoices_updated_at ON public.commission_invoices;
CREATE TRIGGER update_commission_invoices_updated_at
    BEFORE UPDATE ON public.commission_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 8: Row Level Security Policies
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_invoices ENABLE ROW LEVEL SECURITY;

-- Promo codes: Everyone can read active codes, only admins can manage
CREATE POLICY promo_codes_select_active ON public.promo_codes
    FOR SELECT
    USING (is_active = true OR auth.uid() IN (
        SELECT id FROM public.users WHERE user_type = 'admin'
    ));

CREATE POLICY promo_codes_admin_all ON public.promo_codes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Promo usage: Users can view their own usage, admins can view all
CREATE POLICY promo_usage_select_own ON public.promo_usage
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY promo_usage_insert_own ON public.promo_usage
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Commission invoices: Vendors can view their own, admins can view/manage all
CREATE POLICY commission_invoices_select_own ON public.commission_invoices
    FOR SELECT
    USING (
        vendor_id IN (
            SELECT id FROM public.vendors
            WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY commission_invoices_admin_all ON public.commission_invoices
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- =====================================================
-- PART 9: Helper Functions
-- =====================================================

-- Function to validate promo code
CREATE OR REPLACE FUNCTION validate_promo_code(
    p_code VARCHAR,
    p_user_id UUID,
    p_project_value DECIMAL,
    p_payment_method VARCHAR DEFAULT 'online',
    p_event_type VARCHAR DEFAULT NULL
) RETURNS TABLE (
    is_valid BOOLEAN,
    error_message TEXT,
    discount_amount DECIMAL,
    promo_code_id UUID
) AS $$
DECLARE
    v_promo promo_codes%ROWTYPE;
    v_user_usage_count INTEGER;
    v_discount DECIMAL;
BEGIN
    -- Find promo code
    SELECT * INTO v_promo
    FROM public.promo_codes
    WHERE code = p_code AND is_active = true;

    -- Check if code exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Invalid or inactive promo code', 0::DECIMAL, NULL::UUID;
        RETURN;
    END IF;

    -- Check validity period
    IF v_promo.valid_from > NOW() THEN
        RETURN QUERY SELECT false, 'Promo code not yet active', 0::DECIMAL, NULL::UUID;
        RETURN;
    END IF;

    IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < NOW() THEN
        RETURN QUERY SELECT false, 'Promo code has expired', 0::DECIMAL, NULL::UUID;
        RETURN;
    END IF;

    -- Check usage limit
    IF v_promo.usage_limit IS NOT NULL AND v_promo.usage_count >= v_promo.usage_limit THEN
        RETURN QUERY SELECT false, 'Promo code usage limit reached', 0::DECIMAL, NULL::UUID;
        RETURN;
    END IF;

    -- Check user usage limit
    SELECT COUNT(*) INTO v_user_usage_count
    FROM public.promo_usage
    WHERE promo_code_id = v_promo.id AND user_id = p_user_id;

    IF v_user_usage_count >= v_promo.user_usage_limit THEN
        RETURN QUERY SELECT false, 'You have already used this promo code', 0::DECIMAL, NULL::UUID;
        RETURN;
    END IF;

    -- Check minimum order value
    IF v_promo.min_order_value IS NOT NULL AND p_project_value < v_promo.min_order_value THEN
        RETURN QUERY SELECT
            false,
            'Minimum order value of ₹' || v_promo.min_order_value || ' required',
            0::DECIMAL,
            NULL::UUID;
        RETURN;
    END IF;

    -- Check payment method compatibility
    IF v_promo.payment_method != 'both' AND v_promo.payment_method != p_payment_method THEN
        RETURN QUERY SELECT false, 'Promo code not valid for this payment method', 0::DECIMAL, NULL::UUID;
        RETURN;
    END IF;

    -- Check event type compatibility
    IF v_promo.event_types IS NOT NULL AND p_event_type IS NOT NULL THEN
        IF NOT (p_event_type = ANY(v_promo.event_types)) THEN
            RETURN QUERY SELECT false, 'Promo code not valid for this event type', 0::DECIMAL, NULL::UUID;
            RETURN;
        END IF;
    END IF;

    -- Calculate discount (simplified - actual calculation in application logic)
    IF v_promo.discount_type = 'fixed_amount' THEN
        v_discount := v_promo.discount_value;
    ELSE
        v_discount := 0; -- Will be calculated by application
    END IF;

    -- Valid!
    RETURN QUERY SELECT true, NULL::TEXT, v_discount, v_promo.id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 10: Seed Data - Launch Promo Codes
-- =====================================================

-- Insert launch promotional codes
INSERT INTO public.promo_codes (
    code,
    description,
    internal_notes,
    discount_type,
    discount_value,
    max_discount,
    min_order_value,
    usage_limit,
    user_usage_limit,
    valid_until,
    applicable_to,
    user_type,
    is_active
) VALUES
    (
        'LAUNCH50',
        'Launch Special - 50% off commission',
        'Limited launch offer for first 100 users',
        'percentage',
        50.00,
        15000.00,
        50000.00,
        100,
        1,
        '2025-03-31 23:59:59',
        'commission',
        'both',
        true
    ),
    (
        'FIRSTVENDOR',
        'First project - 100% commission waiver',
        'Vendor acquisition campaign - first project free',
        'percentage',
        100.00,
        25000.00,
        NULL,
        50,
        1,
        NULL,
        'commission',
        'vendor',
        true
    ),
    (
        'WEDDING2025',
        'Wedding season special - ₹5,000 off',
        'Wedding season promotional campaign',
        'fixed_amount',
        5000.00,
        NULL,
        200000.00,
        200,
        2,
        '2025-06-30 23:59:59',
        'commission',
        'both',
        true
    ),
    (
        'CASHBACK1000',
        'Cash payment bonus - ₹1,000 off',
        'Encourage cash payments with additional discount',
        'fixed_amount',
        1000.00,
        NULL,
        100000.00,
        NULL,
        1,
        NULL,
        'commission',
        'both',
        true
    ),
    (
        'EARLYBIRD',
        'Early adopter - 25% off',
        'Early adopter incentive',
        'percentage',
        25.00,
        10000.00,
        NULL,
        500,
        1,
        '2025-02-28 23:59:59',
        'both',
        'both',
        true
    )
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- MIGRATION VERIFICATION QUERIES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Verifying cash payment fields on contracts...';
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contracts' AND column_name = 'payment_method'
    ) THEN
        RAISE NOTICE '✓ Cash payment fields added to contracts';
    ELSE
        RAISE WARNING '✗ Cash payment fields missing';
    END IF;

    RAISE NOTICE 'Verifying promo_codes table...';
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'promo_codes'
    ) THEN
        RAISE NOTICE '✓ promo_codes table created';
    ELSE
        RAISE WARNING '✗ promo_codes table missing';
    END IF;

    RAISE NOTICE 'Verifying commission_invoices table...';
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'commission_invoices'
    ) THEN
        RAISE NOTICE '✓ commission_invoices table created';
    ELSE
        RAISE WARNING '✗ commission_invoices table missing';
    END IF;

    RAISE NOTICE 'Checking seeded promo codes...';
    RAISE NOTICE 'Total active promo codes: %', (
        SELECT COUNT(*) FROM public.promo_codes WHERE is_active = true
    );
END $$;
