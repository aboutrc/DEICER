/*
  # Add order column to blog_posts
  
  1. Changes
    - Add order column to blog_posts table
    - Set initial order based on published_at
    - Add index for order column
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add order column if it doesn't exist
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS "order" integer;

-- Update order based on published_at
WITH ordered_posts AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST) - 1 as new_order
  FROM blog_posts
)
UPDATE blog_posts
SET "order" = ordered_posts.new_order
FROM ordered_posts
WHERE blog_posts.id = ordered_posts.id;

-- Make order column not null after setting initial values
ALTER TABLE blog_posts 
ALTER COLUMN "order" SET NOT NULL;

-- Create index for order column
CREATE INDEX IF NOT EXISTS idx_blog_posts_order 
ON blog_posts("order");