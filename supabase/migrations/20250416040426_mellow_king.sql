/*
  # Fix marker aging to use creation time
  
  1. Changes
    - Remove all recursive function calls that cause stack depth issues
    - Implement direct marker aging based on creation time
    - Add proper indexes for performance optimization
    - Fix trigger implementation
    
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
  
  -- Set active status based on creation time
  -- A marker is inactive if it was created more than 24 hours ago
  IF NEW.created_at < NOW() - INTERVAL '24 hours' THEN
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
CREATE INDEX IF NOT EXISTS idx_markers_active_created 
ON markers(active, created_at);

-- Create a direct update statement to set marker status
-- This avoids using functions that might cause recursion
UPDATE markers
SET 
  active = CASE 
    WHEN created_at >= NOW() - INTERVAL '24 hours' THEN true
    ELSE false
  END,
  last_status_change = NOW()
WHERE created_at IS NOT NULL;

-- Create a standalone function for manual cleanup
-- This won't be triggered automatically to avoid recursion
CREATE OR REPLACE FUNCTION manual_marker_cleanup()
RETURNS void AS $$
BEGIN
  UPDATE markers
  SET 
    active = false,
    last_status_change = NOW()
  WHERE 
    active = true
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;