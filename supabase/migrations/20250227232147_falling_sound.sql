/*
  # Create rights_sections table

  1. New Tables
    - `rights_sections`
      - `id` (uuid, primary key)
      - `title` (jsonb, contains en/es titles)
      - `content` (jsonb, contains en/es content arrays)
      - `order` (integer, for sorting)
      - `is_case_law` (boolean, for special formatting)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `rights_sections` table
    - Add policy for public to read rights sections
    - Add policy for authenticated users to modify rights sections
*/

-- Create rights_sections table
CREATE TABLE IF NOT EXISTS rights_sections (
  id uuid PRIMARY KEY,
  title jsonb NOT NULL,
  content jsonb NOT NULL,
  "order" integer NOT NULL,
  is_case_law boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE rights_sections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read rights sections"
  ON rights_sections FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can modify rights sections"
  ON rights_sections FOR ALL
  USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rights_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_rights_sections_updated_at
  BEFORE UPDATE ON rights_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_rights_sections_updated_at();

-- Create indexes for performance
CREATE INDEX idx_rights_sections_order ON rights_sections("order");