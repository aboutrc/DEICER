-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can modify rights sections" ON rights_sections;

-- Create correct policy for authenticated users
CREATE POLICY "Authenticated users can modify rights sections"
  ON rights_sections FOR ALL
  TO authenticated
  USING (true);

-- Grant necessary permissions
GRANT ALL ON rights_sections TO authenticated;