/*
  # Fix marker aging system without recursion
  
  1. Changes
    - Implement marker aging without recursive function calls
    - Fix stack depth limit exceeded error
    - Add proper indexes for performance
    - Ensure proper timestamp handling
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing triggers and functions that might be causing recursion
DROP TRIGGER IF EXISTS update_marker_status_trigger ON markers;
DROP TRIGGER IF EXISTS trigger_auto_cleanup_markers ON markers;
DROP TRIGGER IF EXISTS trigger_cleanup_check ON markers;
DROP FUNCTION IF EXISTS update_marker_status;
DROP FUNCTION IF EXISTS trigger_cleanup_check;
DROP FUNCTION IF EXISTS cleanup_inactive_markers;
DROP FUNCTION IF EXISTS auto_cleanup_markers;

-- Create function to update marker status without recursive calls
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
  
  -- Set active status based on age
  -- A marker is inactive if it's over 24 hours old
  IF NEW.last_confirmed < NOW() - INTERVAL '24 hours' THEN
    NEW.active = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status updates
CREATE TRIGGER update_marker_status_trigger
  BEFORE INSERT OR UPDATE ON markers
  FOR EACH ROW
  EXECUTE FUNCTION update_marker_status();

-- Create composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_markers_active_confirmed 
ON markers(active, last_confirmed);

CREATE INDEX IF NOT EXISTS idx_markers_active_reliability 
ON markers(active, reliability_score);

-- Update existing markers to ensure proper status
-- This is a direct update that doesn't rely on functions
UPDATE markers
SET 
  active = CASE 
    WHEN last_confirmed >= NOW() - INTERVAL '24 hours' THEN true
    ELSE false
  END,
  last_status_change = NOW()
WHERE last_confirmed IS NOT NULL;

-- Create a standalone function for manual cleanup
-- This won't be triggered automatically to avoid recursion
CREATE OR REPLACE FUNCTION manual_cleanup_markers()
RETURNS void AS $$
BEGIN
  UPDATE markers
  SET 
    active = false,
    last_status_change = NOW()
  WHERE 
    active = true
    AND last_confirmed < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;