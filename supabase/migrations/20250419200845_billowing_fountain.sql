/*
  # Update blog posts table to support multilingual content
  
  1. Changes
    - Convert title and content columns to JSONB to support multiple languages
    - Add validation for required language fields (en, es)
    - Preserve existing data by converting to JSONB format
    
  2. Security
    - Maintain existing RLS policies
*/

-- First create temporary columns
ALTER TABLE blog_posts 
ADD COLUMN title_jsonb jsonb,
ADD COLUMN content_jsonb jsonb;

-- Convert existing text data to JSONB format
UPDATE blog_posts
SET 
  title_jsonb = jsonb_build_object(
    'en', title,
    'es', title,
    'zh', title,
    'hi', title,
    'ar', title
  ),
  content_jsonb = jsonb_build_object(
    'en', content,
    'es', content,
    'zh', content,
    'hi', content,
    'ar', content
  );

-- Drop the old columns
ALTER TABLE blog_posts
DROP COLUMN title,
DROP COLUMN content;

-- Rename the new columns
ALTER TABLE blog_posts
RENAME COLUMN title_jsonb TO title;

ALTER TABLE blog_posts
RENAME COLUMN content_jsonb TO content;

-- Add constraints for JSONB structure
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