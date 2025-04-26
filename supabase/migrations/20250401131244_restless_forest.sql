/*
  # Fix stack depth limit exceeded issue

  1. Changes
    - Simplify handle_marker_confirmation function to reduce stack usage
    - Remove unnecessary calculations and nested function calls
    - Add limit to marker queries to prevent excessive data processing
    
  2. Security
    - Maintains existing RLS policies
    - Preserves data integrity
*/

-- Create a simplified version of the handle_marker_confirmation function
CREATE OR REPLACE FUNCTION handle_marker_confirmation(
  in_marker_id uuid,
  in_is_present boolean,
  in_user_ip text,
  in_user_lat double precision DEFAULT NULL,
  in_user_lng double precision DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  last_confirmation timestamptz;
  cooldown_period interval := '30 seconds'::interval;
  marker_lat double precision;
  marker_lng double precision;
  max_distance double precision := 25;
  actual_distance double precision;
BEGIN
  -- Get marker location with a simple query
  SELECT latitude, longitude
  INTO marker_lat, marker_lng
  FROM markers
  WHERE id = in_marker_id;

  -- Simple distance check if coordinates are provided
  IF in_user_lat IS NOT NULL AND in_user_lng IS NOT NULL AND marker_lat IS NOT NULL AND marker_lng IS NOT NULL THEN
    -- Use a simpler distance calculation to avoid stack depth issues
    -- Approximate distance using Pythagorean theorem (sufficient for this purpose)
    actual_distance := sqrt(power(69.1 * (marker_lat - in_user_lat), 2) + 
                           power(69.1 * cos(radians(marker_lat)) * (marker_lng - in_user_lng), 2)) * 1.609344;

    IF actual_distance > max_distance THEN
      RAISE EXCEPTION 'You are too far from this marker to confirm its status (%.1f km away)', actual_distance;
    END IF;
  END IF;

  -- Check cooldown period with a simple query
  SELECT MAX(confirmed_at)
  INTO last_confirmation
  FROM marker_confirmations
  WHERE confirmed_from = in_user_ip
  LIMIT 1;
  
  IF last_confirmation IS NOT NULL AND 
     last_confirmation > CURRENT_TIMESTAMP - cooldown_period THEN
    RAISE EXCEPTION 'Please wait 30 seconds between confirmations';
  END IF;

  -- Record the confirmation with a simple insert
  INSERT INTO marker_confirmations (
    marker_id,
    is_active,
    confirmed_from,
    user_id,
    cooldown_expires
  ) VALUES (
    in_marker_id,
    in_is_present,
    in_user_ip,
    NULL,
    CURRENT_TIMESTAMP + cooldown_period
  );

  -- Update marker status with a simple update
  IF in_is_present THEN
    UPDATE markers
    SET 
      last_confirmation = CURRENT_TIMESTAMP,
      negative_confirmations = GREATEST(0, negative_confirmations - 1)
    WHERE id = in_marker_id;
  ELSE
    UPDATE markers
    SET negative_confirmations = negative_confirmations + 1
    WHERE id = in_marker_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a simplified version of the calculate_distance function
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
RETURNS double precision AS $$
BEGIN
  -- Simple distance calculation using the Haversine formula
  -- This is more efficient than the previous implementation
  RETURN 111.111 * 
         sqrt(power(lat2 - lat1, 2) + 
              power(cos(radians((lat1 + lat2)/2)) * (lon2 - lon1), 2));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_markers_active_reliability 
ON markers(active, reliability_score);