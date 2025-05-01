/*
  # Clear recent ICE markers
  
  1. Changes
    - Updates all active ICE markers to inactive status
    - Only affects markers created within the last 24 hours
    - Preserves marker data for historical records
    - Sets last_status_change to current timestamp
    
  2. Security
    - Maintains existing RLS policies
    - No changes to permissions
*/

-- Update all active ICE markers to inactive
UPDATE markers
SET 
  active = false,
  last_status_change = NOW()
WHERE 
  active = true
  AND category = 'ice'
  AND created_at >= NOW() - INTERVAL '24 hours';

-- Log the number of markers affected
DO $$ 
DECLARE
  affected_count integer;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Cleared % recent ICE markers', affected_count;
END $$;