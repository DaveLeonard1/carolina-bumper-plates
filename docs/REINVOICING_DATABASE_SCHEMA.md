# Re-invoicing Database Schema Documentation

## Overview
This document describes the database schema changes required for the re-invoicing functionality in Carolina Bumper Plates.

## New Columns Added to `orders` Table

### 1. `reinvoice_count` (INTEGER)
- **Purpose**: Tracks the number of times an order has been re-invoiced
- **Default**: 0
- **Nullable**: No
- **Usage**: Incremented each time an order is re-invoiced

### 2. `last_reinvoice_at` (TIMESTAMP WITH TIME ZONE)
- **Purpose**: Records the timestamp of the most recent re-invoicing attempt
- **Default**: NULL
- **Nullable**: Yes
- **Usage**: Updated each time an order is re-invoiced

### 3. `invoice_status` (VARCHAR(50))
- **Purpose**: Tracks the current status of the invoice
- **Default**: NULL
- **Nullable**: Yes
- **Possible Values**: 'sent', 'paid', 'overdue', 'cancelled'

### 4. `invoice_sent_at` (TIMESTAMP WITH TIME ZONE)
- **Purpose**: Records when the invoice was first sent
- **Default**: NULL
- **Nullable**: Yes
- **Usage**: Set when initial invoice is sent

### 5. `stripe_invoice_pdf` (TEXT)
- **Purpose**: Stores the URL to the Stripe invoice PDF
- **Default**: NULL
- **Nullable**: Yes
- **Usage**: Populated when Stripe invoice is created

## Indexes Added

### Performance Indexes
- `idx_orders_invoice_status`: Index on `invoice_status` for filtering
- `idx_orders_last_reinvoice_at`: Index on `last_reinvoice_at` for sorting
- `idx_orders_reinvoice_count`: Index on `reinvoice_count` for reporting

## Re-invoicing Eligibility Logic

An order is eligible for re-invoicing if:
1. `payment_status` != 'paid'
2. `status` != 'cancelled'
3. Order has been previously invoiced

## Database Migration Scripts

### Script 083: Add Re-invoicing Columns
- Adds all required columns with proper data types
- Creates performance indexes
- Updates existing orders with default values
- Adds column comments for documentation

### Script 084: Verify Schema
- Validates all required columns exist
- Checks data types and constraints
- Provides comprehensive schema report

### Script 085: Test Functionality
- Creates test scenarios
- Validates re-invoicing eligibility logic
- Tests database constraints

## Usage in Code

### Re-invoicing Process
\`\`\`typescript
const updateData = {
  stripe_customer_id: customerId,
  stripe_invoice_id: invoiceId,
  stripe_invoice_url: invoiceUrl,
  stripe_invoice_pdf: invoicePdf,
  invoice_status: "sent",
  invoice_sent_at: new Date().toISOString(),
  reinvoice_count: (order.reinvoice_count || 0) + 1,
  last_reinvoice_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}
\`\`\`

### Eligibility Check
\`\`\`typescript
const canReinvoice = order.payment_status !== 'paid' && 
                    order.status !== 'cancelled'
\`\`\`

## Testing

### Test Endpoint
- `GET /api/test-reinvoicing`: Check system status
- `POST /api/test-reinvoicing`: Test re-invoicing functionality

### Manual Testing
1. Run schema migration scripts
2. Verify columns exist in database
3. Test re-invoicing via admin interface
4. Check database updates after re-invoicing

## Error Handling

The system handles missing columns gracefully:
- Checks for column existence before updates
- Provides clear error messages
- Maintains data integrity during failures

## Rollback Plan

If rollback is needed:
\`\`\`sql
ALTER TABLE orders 
DROP COLUMN IF EXISTS reinvoice_count,
DROP COLUMN IF EXISTS last_reinvoice_at,
DROP COLUMN IF EXISTS invoice_status,
DROP COLUMN IF EXISTS invoice_sent_at,
DROP COLUMN IF EXISTS stripe_invoice_pdf;
\`\`\`

## Monitoring

Monitor these metrics:
- Orders with `reinvoice_count > 0`
- Average time between `invoice_sent_at` and `last_reinvoice_at`
- Success rate of re-invoicing operations
