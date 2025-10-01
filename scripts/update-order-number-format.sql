-- Update Order Number Generation for The Plate Yard Rebranding
-- Changes order number format from CBP-YYYYMMDD-#### to PY-####
-- Run this script in your Supabase SQL Editor

-- Step 1: Drop the existing trigger and function (if they exist)
-- First remove the default value constraint if it exists
ALTER TABLE orders ALTER COLUMN order_number DROP DEFAULT;

-- Now drop the trigger and function with CASCADE
DROP TRIGGER IF EXISTS set_order_number ON orders;
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;

-- Step 2: Create new order number generation function with PY- prefix
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_order_number TEXT;
BEGIN
  -- Get the next sequential number by finding the highest existing number
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(order_number FROM 'PY-(\d+)') AS INTEGER)),
    999  -- Start from 1000
  ) + 1 INTO next_number
  FROM orders
  WHERE order_number ~ '^PY-\d+$';
  
  -- Format as PY-#### (4 digits minimum)
  new_order_number := 'PY-' || LPAD(next_number::TEXT, 4, '0');
  
  -- Assign the generated order number
  NEW.order_number := new_order_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to auto-generate order numbers on insert
CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- Step 4: (Optional) Update existing order numbers to new format
-- WARNING: This will change all existing order numbers!
-- Only run this if you want to migrate historical data
-- Comment out if you want to keep old order numbers as-is

-- UPDATE orders
-- SET order_number = 'PY-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 4, '0')
-- WHERE order_number ~ '^CBP-';

-- Verification query - check recent order numbers
SELECT order_number, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;
