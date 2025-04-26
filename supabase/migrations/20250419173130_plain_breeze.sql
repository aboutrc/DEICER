/*
  # Update blog_posts table structure
  
  1. Changes
    - Change title and content columns to text instead of jsonb
    - Remove language-specific constraints
    - Keep existing data by extracting English content
    
  2. Security
    - Maintain existing RLS policies
*/

-- First create temporary columns
ALTER TABLE blog_posts
ADD COLUMN temp_title text,
ADD COLUMN temp_content text;

-- Extract English content from jsonb
UPDATE blog_posts
SET 
  temp_title = COALESCE(title->>'en', title->>'es', title->>'zh', title->>'hi', title->>'ar'),
  temp_content = COALESCE(content->>'en', content->>'es', content->>'zh', content->>'hi', content->>'ar');

-- Drop the old columns and constraints
ALTER TABLE blog_posts
DROP CONSTRAINT IF EXISTS title_format,
DROP CONSTRAINT IF EXISTS content_format,
DROP COLUMN title,
DROP COLUMN content;

-- Rename temporary columns
ALTER TABLE blog_posts
RENAME COLUMN temp_title TO title;

ALTER TABLE blog_posts
RENAME COLUMN temp_content TO content;

-- Make the new columns NOT NULL
ALTER TABLE blog_posts
ALTER COLUMN title SET NOT NULL,
ALTER COLUMN content SET NOT NULL;

-- Add text validation constraints
ALTER TABLE blog_posts
ADD CONSTRAINT title_not_empty CHECK (length(trim(title)) > 0),
ADD CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0);