-- Create rights_sections table if it doesn't exist
CREATE TABLE IF NOT EXISTS rights_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title jsonb NOT NULL,
  content jsonb NOT NULL,
  "order" integer NOT NULL,
  is_case_law boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT title_format CHECK (
    jsonb_typeof(title->'en') = 'string' AND
    jsonb_typeof(title->'es') = 'string'
  ),
  CONSTRAINT content_format CHECK (
    jsonb_typeof(content->'en') = 'array' AND
    jsonb_typeof(content->'es') = 'array'
  )
);

-- Enable RLS
ALTER TABLE rights_sections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can read rights sections" ON rights_sections;
  DROP POLICY IF EXISTS "Authenticated users can modify rights sections" ON rights_sections;
END $$;

-- Create policies
CREATE POLICY "Anyone can read rights sections"
  ON rights_sections FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can modify rights sections"
  ON rights_sections FOR ALL
  TO authenticated
  USING (true);

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