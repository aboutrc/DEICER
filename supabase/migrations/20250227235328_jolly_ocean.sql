-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can read rights sections" ON rights_sections;
  DROP POLICY IF EXISTS "Authenticated users can modify rights sections" ON rights_sections;
END $$;

-- Create policies with proper checks
CREATE POLICY "Anyone can read rights sections"
  ON rights_sections FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can modify rights sections"
  ON rights_sections FOR ALL
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp if it doesn't exist
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

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_rights_sections_order ON rights_sections("order");

-- Grant necessary permissions
GRANT ALL ON rights_sections TO authenticated;