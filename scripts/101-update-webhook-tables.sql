-- Update webhook_queue table to include event_type
ALTER TABLE webhook_queue ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'payment_link_created';

-- Update webhook_logs table to include event_type
ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'payment_link_created';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_queue_event_type ON webhook_queue(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);

-- Update existing records to have proper event types
UPDATE webhook_queue SET event_type = 'payment_link_created' WHERE event_type IS NULL;
UPDATE webhook_logs SET event_type = 'payment_link_created' WHERE event_type IS NULL;
