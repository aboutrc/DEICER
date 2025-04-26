/*
  # Create rights_sections table with policy existence checks
  
  1. New Table
    - `rights_sections`
      - `id` (uuid, primary key)
      - `title` (jsonb, contains en/es titles)
      - `content` (jsonb, contains en/es content arrays)
      - `order` (integer, for sorting)
      - `is_case_law` (boolean, for special formatting)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
  2. Security
    - Enable RLS
    - Add policies with existence checks
*/

-- Create rights_sections table if it doesn't exist
CREATE TABLE IF NOT EXISTS rights_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title jsonb NOT NULL,
  content jsonb NOT NULL,
  "order" integer NOT NULL,
  is_case_law boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'rights_sections' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE rights_sections ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies with existence checks
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'rights_sections' 
    AND policyname = 'Anyone can read rights sections'
  ) THEN
    CREATE POLICY "Anyone can read rights sections"
      ON rights_sections FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'rights_sections' 
    AND policyname = 'Authenticated users can modify rights sections'
  ) THEN
    CREATE POLICY "Authenticated users can modify rights sections"
      ON rights_sections FOR ALL
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rights_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_rights_sections_updated_at ON rights_sections;
CREATE TRIGGER update_rights_sections_updated_at
  BEFORE UPDATE ON rights_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_rights_sections_updated_at();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_rights_sections_order ON rights_sections("order");

-- Grant necessary permissions
GRANT ALL ON rights_sections TO authenticated;