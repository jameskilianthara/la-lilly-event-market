# EventFoundry Payment System Implementation Guide

## Overview

This guide covers the complete implementation of EventFoundry's commission-based payment system with Razorpay integration. The system handles:

- Tiered commission calculation (12%/10%/8%)
- Client payments via Razorpay
- Automated vendor payouts after commission deduction
- Webhook handling for payment confirmation
- Payment tracking and reconciliation

---

## Architecture

### Payment Flow

```
1. CLIENT SIGNS CONTRACT
   ↓
2. COMMISSION CALCULATED (based on project value tier)
   ↓
3. CLIENT PAYS VIA RAZORPAY (full project amount)
   ↓
4. PAYMENT CAPTURED → WEBHOOK RECEIVED
   ↓
5. COMMISSION DEDUCTED & RECORDED
   ↓
6. VENDOR PAYOUT SCHEDULED (48 hours later)
   ↓
7. VENDOR RECEIVES PAYMENT (project value - commission - platform fee)
```

### Commission Tiers

| Tier | Project Value | Commission Rate | Platform Fee |
|------|---------------|-----------------|--------------|
| Standard | ≤₹5L | 12% | ₹500 |
| Premium | ₹5L - ₹20L | 10% | ₹500 |
| Luxury | >₹20L | 8% | ₹500 |

**Example:**
- Project Value: ₹8,00,000 (Premium tier)
- Commission: ₹80,000 (10%)
- Platform Fee: ₹500
- Vendor Receives: ₹7,19,500

---

## Database Schema

### New Tables Created

#### 1. **vendor_payouts**
Tracks vendor payouts after commission deduction.

```sql
CREATE TABLE vendor_payouts (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  contract_id UUID REFERENCES contracts(id),
  payment_id UUID REFERENCES payments(id),
  payout_amount DECIMAL(12,2),
  razorpay_payout_id VARCHAR(255),
  status VARCHAR(50), -- PENDING | PROCESSING | COMPLETED | FAILED
  initiated_at TIMESTAMP,
  completed_at TIMESTAMP,
  bank_account_number VARCHAR(50),
  bank_ifsc_code VARCHAR(20),
  payout_metadata JSONB
);
```

#### 2. **commission_revenue**
Tracks platform commission revenue for financial reporting.

```sql
CREATE TABLE commission_revenue (
  id UUID PRIMARY KEY,
  contract_id UUID REFERENCES contracts(id),
  payment_id UUID REFERENCES payments(id),
  project_value DECIMAL(12,2),
  commission_rate DECIMAL(4,2),
  commission_amount DECIMAL(12,2),
  platform_fee DECIMAL(8,2),
  total_revenue DECIMAL(12,2),
  commission_tier VARCHAR(20),
  collected_at TIMESTAMP
);
```

### Updated Tables

#### **contracts** table - Added commission fields:
```sql
ALTER TABLE contracts ADD COLUMN project_value DECIMAL(12,2);
ALTER TABLE contracts ADD COLUMN commission_rate DECIMAL(4,2);
ALTER TABLE contracts ADD COLUMN commission_amount DECIMAL(12,2);
ALTER TABLE contracts ADD COLUMN platform_fee DECIMAL(8,2);
ALTER TABLE contracts ADD COLUMN vendor_payout DECIMAL(12,2);
ALTER TABLE contracts ADD COLUMN commission_tier VARCHAR(20);
```

#### **payments** table - Added Razorpay tracking:
```sql
ALTER TABLE payments ADD COLUMN razorpay_payment_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN razorpay_order_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN commission_collected DECIMAL(12,2);
ALTER TABLE payments ADD COLUMN vendor_payout_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN client_paid_at TIMESTAMP;
ALTER TABLE payments ADD COLUMN vendor_paid_at TIMESTAMP;
ALTER TABLE payments ADD COLUMN payout_scheduled_at TIMESTAMP;
```

---

## File Structure

