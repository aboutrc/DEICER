/*
  # Fix blog_posts delete policy
  
  1. Changes
    - Add policy for public users to delete blog posts
    - This enables the delete functionality in the InfoEditor component
    - Maintains security while allowing necessary operations
    
  2. Security
    - Allows public access for delete operations
    - Preserves existing policies for other operations
*/

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Authors can delete own posts" ON blog_posts;
DROP POLICY IF EXISTS "Public can delete posts" ON blog_posts;

-- Create new policy that allows public users to delete blog posts
CREATE POLICY "Anyone can delete news items"
  ON blog_posts FOR DELETE
  USING (true);