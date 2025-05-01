/*
  # Fix blog_posts RLS policies for reordering

  1. Changes
    - Update RLS policies to allow authenticated users to update all blog posts
    - This enables reordering functionality in the InfoEditor component
    - Maintains security while allowing necessary operations
    
  2. Security
    - Maintains authentication for sensitive operations
    - Allows authenticated users to update posts regardless of author
*/

-- Drop existing update policies if they exist
DROP POLICY IF EXISTS "Authors can update own posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can update posts" ON blog_posts;
DROP POLICY IF EXISTS "Anyone can update blog posts" ON blog_posts;

-- Create new policy that allows authenticated users to update any blog post
CREATE POLICY "Authenticated users can update posts"
  ON blog_posts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);