-- Add batch_progress_offset setting to options table
-- Run this in your Supabase SQL editor

INSERT INTO options (option_name, option_value, option_type, description, is_sensitive, category)
VALUES (
  'batch_progress_offset',
  '0',
  'number',
  'Weight offset to add to batch progress for social proof (default: 0)',
  false,
  'orders'
)
ON CONFLICT (option_name) DO UPDATE
SET 
  option_type = EXCLUDED.option_type,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = NOW();

-- Verify it was added
SELECT option_name, option_value, description 
FROM options 
WHERE option_name = 'batch_progress_offset';
