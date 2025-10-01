-- Clean up unused options from the options table
-- This script removes all unused options and consolidates duplicates
-- Run this in your Supabase SQL editor

BEGIN;

-- First, let's consolidate the website field duplicates
-- If 'website' doesn't exist, update the first duplicate to be 'website'
-- Otherwise, just delete the duplicates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM options WHERE option_name = 'website') THEN
    -- No 'website' entry exists, so rename the first one we find
    UPDATE options 
    SET option_name = 'website',
        description = 'Business website URL',
        updated_at = NOW()
    WHERE id = (
      SELECT MIN(id) 
      FROM options 
      WHERE option_name IN ('business_website', 'website_url')
    );
  END IF;
END $$;

-- Delete duplicate website entries (business_website, website_url)
DELETE FROM options 
WHERE option_name IN ('business_website', 'website_url');

-- Now delete all unused options
-- Keep only: business_name, business_email, business_phone, business_address, website, minimum_order_weight, tax_rate
DELETE FROM options 
WHERE option_name NOT IN (
  'business_name',
  'business_email', 
  'business_phone',
  'business_address',
  'website',
  'minimum_order_weight',
  'tax_rate'
);

-- Verify what's left (should be 7 rows)
SELECT 
  option_name, 
  option_value, 
  category,
  description,
  updated_at
FROM options
ORDER BY option_name;

COMMIT;

-- Expected output:
-- business_address | 1013 Hazeltn ln. Fuquay-Varina, NC 27526
-- business_email   | info@theplateyard.com
-- business_name    | The Plate Yard
-- business_phone   | (607) 329-5976
-- minimum_order_weight | 7000
-- tax_rate         | 0.0725
-- website          | https://carolinabumperplates.com
