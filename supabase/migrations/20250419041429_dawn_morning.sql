/*
  # Update blog_posts RLS policies

  1. Changes
    - Drop existing RLS policies for blog_posts table
    - Create new policies that properly handle all CRUD operations
    - Ensure authenticated users can create and manage posts
    - Allow public access to published posts only

  2. Security
    - Enable RLS on blog_posts table
    - Add policies for:
      - Public read access to published posts
      - Authenticated users can create posts
      - Authors can update their own posts
      - Authors can delete their own posts
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view published posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON blog_posts;
DROP POLICY IF EXISTS "Authors can update their own posts" ON blog_posts;

-- Create new policies
CREATE POLICY "Public can view published posts"
ON blog_posts
FOR SELECT
TO public
USING (published_at IS NOT NULL);

CREATE POLICY "Authenticated users can create posts"
ON blog_posts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id
);

CREATE POLICY "Authors can update own posts"
ON blog_posts
FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
ON blog_posts
FOR DELETE
TO authenticated
USING (auth.uid() = author_id);