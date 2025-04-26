/*
  # Fix stack depth limit issue and add active column
  
  1. Changes
    - Add active column to markers table
    - Disable auto_cleanup_markers trigger temporarily
    - Add index for active column
    - Set active = true for all existing markers
    
  2. Security
    - No changes to RLS policies
*/

-- Disable the trigger that's causing the stack depth issue
DROP TRIGGER IF EXISTS trigger_auto_cleanup_markers ON markers;

-- Drop the problematic function
DROP FUNCTION IF EXISTS should_archive_marker;

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

-- Create index for active column
CREATE INDEX IF NOT EXISTS idx_markers_active ON markers(active);

-- Create a simplified version of should_archive_marker that won't cause stack overflow
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

-- Create a simplified version of cleanup_inactive_markers
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
    AND (
      (last_confirmed < NOW() - INTERVAL '24 hours')
      OR (reliability_score < 0.3 AND negative_confirmations > 5)
    );
END;
$$ LANGUAGE plpgsql;

-- Create a non-recursive auto_cleanup function
CREATE OR REPLACE FUNCTION auto_cleanup_markers()
RETURNS trigger AS $$
BEGIN
  -- Don't call cleanup_inactive_markers to avoid recursion
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger with AFTER STATEMENT timing to avoid recursion
CREATE TRIGGER trigger_auto_cleanup_markers
  AFTER INSERT OR UPDATE ON markers
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_cleanup_markers();