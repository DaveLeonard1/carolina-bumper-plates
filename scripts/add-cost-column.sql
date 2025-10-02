-- Add cost column to products table
-- This allows tracking cost per plate for profit calculations
-- Run this in your Supabase SQL editor

ALTER TABLE products ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) DEFAULT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN products.cost IS 'Cost per plate (admin only, not visible to customers)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'cost';
