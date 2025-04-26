/*
  # Fix Map2 tables setup
  
  1. Changes
    - Drop and recreate map2_markers and confirmations tables
    - Update SELECT policy to allow viewing all markers
    - Add proper constraints and indexes
    
  2. Security
    - Enable RLS
    - Add policies for public access
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS map2_marker_confirmations CASCADE;
DROP TABLE IF EXISTS map2_markers CASCADE;

-- Create map2_markers table
CREATE TABLE map2_markers (
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
  reliability_score double precision DEFAULT 1.0,
  CONSTRAINT title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT description_not_empty CHECK (length(trim(description)) > 0),
  CONSTRAINT title_max_length CHECK (length(title) <= 200),
  CONSTRAINT description_max_length CHECK (length(description) <= 2000),
  CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180)
);

-- Create map2_marker_confirmations table
CREATE TABLE map2_marker_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marker_id uuid REFERENCES map2_markers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  confirmed_at timestamptz DEFAULT now(),
  is_active boolean NOT NULL,
  confirmed_from text
);

-- Enable RLS
ALTER TABLE map2_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE map2_marker_confirmations ENABLE ROW LEVEL SECURITY;

-- Create policies for map2_markers
CREATE POLICY "Anyone can view markers"
  ON map2_markers FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert markers"
  ON map2_markers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own markers"
  ON map2_markers FOR UPDATE
  USING (
    CASE 
      WHEN auth.uid() IS NOT NULL THEN user_id = auth.uid()
      ELSE false
    END
  );

-- Create policies for map2_marker_confirmations
CREATE POLICY "Anyone can view confirmations"
  ON map2_marker_confirmations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert confirmations"
  ON map2_marker_confirmations FOR INSERT
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_map2_markers_active ON map2_markers(active);
CREATE INDEX idx_map2_markers_coordinates ON map2_markers(latitude, longitude);
CREATE INDEX idx_map2_markers_category ON map2_markers(category);
CREATE INDEX idx_map2_markers_created_at ON map2_markers(created_at);
CREATE INDEX idx_map2_markers_last_confirmed ON map2_markers(last_confirmed);
CREATE INDEX idx_map2_markers_reliability ON map2_markers(reliability_score);
CREATE INDEX idx_map2_markers_user_id ON map2_markers(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX idx_map2_marker_confirmations_marker_id ON map2_marker_confirmations(marker_id);
CREATE INDEX idx_map2_marker_confirmations_confirmed_at ON map2_marker_confirmations(confirmed_at);
CREATE INDEX idx_map2_marker_confirmations_user_id ON map2_marker_confirmations(user_id) WHERE user_id IS NOT NULL;

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_map2_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_map2_markers_updated_at
  BEFORE UPDATE ON map2_markers
  FOR EACH ROW
  EXECUTE FUNCTION update_map2_updated_at_column();

-- Create function to calculate marker reliability
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