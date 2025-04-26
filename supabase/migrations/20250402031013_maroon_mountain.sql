/*
  # Fix audio_cache table creation
  
  1. Changes
    - Create audio_cache table if it doesn't exist
    - Add proper constraints and indexes
    - Set up RLS policies
    
  2. Security
    - Enable RLS
    - Add policies for public access
*/

-- Create audio_cache table if it doesn't exist
CREATE TABLE IF NOT EXISTS audio_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text UNIQUE NOT NULL,
  audio_data bytea NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_accessed timestamptz DEFAULT now(),
  access_count integer DEFAULT 1,
  CONSTRAINT text_not_empty CHECK (length(trim(text)) > 0)
);

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'audio_cache' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE audio_cache ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policy for public read access if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audio_cache' 
    AND policyname = 'Public can read audio cache'
  ) THEN
    CREATE POLICY "Public can read audio cache"
      ON audio_cache FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Create index for text lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_audio_cache_text ON audio_cache(text);

-- Create function to update last_accessed and access_count if it doesn't exist
CREATE OR REPLACE FUNCTION update_audio_cache_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed = now();
  NEW.access_count = OLD.access_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updates if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_audio_cache_access_trigger'
  ) THEN
    CREATE TRIGGER update_audio_cache_access_trigger
      BEFORE UPDATE ON audio_cache
      FOR EACH ROW
      EXECUTE FUNCTION update_audio_cache_access();
  END IF;
END $$;