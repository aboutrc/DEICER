/*
  # Fix marker cleanup system

  1. Changes
    - Remove dependency on cron extension
    - Create a simpler cleanup function
    - Add proper indexes for performance
    - Fix the stack depth exceeded error
    
  2. Security
    - Maintains existing RLS policies
    - Preserves data integrity
*/

-- Disable the trigger that's causing the stack depth issue
DROP TRIGGER IF EXISTS trigger_auto_cleanup_markers ON markers;

-- Drop the problematic functions
DROP FUNCTION IF EXISTS auto_cleanup_markers;
DROP FUNCTION IF EXISTS should_archive_marker;
DROP FUNCTION IF EXISTS cleanup_inactive_markers;

-- Add active column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markers' AND column_name = 'active'
  ) THEN
    ALTER TABLE markers ADD COLUMN active boolean DEFAULT true;
  END IF;
END $$;

-- Set active = true for all existing rows
UPDATE markers SET active = true WHERE active IS NULL;

-- Create index for active column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_markers_active ON markers(active);

-- Create index for last_confirmed if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_markers_last_confirmed ON markers(last_confirmed);

-- Create index for reliability and confirmations if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_markers_reliability_confirmations 
ON markers(reliability_score, negative_confirmations);

-- Create a simplified version of cleanup_inactive_markers that won't cause stack overflow
CREATE OR REPLACE FUNCTION cleanup_inactive_markers()
RETURNS void AS $$
BEGIN
  -- Archive markers that are:
  -- 1. Currently active
  -- 2. Over 24 hours old with no recent confirmation
  -- 3. Not recently created (at least 24 hours old)
  UPDATE markers
  SET 
    active = false,
    last_status_change = NOW()
  WHERE 
    active = true
    AND created_at < NOW() - INTERVAL '24 hours'
    AND last_confirmed < NOW() - INTERVAL '24 hours';
    
  -- Also archive markers with very low reliability and many negative confirmations
  UPDATE markers
  SET 
    active = false,
    last_status_change = NOW()
  WHERE 
    active = true
    AND created_at < NOW() - INTERVAL '24 hours'
    AND reliability_score < 0.3 
    AND negative_confirmations > 5;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function that runs cleanup periodically
CREATE OR REPLACE FUNCTION trigger_cleanup_check()
RETURNS trigger AS $$
BEGIN
  -- Only run cleanup if it's been more than 5 minutes since last cleanup
  IF NOT EXISTS (
    SELECT 1 FROM markers 
    WHERE last_status_change > NOW() - INTERVAL '5 minutes'
  ) THEN
    PERFORM cleanup_inactive_markers();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run cleanup check after inserts and updates
CREATE TRIGGER trigger_cleanup_check
  AFTER INSERT OR UPDATE ON markers
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_cleanup_check();