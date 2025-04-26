/*
  # Map2 Schema Setup with Existence Checks
  
  1. Changes
    - Add IF NOT EXISTS checks for tables and indexes
    - Use DO blocks for safe constraint creation
    - Preserve existing data and structure
    
  2. Security
    - Maintain RLS policies
    - Keep existing permissions
*/

-- Create map2_markers table if it doesn't exist
CREATE TABLE IF NOT EXISTS map2_markers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('ice', 'police')),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  active boolean DEFAULT true,
  last_confirmed timestamptz DEFAULT now(),
  confirmations_count integer DEFAULT 1,
  reliability_score double precision DEFAULT 1.0
);

-- Add constraints with existence checks
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'title_not_empty'
  ) THEN
    ALTER TABLE map2_markers ADD CONSTRAINT title_not_empty 
      CHECK (length(trim(title)) > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'description_not_empty'
  ) THEN
    ALTER TABLE map2_markers ADD CONSTRAINT description_not_empty 
      CHECK (length(trim(description)) > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'title_max_length'
  ) THEN
    ALTER TABLE map2_markers ADD CONSTRAINT title_max_length 
      CHECK (length(title) <= 200);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'description_max_length'
  ) THEN
    ALTER TABLE map2_markers ADD CONSTRAINT description_max_length 
      CHECK (length(description) <= 2000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_latitude'
  ) THEN
    ALTER TABLE map2_markers ADD CONSTRAINT valid_latitude 
      CHECK (latitude >= -90 AND latitude <= 90);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_longitude'
  ) THEN
    ALTER TABLE map2_markers ADD CONSTRAINT valid_longitude 
      CHECK (longitude >= -180 AND longitude <= 180);
  END IF;
END $$;

-- Create map2_marker_confirmations table if it doesn't exist
CREATE TABLE IF NOT EXISTS map2_marker_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marker_id uuid REFERENCES map2_markers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  confirmed_at timestamptz DEFAULT now(),
  is_active boolean NOT NULL,
  confirmed_from text
);

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'map2_markers' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE map2_markers ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'map2_marker_confirmations' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE map2_marker_confirmations ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies with existence checks
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'map2_markers' 
    AND policyname = 'Anyone can view active markers'
  ) THEN
    CREATE POLICY "Anyone can view active markers"
      ON map2_markers FOR SELECT
      USING (active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'map2_markers' 
    AND policyname = 'Anyone can insert markers'
  ) THEN
    CREATE POLICY "Anyone can insert markers"
      ON map2_markers FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'map2_markers' 
    AND policyname = 'Users can update own markers'
  ) THEN
    CREATE POLICY "Users can update own markers"
      ON map2_markers FOR UPDATE
      USING (
        CASE 
          WHEN auth.uid() IS NOT NULL THEN user_id = auth.uid()
          ELSE false
        END
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'map2_marker_confirmations' 
    AND policyname = 'Anyone can view confirmations'
  ) THEN
    CREATE POLICY "Anyone can view confirmations"
      ON map2_marker_confirmations FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'map2_marker_confirmations' 
    AND policyname = 'Anyone can insert confirmations'
  ) THEN
    CREATE POLICY "Anyone can insert confirmations"
      ON map2_marker_confirmations FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Create indexes with existence checks
CREATE INDEX IF NOT EXISTS idx_map2_markers_active ON map2_markers(active);
CREATE INDEX IF NOT EXISTS idx_map2_markers_coordinates ON map2_markers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_map2_markers_category ON map2_markers(category);
CREATE INDEX IF NOT EXISTS idx_map2_markers_created_at ON map2_markers(created_at);
CREATE INDEX IF NOT EXISTS idx_map2_markers_last_confirmed ON map2_markers(last_confirmed);
CREATE INDEX IF NOT EXISTS idx_map2_markers_reliability ON map2_markers(reliability_score);
CREATE INDEX IF NOT EXISTS idx_map2_markers_user_id ON map2_markers(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_map2_marker_confirmations_marker_id ON map2_marker_confirmations(marker_id);
CREATE INDEX IF NOT EXISTS idx_map2_marker_confirmations_confirmed_at ON map2_marker_confirmations(confirmed_at);
CREATE INDEX IF NOT EXISTS idx_map2_marker_confirmations_user_id ON map2_marker_confirmations(user_id) WHERE user_id IS NOT NULL;

-- Create or replace functions and triggers
CREATE OR REPLACE FUNCTION update_map2_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_map2_markers_updated_at ON map2_markers;
CREATE TRIGGER update_map2_markers_updated_at
  BEFORE UPDATE ON map2_markers
  FOR EACH ROW
  EXECUTE FUNCTION update_map2_updated_at_column();

-- Create or replace reliability calculation function
CREATE OR REPLACE FUNCTION calculate_map2_marker_reliability(
  created_at timestamptz,
  last_confirmed timestamptz,
  negative_confirmations integer DEFAULT 0
)
RETURNS float AS $$
DECLARE
  base_reliability float;
  time_penalty float;
  negative_penalty float;
  hours_since_creation float;
  hours_since_confirmation float;
BEGIN
  -- Calculate hours elapsed
  hours_since_creation := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) / 3600;
  hours_since_confirmation := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_confirmed)) / 3600;
  
  -- Base reliability calculation (linear decay over 4 hours)
  base_reliability := GREATEST(0.2, 1.0 - (hours_since_creation / 4.0) * 0.8);
  
  -- Time penalty based on last confirmation
  time_penalty := LEAST(0.5, hours_since_confirmation / 8.0);
  
  -- Negative confirmation penalty
  negative_penalty := LEAST(0.8, negative_confirmations * 0.1);
  
  -- Calculate final reliability score
  RETURN GREATEST(0.2, base_reliability - time_penalty - negative_penalty);
END;
$$ LANGUAGE plpgsql;