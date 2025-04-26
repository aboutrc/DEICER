/*
  # Fix archived markers filtering

  1. Changes
    - Add index for active status and last_confirmed
    - Update cleanup function to properly set archived status
    - Add function to check if marker should be archived
    
  2. Security
    - Maintains existing RLS policies
    - No changes to permissions
*/

-- Add composite index for active status and last_confirmed
CREATE INDEX IF NOT EXISTS idx_markers_active_confirmed 
ON markers(active, last_confirmed);

-- Function to determine if a marker should be archived
CREATE OR REPLACE FUNCTION should_archive_marker(
  p_last_confirmed timestamptz,
  p_reliability_score float,
  p_negative_confirmations integer
) RETURNS boolean AS $$
BEGIN
  RETURN (
    p_last_confirmed < NOW() - INTERVAL '24 hours'
    OR (p_reliability_score < 0.3 AND p_negative_confirmations > 5)
  );
END;
$$ LANGUAGE plpgsql;

-- Update cleanup function to properly handle archiving
CREATE OR REPLACE FUNCTION cleanup_inactive_markers()
RETURNS void AS $$
BEGIN
  -- Archive markers that are:
  -- 1. Currently active
  -- 2. Either:
  --    - Over 24 hours old with no recent confirmation
  --    - Have low reliability score and many negative confirmations
  UPDATE markers
  SET 
    active = false,
    last_status_change = NOW()
  WHERE 
    active = true
    AND should_archive_marker(last_confirmed, reliability_score, negative_confirmations);
END;
$$ LANGUAGE plpgsql;