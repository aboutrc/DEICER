/*
  # Update marker status function for observer expiration
  
  1. Changes
    - Modify update_marker_status function to archive observer markers after 1 hour
    - Keep ICE markers visible for 24 hours
    - Preserve all markers in database for recordkeeping
    
  2. Security
    - Maintain existing RLS policies
*/

-- Create or replace function to update marker status
CREATE OR REPLACE FUNCTION update_marker_status()
RETURNS trigger AS $$
BEGIN
  -- Set last_status_change when active status changes
  IF (TG_OP = 'UPDATE' AND OLD.active IS DISTINCT FROM NEW.active) OR TG_OP = 'INSERT' THEN
    NEW.last_status_change = now();
  END IF;

  -- Ensure last_confirmed is set
  IF NEW.last_confirmed IS NULL THEN
    NEW.last_confirmed = NEW.created_at;
  END IF;
  
  -- Set active status based on category and age
  -- Observer markers are archived after 1 hour
  -- ICE markers are archived after 24 hours
  IF NEW.category = 'observer' AND NEW.created_at < NOW() - INTERVAL '1 hour' THEN
    NEW.active = false;
  ELSIF NEW.category = 'ice' AND NEW.last_confirmed < NOW() - INTERVAL '24 hours' THEN
    NEW.active = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_marker_status_trigger ON markers;

-- Create trigger for status updates
CREATE TRIGGER update_marker_status_trigger
  BEFORE INSERT OR UPDATE ON markers
  FOR EACH ROW
  EXECUTE FUNCTION update_marker_status();

-- Create index for observer markers to improve query performance
CREATE INDEX IF NOT EXISTS idx_markers_category_created 
ON markers(category, created_at);

-- Update existing markers to ensure proper status
UPDATE markers
SET 
  active = CASE 
    WHEN category = 'observer' AND created_at < NOW() - INTERVAL '1 hour' THEN false
    WHEN category = 'ice' AND last_confirmed < NOW() - INTERVAL '24 hours' THEN false
    ELSE true
  END,
  last_status_change = NOW()
WHERE true;