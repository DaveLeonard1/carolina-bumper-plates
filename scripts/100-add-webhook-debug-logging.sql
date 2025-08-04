-- Add webhook debug logging table if it doesn't exist
CREATE TABLE IF NOT EXISTS webhook_debug_logs (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    event_id TEXT,
    order_number TEXT,
    status TEXT NOT NULL,
    message TEXT NOT NULL,
    debug_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraint for status values
ALTER TABLE webhook_debug_logs 
DROP CONSTRAINT IF EXISTS webhook_debug_logs_status_check;

ALTER TABLE webhook_debug_logs 
ADD CONSTRAINT webhook_debug_logs_status_check 
CHECK (status IN ('success', 'error', 'warning'));

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_webhook_debug_logs_order_number ON webhook_debug_logs(order_number);
CREATE INDEX IF NOT EXISTS idx_webhook_debug_logs_created_at ON webhook_debug_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_debug_logs_status ON webhook_debug_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_debug_logs_event_type ON webhook_debug_logs(event_type);

-- Enable RLS
ALTER TABLE webhook_debug_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage webhook logs" ON webhook_debug_logs;
DROP POLICY IF EXISTS "Authenticated users can read webhook logs" ON webhook_debug_logs;

-- Allow service role to manage webhook logs
CREATE POLICY "Service role can manage webhook logs" ON webhook_debug_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read webhook logs (for admin interface)
CREATE POLICY "Authenticated users can read webhook logs" ON webhook_debug_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Add comment
COMMENT ON TABLE webhook_debug_logs IS 'Detailed logging for Stripe webhook processing and debugging';

-- Insert a test log entry to verify table creation
INSERT INTO webhook_debug_logs (
    event_type,
    event_id,
    order_number,
    status,
    message,
    debug_data,
    created_at
) VALUES (
    'table_creation_test',
    'test_' || extract(epoch from now())::text,
    NULL,
    'success',
    'Webhook debug logging table created successfully',
    '{"table_created": true, "timestamp": "' || now()::text || '"}',
    NOW()
);

-- Verify the table was created and test entry inserted
SELECT 
    'webhook_debug_logs table created successfully' as status,
    count(*) as test_entries
FROM webhook_debug_logs 
WHERE event_type = 'table_creation_test';
