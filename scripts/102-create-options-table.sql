-- Create options table for storing configuration and environment variables
CREATE TABLE IF NOT EXISTS options (
  id SERIAL PRIMARY KEY,
  option_name VARCHAR(255) UNIQUE NOT NULL,
  option_value TEXT,
  option_type VARCHAR(50) DEFAULT 'string',
  description TEXT,
  is_sensitive BOOLEAN DEFAULT FALSE,
  category VARCHAR(100) DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_options_name ON options(option_name);
CREATE INDEX IF NOT EXISTS idx_options_category ON options(category);

-- Insert default configuration options
INSERT INTO options (option_name, option_value, option_type, description, category, is_sensitive) VALUES
-- Business Settings
('business_name', 'Carolina Bumper Plates', 'string', 'Business name displayed throughout the application', 'business', false),
('business_email', 'info@carolinabumperplates.com', 'email', 'Primary business email address', 'business', false),
('business_phone', '(555) 123-4567', 'string', 'Business phone number', 'business', false),
('business_address', '123 Fitness St, Charlotte, NC 28202', 'text', 'Business physical address', 'business', false),
('business_website', 'https://carolinabumperplates.com', 'url', 'Business website URL', 'business', false),

-- Order Settings
('minimum_order_weight', '10000', 'number', 'Minimum order weight in pounds', 'orders', false),
('tax_rate', '0.0725', 'decimal', 'Sales tax rate (North Carolina)', 'orders', false),
('shipping_rate', '0.5', 'decimal', 'Shipping cost per pound', 'orders', false),
('pickup_location', 'Charlotte, NC', 'string', 'Default pickup location', 'orders', false),
('pickup_instructions', 'We will contact you 24-48 hours before pickup to coordinate delivery.', 'text', 'Default pickup instructions', 'orders', false),

-- Email Settings
('email_notifications_enabled', 'true', 'boolean', 'Enable email notifications', 'email', false),
('order_confirmation_email_enabled', 'true', 'boolean', 'Send order confirmation emails', 'email', false),
('invoice_email_enabled', 'true', 'boolean', 'Send invoice emails', 'email', false),

-- Stripe Settings (sensitive)
('stripe_publishable_key', '', 'string', 'Stripe publishable key', 'stripe', false),
('stripe_secret_key', '', 'string', 'Stripe secret key', 'stripe', true),
('stripe_webhook_secret', '', 'string', 'Stripe webhook endpoint secret', 'stripe', true),

-- Mailgun Settings (sensitive)
('mailgun_api_key', '', 'string', 'Mailgun API key', 'email', true),
('mailgun_domain', '', 'string', 'Mailgun domain', 'email', false),
('mailgun_from_email', '', 'email', 'Default from email address', 'email', false),

-- Supabase Settings (sensitive)
('supabase_url', '', 'url', 'Supabase project URL', 'database', false),
('supabase_anon_key', '', 'string', 'Supabase anonymous key', 'database', true),
('supabase_service_role_key', '', 'string', 'Supabase service role key', 'database', true),

-- Application Settings
('app_base_url', '', 'url', 'Application base URL', 'app', false),
('app_environment', 'development', 'string', 'Application environment (development/production)', 'app', false),
('debug_mode', 'false', 'boolean', 'Enable debug mode', 'app', false),

-- Zapier Settings
('zapier_webhook_url', '', 'url', 'Zapier webhook URL for automation', 'zapier', false),
('zapier_webhook_enabled', 'false', 'boolean', 'Enable Zapier webhook automation', 'zapier', false),
('zapier_webhook_timeout', '30', 'number', 'Webhook timeout in seconds', 'zapier', false),
('zapier_retry_attempts', '3', 'number', 'Number of retry attempts for failed webhooks', 'zapier', false),
('zapier_retry_delay', '5', 'number', 'Delay between retry attempts in seconds', 'zapier', false),
('zapier_include_customer_data', 'true', 'boolean', 'Include customer data in webhooks', 'zapier', false),
('zapier_include_order_items', 'true', 'boolean', 'Include order items in webhooks', 'zapier', false),
('zapier_include_pricing_data', 'true', 'boolean', 'Include pricing data in webhooks', 'zapier', false),
('zapier_include_shipping_data', 'true', 'boolean', 'Include shipping data in webhooks', 'zapier', false),
('zapier_webhook_secret', '', 'string', 'Webhook secret for signature verification', 'zapier', true)

ON CONFLICT (option_name) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_options_updated_at
  BEFORE UPDATE ON options
  FOR EACH ROW
  EXECUTE FUNCTION update_options_updated_at();
