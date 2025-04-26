/*
  # Create markers table with unique function name
  
  1. Changes
    - Create markers table with constraints
    - Add indexes for performance
    - Enable RLS
    - Add policies for access control
    - Drop ALL versions of marker confirmation function
    - Create marker confirmation function with unique signature
    
  2. Security
    - Enable RLS
    - Add policies for public access
*/

-- Drop ALL existing versions of the function
DROP FUNCTION IF EXISTS public.handle_marker_confirmation(uuid, boolean, text);
DROP FUNCTION IF EXISTS public.handle_marker_confirmation(uuid, boolean, text, double precision);
DROP FUNCTION IF EXISTS public.handle_marker_confirmation(uuid, boolean, text, double precision, double precision);

-- Create markers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.markers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  active boolean DEFAULT true,
  last_confirmed timestamptz DEFAULT now(),
  confirmations_count integer DEFAULT 0,
  last_status_change timestamptz DEFAULT now(),
  reliability_score double precision DEFAULT 1.0,
  negative_confirmations integer DEFAULT 0,
  
  -- Constraints
  CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180),
  CONSTRAINT valid_category CHECK (category IN ('ice', 'police'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_markers_coordinates ON public.markers (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_markers_last_confirmed ON public.markers (last_confirmed);

-- Enable RLS
ALTER TABLE public.markers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view markers" ON public.markers;
DROP POLICY IF EXISTS "Users can create markers" ON public.markers;
DROP POLICY IF EXISTS "Users can update own markers" ON public.markers;
DROP POLICY IF EXISTS "Users can delete own markers" ON public.markers;

-- Create policies
CREATE POLICY "Anyone can view markers"
  ON public.markers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create markers"
  ON public.markers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own markers"
  ON public.markers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own markers"
  ON public.markers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create marker confirmation function with full signature
CREATE OR REPLACE FUNCTION public.handle_marker_confirmation(
  in_marker_id uuid,
  in_is_present boolean,
  in_user_ip text,
  in_user_lat double precision,
  in_user_lng double precision
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  marker_lat double precision;
  marker_lng double precision;
  distance_km double precision;
BEGIN
  -- Get marker coordinates
  SELECT latitude, longitude INTO marker_lat, marker_lng
  FROM public.markers
  WHERE id = in_marker_id;

  -- Calculate distance between user and marker (approximate using Euclidean distance)
  distance_km := sqrt(power(marker_lat - in_user_lat, 2) + power(marker_lng - in_user_lng, 2)) * 111;

  -- Check if user is within 1km of marker
  IF distance_km > 1 THEN
    RAISE EXCEPTION 'User is too far from marker (%.2f km)', distance_km;
  END IF;

  -- Update marker based on confirmation
  IF in_is_present THEN
    UPDATE public.markers
    SET 
      last_confirmed = now(),
      confirmations_count = confirmations_count + 1,
      active = true,
      reliability_score = LEAST(1.0, reliability_score + 0.1)
    WHERE id = in_marker_id;
  ELSE
    UPDATE public.markers
    SET 
      negative_confirmations = negative_confirmations + 1,
      reliability_score = GREATEST(0.0, reliability_score - 0.1),
      active = false
    WHERE id = in_marker_id;
  END IF;
END;
$$;

-- Grant necessary permissions
GRANT ALL ON public.markers TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_marker_confirmation(uuid, boolean, text, double precision, double precision) TO authenticated;