```
/src
├── /lib
│   ├── commission.ts          # Commission calculation logic
│   └── razorpay.ts            # Razorpay API integration
├── /app/api/payments
│   ├── create/route.ts        # Create payment order
│   ├── verify/route.ts        # Verify payment signature
│   ├── webhook/route.ts       # Handle Razorpay webhooks
│   └── payout/route.ts        # Initiate vendor payout
├── /components/payments
│   └── PaymentForm.tsx        # Razorpay checkout component
└── /app/contracts/[contractId]/payment
    ├── page.tsx               # Payment page
    └── success/page.tsx       # Success confirmation

/supabase/migrations
└── 20250131_payment_tracking.sql  # Database migration
```

---

## Step-by-Step Implementation

### STEP 1: Apply Database Migration

```bash
# Connect to Supabase
cd supabase

# Apply migration
psql $DATABASE_URL -f migrations/20250131_payment_tracking.sql

# Verify tables created
psql $DATABASE_URL -c "\d vendor_payouts"
psql $DATABASE_URL -c "\d commission_revenue"
```

**Verification queries:**
```sql
-- Check if commission fields added to contracts
SELECT column_name FROM information_schema.columns
WHERE table_name = 'contracts' AND column_name LIKE '%commission%';

-- Check if Razorpay fields added to payments
SELECT column_name FROM information_schema.columns
WHERE table_name = 'payments' AND column_name LIKE '%razorpay%';
```

---

### STEP 2: Configure Razorpay Credentials

1. **Get Razorpay API keys:**
   - Visit: https://dashboard.razorpay.com/app/keys
   - Copy Test Key ID and Test Key Secret

2. **Create `.env.local`:**
   ```bash
   cp .env.razorpay.example .env.local
   ```

3. **Add credentials to `.env.local`:**
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXX
   RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
   RAZORPAY_WEBHOOK_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
   RAZORPAY_ACCOUNT_NUMBER=XXXXXXXXXXXXXXXXXXXX
   ```

4. **Verify configuration:**
   ```typescript
   import { validateRazorpayConfig } from '@/lib/razorpay';

   const validation = validateRazorpayConfig();
   console.log(validation); // Should show { valid: true, errors: [] }
   ```

---

### STEP 3: Set Up Razorpay Webhooks

1. **Go to Razorpay Dashboard:**
   - https://dashboard.razorpay.com/app/webhooks

2. **Add webhook URL:**
   ```
   URL: https://yourapp.com/api/payments/webhook
   Active Events:
   ☑ payment.authorized
   ☑ payment.captured
   ☑ payment.failed
   ☑ order.paid
   ☑ refund.created
   ☑ payout.processed
   ☑ payout.reversed
   ```

3. **Copy webhook secret** and add to `.env.local`:
   ```env
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
   ```

4. **Test webhook locally** (using ngrok):
   ```bash
   # Start ngrok
   ngrok http 3000

   # Update webhook URL to: https://xxxxx.ngrok.io/api/payments/webhook
   ```

---

### STEP 4: Test Payment Flow

#### A. Create Test Contract

```typescript
// In your test script or Supabase SQL editor
INSERT INTO contracts (
  id,
  event_id,
  bid_id,
  status,
  project_value,
  commission_rate,
  commission_amount,
  platform_fee,
  vendor_payout,
  commission_tier
)
VALUES (
  uuid_generate_v4(),
  'your_event_id',
  'your_bid_id',
  'SIGNED',
  800000, -- ₹8L
  10.00,  -- 10% (Premium tier)
  80000,  -- ₹80K commission
  500,    -- ₹500 platform fee
  719500, -- ₹7,19,500 vendor payout
  'premium'
);
```

#### B. Navigate to Payment Page

```
http://localhost:3000/contracts/{contractId}/payment
```

#### C. Complete Test Payment

Use Razorpay test card details:
- **Card Number:** 4111 1111 1111 1111
- **CVV:** 123
- **Expiry:** Any future date
- **OTP:** 123456 (for 3D Secure)

#### D. Verify Payment Flow

1. **Check payments table:**
   ```sql
   SELECT * FROM payments WHERE contract_id = 'your_contract_id';
   ```
   Expected: `status = 'COMPLETED'`, `razorpay_payment_id` populated

2. **Check commission_revenue table:**
   ```sql
   SELECT * FROM commission_revenue WHERE contract_id = 'your_contract_id';
   ```
   Expected: Commission recorded with correct tier and amounts

3. **Check contract status:**
   ```sql
   SELECT status FROM contracts WHERE id = 'your_contract_id';
   ```
   Expected: `status = 'COMMISSIONED'`

4. **Check event status:**
   ```sql
   SELECT forge_status FROM events WHERE id = 'your_event_id';
   ```
   Expected: `forge_status = 'IN_FORGE'`

---

### STEP 5: Test Vendor Payout

#### A. Add Vendor Bank Details

```sql
UPDATE vendors
SET
  bank_account_number = '1234567890',
  bank_ifsc_code = 'SBIN0001234',
  bank_account_name = 'Test Vendor Pvt Ltd'
