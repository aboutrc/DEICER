/*
  # Add observer category and auto-archiving

  1. Changes
    - Update markers table category constraint to include 'observer'
    - Create function to automatically archive observer markers after 1 hour
    - Add trigger to run the function when markers are inserted or updated
    
  2. Security
    - Maintain existing RLS policies
*/

-- Update category constraint to include 'observer'
DO $$ 
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'markers_category_check'
  ) THEN
    ALTER TABLE markers DROP CONSTRAINT markers_category_check;
  END IF;
  
  -- Create new constraint with 'observer' category
  ALTER TABLE markers 
  ADD CONSTRAINT markers_category_check 
  CHECK (category IN ('ice', 'police', 'observer'));
END $$;

-- Create function to automatically archive observer markers after 1 hour
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
  IF NEW.category = 'observer' AND NEW.created_at < NOW() - INTERVAL '1 hour' THEN
    -- Observer markers are archived after 1 hour
    NEW.active = false;
  ELSIF NEW.category IN ('ice', 'police') AND NEW.last_confirmed < NOW() - INTERVAL '24 hours' THEN
    -- ICE and police markers are archived after 24 hours
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