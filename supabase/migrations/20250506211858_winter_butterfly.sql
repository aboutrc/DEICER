/*
  # Clear recent ICE and Observer markers
  
  1. Changes
    - Updates all active ICE and Observer markers to inactive status
    - Only affects markers created within the last 24 hours
    - Preserves marker data for historical records
    - Also clears map2_markers if they exist, with column existence check
    
  2. Security
    - Maintains existing RLS policies
    - No changes to permissions
*/

-- Update all active ICE and Observer markers to inactive
UPDATE markers
SET 
  active = false,
  last_status_change = NOW()
WHERE 
  active = true
  AND (category = 'ice' OR category = 'observer')
  AND created_at >= NOW() - INTERVAL '24 hours';

-- Log the number of markers affected
DO $$ 
DECLARE
  affected_count integer;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Cleared % recent markers', affected_count;
END $$;

-- Also clear map2_markers if they exist, checking for column existence first
DO $$ 
BEGIN
  -- Check if the map2_markers table exists
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'map2_markers'
  ) THEN
    -- Check if last_status_change column exists
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'map2_markers' 
      AND column_name = 'last_status_change'
    ) THEN
      -- Update with last_status_change
      EXECUTE '
        UPDATE map2_markers
        SET 
          active = false,
          last_status_change = NOW()
        WHERE 
          active = true
          AND (category = ''ice'' OR category = ''observer'')
          AND created_at >= NOW() - INTERVAL ''24 hours''
      ';
    ELSE
      -- Update without last_status_change
      EXECUTE '
        UPDATE map2_markers
        SET 
          active = false
        WHERE 
          active = true
          AND (category = ''ice'' OR category = ''observer'')
          AND created_at >= NOW() - INTERVAL ''24 hours''
      ';
    END IF;
  END IF;
END $$;