WHERE id = 'your_vendor_id';
```

#### B. Initiate Payout (via API)

```bash
curl -X POST http://localhost:3000/api/payments/payout \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "your_payment_id",
    "adminUserId": "admin_user_id"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "payoutId": "uuid",
    "razorpayPayoutId": "pout_xxxxx",
    "vendorName": "Test Vendor Pvt Ltd",
    "payoutAmount": 719500,
    "status": "PROCESSING"
  }
}
```

#### C. Verify Payout

```sql
SELECT * FROM vendor_payouts WHERE payment_id = 'your_payment_id';
```

Expected fields:
- `status = 'PROCESSING'`
- `payout_amount = 719500`
- `razorpay_payout_id` populated

---

### STEP 6: Monitor Webhook Events

#### A. Check Webhook Logs

```sql
-- If you add webhook logging (recommended)
SELECT * FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

#### B. Test Webhook Manually

```bash
# Send test webhook from Razorpay Dashboard
# Go to: Webhooks → Test Webhook → payment.captured
```

#### C. Verify Webhook Processing

Check server logs for:
```
Razorpay webhook event received: payment.captured
Payment captured successfully: { paymentId: 'pay_xxxxx', amount: 800000 }
```

---

## Production Deployment Checklist

### Pre-Launch

- [ ] Switch from test to live Razorpay API keys
- [ ] Update webhook URL to production domain
- [ ] Verify webhook signature validation
- [ ] Test payment flow with real (small) amount
- [ ] Activate Razorpay X for payouts
- [ ] Complete Razorpay KYC verification
- [ ] Add business bank account to Razorpay X
- [ ] Test payout with real bank account

### Security

- [ ] Ensure `RAZORPAY_KEY_SECRET` is never exposed in frontend
- [ ] Verify webhook signature on all requests
- [ ] Enable HTTPS for all payment pages
- [ ] Add rate limiting to payment APIs
- [ ] Set up monitoring for failed payments
- [ ] Configure alerts for payout failures

### Monitoring

- [ ] Set up Razorpay Dashboard email alerts
- [ ] Create daily reconciliation script
- [ ] Monitor commission_revenue table
- [ ] Track payout success/failure rates
- [ ] Set up payment analytics dashboard

### Legal & Compliance

- [ ] Update terms of service with commission structure
- [ ] Add payment terms to vendor agreements
- [ ] Ensure GST compliance (if applicable)
- [ ] Set up invoicing for commission collection
- [ ] Configure tax reporting

---

## API Reference

### POST /api/payments/create

Creates a Razorpay order for client payment.

