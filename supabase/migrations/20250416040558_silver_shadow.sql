/*
  # Create audio_cache table with policy existence checks
  
  1. New Table
    - `audio_cache`
      - `id` (uuid, primary key)
      - `text` (text, unique)
      - `audio_data` (text)
      - `created_at` (timestamptz)
      - `last_accessed` (timestamptz)
      - `access_count` (integer)
    
  2. Security
    - Enable RLS
    - Add policies with existence checks
*/

-- Create audio_cache table if it doesn't exist
CREATE TABLE IF NOT EXISTS audio_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text UNIQUE NOT NULL,
  audio_data text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_accessed timestamptz DEFAULT now(),
  access_count integer DEFAULT 1,
  CONSTRAINT text_not_empty CHECK (length(trim(text)) > 0),
  CONSTRAINT text_max_length CHECK (length(text) <= 10000),
  CONSTRAINT audio_data_not_empty CHECK (length(audio_data) > 0)
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

-- Create policies with existence checks
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

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audio_cache' 
    AND policyname = 'Public can insert into audio cache'
  ) THEN
    CREATE POLICY "Public can insert into audio cache"
      ON audio_cache FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audio_cache' 
    AND policyname = 'Public can update audio cache'
  ) THEN
    CREATE POLICY "Public can update audio cache"
      ON audio_cache FOR UPDATE
      TO public
      USING (true);
  END IF;
END $$;

-- Grant necessary permissions to public roles
GRANT ALL ON audio_cache TO anon, authenticated;