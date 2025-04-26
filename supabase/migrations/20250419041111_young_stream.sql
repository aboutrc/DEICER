/*
  # Create blog posts table
  
  1. New Table
    - `blog_posts`
      - `id` (uuid, primary key)
      - `title` (jsonb, contains multilingual titles)
      - `content` (jsonb, contains multilingual content)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `published_at` (timestamp)
      - `author_id` (uuid, references profiles)
      
  2. Security
    - Enable RLS
    - Add policies for public read access
    - Add policies for authenticated users to create/edit posts
*/

CREATE TABLE blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title jsonb NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Ensure title and content have proper structure
  CONSTRAINT title_format CHECK (
    jsonb_typeof(title->'en') = 'string' AND
    jsonb_typeof(title->'es') = 'string' AND
    jsonb_typeof(title->'zh') = 'string' AND
    jsonb_typeof(title->'hi') = 'string' AND
    jsonb_typeof(title->'ar') = 'string'
  ),
  CONSTRAINT content_format CHECK (
    jsonb_typeof(content->'en') = 'string' AND
    jsonb_typeof(content->'es') = 'string' AND
    jsonb_typeof(content->'zh') = 'string' AND
    jsonb_typeof(content->'hi') = 'string' AND
    jsonb_typeof(content->'ar') = 'string'
  )
);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view published posts"
  ON blog_posts FOR SELECT
  USING (published_at IS NOT NULL);

CREATE POLICY "Authenticated users can create posts"
  ON blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts"
  ON blog_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Create indexes
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_author_id ON blog_posts(author_id);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();