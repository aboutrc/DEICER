/*
  # Fix blog_posts RLS policies
  
  1. Changes
    - Drop and recreate update policy for blog_posts
    - Allow authenticated users to update all blog posts
    - Fix permission issues with post reordering
    
  2. Security
    - Maintain existing select and insert policies
    - Ensure authenticated users can update posts
*/

-- Drop existing update policies
DROP POLICY IF EXISTS "Anyone can update blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can update posts" ON blog_posts;

-- Create new update policy
CREATE POLICY "Authenticated users can update posts"
ON blog_posts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Note: We don't recreate the select and insert policies
-- because they already exist in the database