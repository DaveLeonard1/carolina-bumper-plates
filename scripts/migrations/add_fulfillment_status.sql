-- Add fulfillment status to the orders table

-- Note: The status column appears to be a text/varchar field, not an enum type
-- No schema changes are needed to add a new status value, just documentation

-- Document the available status values
COMMENT ON COLUMN orders.status IS 'Order status: pending, invoiced, paid, fulfilled, shipped, cancelled, etc.';

-- 2. Add fulfilled_at timestamp column if it doesn't exist
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS fulfillment_notes TEXT;

-- 3. Add index on fulfilled_at for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_fulfilled_at ON orders(fulfilled_at);

-- 4. Add comment to explain the new status
COMMENT ON COLUMN orders.status IS 'Order status: pending, invoiced, paid, fulfilled, shipped, cancelled, etc.';
COMMENT ON COLUMN orders.fulfilled_at IS 'Timestamp when the order was marked as fulfilled';