**Request:**
```json
{
  "contractId": "uuid",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "razorpayOrderId": "order_xxxxx",
    "razorpayKeyId": "rzp_live_xxxxx",
    "amount": 800000,
    "currency": "INR",
    "commission": {
      "commissionRate": 10,
      "commissionAmount": 80000,
      "platformFee": 500,
      "vendorPayout": 719500,
      "tier": "premium"
    }
  }
}
```

### POST /api/payments/verify

Verifies Razorpay payment signature.

**Request:**
```json
{
  "razorpay_order_id": "order_xxxxx",
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_signature": "signature_hash"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully"
}
```

### POST /api/payments/webhook

Handles Razorpay webhook events (called by Razorpay).

**Headers:**
```
x-razorpay-signature: webhook_signature_hash
```

**Events Handled:**
- `payment.authorized` - Payment authorized
- `payment.captured` - Payment captured (triggers commission collection)
- `payment.failed` - Payment failed
- `refund.created` - Refund processed
- `payout.processed` - Vendor payout completed

### POST /api/payments/payout

Initiates vendor payout.

**Request:**
```json
{
  "paymentId": "uuid",
  "adminUserId": "uuid" // optional, bypasses 48hr wait
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payoutId": "uuid",
    "razorpayPayoutId": "pout_xxxxx",
    "vendorName": "Vendor Company",
    "payoutAmount": 719500,
    "status": "PROCESSING"
  }
}
```

---

## Troubleshooting

### Payment Creation Fails

**Error:** "Razorpay not configured"

**Solution:**
```bash
# Check environment variables
echo $NEXT_PUBLIC_RAZORPAY_KEY_ID
echo $RAZORPAY_KEY_SECRET

# Verify they are set in .env.local
```

### Webhook Signature Verification Fails

**Error:** "Invalid signature"

**Solution:**
```typescript
// Check RAZORPAY_WEBHOOK_SECRET is correct
console.log('Webhook secret:', process.env.RAZORPAY_WEBHOOK_SECRET);

// Verify webhook URL matches production domain
// Webhook URL must be HTTPS in production
```

### Payout Fails

**Error:** "Vendor bank details not configured"

**Solution:**
```sql
-- Add vendor bank details
UPDATE vendors
SET
  bank_account_number = 'account_number',
  bank_ifsc_code = 'IFSC_CODE',
  bank_account_name = 'Account Holder Name'
WHERE id = 'vendor_id';
```

### Commission Not Calculated

**Error:** Commission fields null in contract

**Solution:**
```typescript
// Manually trigger commission calculation
import { calculateCommission } from '@/lib/commission';

const commission = calculateCommission(projectValue);
// Update contract with commission values
```

---

## Testing Checklist

### Unit Tests

- [ ] Commission calculation for all tiers
- [ ] Razorpay signature verification
- [ ] Payment status transitions
- [ ] Payout eligibility checks

### Integration Tests

- [ ] Create payment order
- [ ] Process webhook events
- [ ] Initiate payout
- [ ] Handle refunds

### End-to-End Tests

- [ ] Complete payment flow (client perspective)
- [ ] Receive payout (vendor perspective)
- [ ] Payment failure handling
- [ ] Webhook retry mechanism

---

## Next Steps

After implementing payment system:

1. **Add Milestone Payments:**
   - Split payments (e.g., 30% advance, 70% on completion)
   - Use `calculateMilestonePayments()` from commission.ts

2. **Implement Escrow:**
   - Hold payments until project completion
   - Add dispute resolution workflow

3. **Add Analytics:**
   - Commission revenue dashboard
   - Payout success rates
   - Payment method distribution

4. **Optimize Payouts:**
   - Batch multiple payouts
   - Schedule payouts at optimal times
   - Reduce transaction fees

---

## Support

For issues:
- Razorpay Documentation: https://razorpay.com/docs/
- EventFoundry Support: forge@eventfoundry.com

For development help:
- Check server logs for detailed errors
- Use Razorpay test mode for debugging
- Review webhook event payloads in Razorpay Dashboard
