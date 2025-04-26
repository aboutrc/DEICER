/*
  # Update blog posts table and policies
  
  1. Changes
    - Drop existing policies
    - Add new policies for public access
    - Update constraints for multilingual support
    - Add indexes for performance
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view published posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON blog_posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON blog_posts;
DROP POLICY IF EXISTS "Authors can delete own posts" ON blog_posts;

-- Update constraints
ALTER TABLE blog_posts 
DROP CONSTRAINT IF EXISTS title_format,
DROP CONSTRAINT IF EXISTS content_format;

ALTER TABLE blog_posts 
ADD CONSTRAINT title_format CHECK (
  jsonb_typeof(title->'en') = 'string' AND
  jsonb_typeof(title->'es') = 'string' AND
  jsonb_typeof(title->'zh') = 'string' AND
  jsonb_typeof(title->'hi') = 'string' AND
  jsonb_typeof(title->'ar') = 'string'
),
ADD CONSTRAINT content_format CHECK (
  jsonb_typeof(content->'en') = 'string' AND
  jsonb_typeof(content->'es') = 'string' AND
  jsonb_typeof(content->'zh') = 'string' AND
  jsonb_typeof(content->'hi') = 'string' AND
  jsonb_typeof(content->'ar') = 'string'
);

-- Create new policies
CREATE POLICY "Public can view published posts"
  ON blog_posts FOR SELECT
  USING (published_at IS NOT NULL);

CREATE POLICY "Authenticated users can create posts"
  ON blog_posts FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authors can update own posts"
  ON blog_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
  ON blog_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);

-- Update trigger function
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();