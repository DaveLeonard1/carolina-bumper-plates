# Stripe Integration Deployment Plan

## 🚨 **CRITICAL: Fix Now (Before Live Domain)**

### 1. Enhanced Error Handling ✅ **FIXED**
**Issue**: Webhook failures were silent, causing orders to remain unpaid
**Solution**: Enhanced webhook handler with proper error responses and comprehensive logging

**Changes Made**:
- Webhook now returns HTTP 500 for database failures (triggers Stripe retry)
- Returns HTTP 200 with error details for order lookup failures (prevents infinite retries)
- All failures are logged to `webhook_debug_logs` table

### 2. Multiple Order Lookup Methods ✅ **FIXED**
**Issue**: Orders could only be found by `order_number` in Stripe metadata
**Solution**: Three-tier fallback system

**Lookup Methods**:
1. **Primary**: `session.metadata.order_number` (most reliable)
2. **Fallback**: Customer email + recent pending order (handles missing metadata)
3. **Protection**: Existing session ID (prevents duplicate processing)

### 3. Retry Logic ✅ **FIXED**
**Issue**: Temporary database issues caused permanent payment failures
**Solution**: Exponential backoff retry mechanism

**Implementation**:
- Up to 3 retry attempts for database updates
- 2s, 4s, 8s delay between attempts
- Detailed logging of retry attempts

### 4. Duplicate Protection ✅ **FIXED**
**Issue**: Multiple webhook deliveries could process same payment twice
**Solution**: Session ID tracking and status checking

**Protection Methods**:
- Check if order already marked paid with same session ID
- Log duplicate attempts without failing
- Prevent double-charging scenarios

## ⏳ **Configure After Live Domain Setup**

### 1. Stripe Webhook Endpoint Configuration
**Required Steps**:
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-live-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `invoice.finalized`
4. Copy webhook signing secret

### 2. Environment Variables
**Production Environment**:
\`\`\`bash
STRIPE_WEBHOOK_SECRET=whsec_... # From Stripe Dashboard
STRIPE_SECRET_KEY=sk_live_... # Live secret key
STRIPE_PUBLISHABLE_KEY=pk_live_... # Live publishable key
\`\`\`

**Development Environment**:
\`\`\`bash
STRIPE_WEBHOOK_SECRET=whsec_... # Test webhook secret
STRIPE_SECRET_KEY=sk_test_... # Test secret key
STRIPE_PUBLISHABLE_KEY=pk_test_... # Test publishable key
\`\`\`

### 3. Webhook Testing Process
**After Live Domain Setup**:
1. Create test order in production
2. Generate payment link
3. Complete payment in Stripe test mode
4. Verify webhook delivery in Stripe Dashboard
5. Check `webhook_debug_logs` table for processing details
6. Confirm order status updated to "paid"

## 🔍 **Debugging CBP-20250804-1014 Failure**

### Investigation Queries
\`\`\`sql
-- Check webhook logs for this order
SELECT * FROM webhook_debug_logs 
WHERE order_number = 'CBP-20250804-1014' 
OR debug_data::text ILIKE '%CBP-20250804-1014%'
ORDER BY created_at DESC;

-- Check order timeline
SELECT * FROM order_timeline 
WHERE order_id = (
  SELECT id FROM orders 
  WHERE order_number = 'CBP-20250804-1014'
)
ORDER BY created_at DESC;

-- Check current order status
SELECT 
  order_number,
  status,
  payment_status,
  paid_at,
  stripe_checkout_session_id,
  stripe_payment_intent_id,
  created_at,
  updated_at
FROM orders 
WHERE order_number = 'CBP-20250804-1014';
\`\`\`

### Most Likely Failure Causes
1. **Missing Metadata**: Stripe session didn't include `order_number` in metadata
2. **Webhook Not Delivered**: Network issue or endpoint unreachable
3. **Database Permission**: RLS policy blocked the update
4. **Timing Issue**: Webhook processed before order creation completed

### Resolution Steps
1. Run the investigation queries above
2. Check Stripe Dashboard → Webhooks for delivery attempts
3. If webhook wasn't delivered, verify endpoint URL and SSL certificate
4. If webhook delivered but failed, check error logs in Stripe Dashboard
5. Manual fix: Update order status directly if payment confirmed in Stripe

## 🛡️ **Security Considerations**

### Webhook Security
- **Signature Verification**: All webhooks verify Stripe signature
- **HTTPS Required**: Webhooks only work over HTTPS
- **Idempotency**: Duplicate webhook protection prevents double-processing

### Database Security
- **RLS Enabled**: Row Level Security on all tables
- **Service Role**: Webhooks use service role for database access
- **Audit Trail**: All webhook activities logged with timestamps

## 📊 **Monitoring & Maintenance**

### Key Metrics to Monitor
- Webhook delivery success rate
- Order payment processing time
- Failed webhook retry attempts
- Database update success rate

### Regular Maintenance Tasks
- Review webhook debug logs weekly
- Clean up old webhook logs (>30 days)
- Monitor Stripe Dashboard for webhook health
- Verify payment status consistency between Stripe and database

## 🚀 **Deployment Checklist**

### Pre-Deployment (Development)
- [x] Enhanced webhook handler deployed
- [x] Webhook debug logging table created
- [x] Error handling and retry logic implemented
- [x] Multiple order lookup methods added
- [x] Duplicate protection implemented

### Post-Deployment (Production)
- [ ] Live domain configured
- [ ] Stripe webhook endpoint added
- [ ] Environment variables set
- [ ] Webhook delivery tested
- [ ] Payment flow end-to-end tested
- [ ] Monitoring dashboard configured

### Success Criteria
- Webhook delivery rate > 99%
- Order payment processing < 30 seconds
- Zero duplicate payment processing
- Complete audit trail for all transactions
