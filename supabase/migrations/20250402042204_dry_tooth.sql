/*
  # Fix marker aging and filtering

  1. Changes
    - Add trigger to update last_status_change
    - Add function to properly handle marker aging
    - Add index for active status and timestamps
    - Update cleanup function to properly archive old markers
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add last_status_change column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markers' AND column_name = 'last_status_change'
  ) THEN
    ALTER TABLE markers ADD COLUMN last_status_change timestamptz DEFAULT now();
  END IF;
END $$;

-- Create index for active status and timestamps
CREATE INDEX IF NOT EXISTS idx_markers_active_confirmed 
ON markers(active, last_confirmed);

-- Create function to update marker status
CREATE OR REPLACE FUNCTION update_marker_status()
RETURNS trigger AS $$
BEGIN
  -- Set last_status_change when active status changes
  IF (TG_OP = 'UPDATE' AND OLD.active IS DISTINCT FROM NEW.active) OR TG_OP = 'INSERT' THEN
    NEW.last_status_change = now();
  END IF;
  
  -- Set active to false if marker is old
  IF NEW.last_confirmed < NOW() - INTERVAL '24 hours' THEN
    NEW.active = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status updates
DROP TRIGGER IF EXISTS update_marker_status_trigger ON markers;
CREATE TRIGGER update_marker_status_trigger
  BEFORE INSERT OR UPDATE ON markers
  FOR EACH ROW
  EXECUTE FUNCTION update_marker_status();

-- Update cleanup function to properly handle aging
CREATE OR REPLACE FUNCTION cleanup_inactive_markers()
RETURNS void AS $$
BEGIN
  -- Archive markers that are:
  -- 1. Currently active
  -- 2. Over 24 hours old with no recent confirmation
  UPDATE markers
  SET 
    active = false,
    last_status_change = NOW()
  WHERE 
    active = true
    AND last_confirmed < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;