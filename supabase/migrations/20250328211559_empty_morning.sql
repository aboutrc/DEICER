/*
  # Enhance marker cleanup system

  1. Changes
    - Add automatic cleanup of old markers (>24h)
    - Add index for last_confirmed timestamp
    - Update cleanup function
    - Add trigger for automatic cleanup

  2. Security
    - Maintains existing RLS policies
    - Preserves data for audit purposes
*/

-- Add index for last_confirmed if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_markers_last_confirmed_active 
ON markers(last_confirmed, active);

-- Update cleanup function to handle old markers
CREATE OR REPLACE FUNCTION cleanup_inactive_markers()
RETURNS void AS $$
BEGIN
  -- Archive markers that are:
  -- 1. Over 24 hours old with no recent confirmation
  -- 2. Have reliability score below threshold
  UPDATE markers
  SET 
    active = false,
    last_status_change = NOW()
  WHERE 
    active = true
    AND (
      (last_confirmed < NOW() - INTERVAL '24 hours')
      OR (reliability_score < 0.3 AND negative_confirmations > 5)
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically run cleanup
CREATE OR REPLACE FUNCTION auto_cleanup_markers()
RETURNS trigger AS $$
BEGIN
  -- Run cleanup when a marker is modified
  PERFORM cleanup_inactive_markers();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run cleanup automatically
DROP TRIGGER IF EXISTS trigger_auto_cleanup_markers ON markers;
CREATE TRIGGER trigger_auto_cleanup_markers
  AFTER INSERT OR UPDATE ON markers
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_cleanup_markers();