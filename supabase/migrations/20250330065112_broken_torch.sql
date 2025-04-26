/*
  # Enhanced marker cleanup system

  1. Changes
    - Improve cleanup function to only archive active markers
    - Add last_status_change timestamp update
    - Add conditions for archiving:
      a) Over 24 hours old with no recent confirmation
      b) Low reliability score with multiple negative confirmations
    
  2. Security
    - Maintains existing RLS policies
    - Preserves data for audit purposes
*/

-- Update cleanup function to handle old markers
CREATE OR REPLACE FUNCTION cleanup_inactive_markers()
RETURNS void AS $$
BEGIN
  -- Archive markers that are:
  -- 1. Currently active
  -- 2. Over 24 hours old with no recent confirmation
  -- 3. Have reliability score below threshold
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