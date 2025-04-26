/*
  # Debug migration for multilingual content
  
  1. Changes
    - Add proper JSONB type casting
    - Fix JSONB function calls
    - Add type checks before operations
*/

-- First, let's check the structure of the rights_sections table
DO $$ 
DECLARE
  section_count integer;
  first_section record;
  title_langs text[];
  content_langs text[];
BEGIN
  -- Get count of sections
  SELECT COUNT(*) INTO section_count FROM rights_sections;
  RAISE NOTICE 'Found % sections in rights_sections table', section_count;
  
  -- Get first section
  SELECT * INTO first_section FROM rights_sections ORDER BY "order" LIMIT 1;
  
  IF first_section IS NOT NULL THEN
    -- Check title languages
    SELECT ARRAY(
      SELECT jsonb_object_keys(first_section.title::jsonb)
    ) INTO title_langs;
    RAISE NOTICE 'First section title languages: %', title_langs;
    
    -- Check content languages
    SELECT ARRAY(
      SELECT jsonb_object_keys(first_section.content::jsonb)
    ) INTO content_langs;
    RAISE NOTICE 'First section content languages: %', content_langs;
    
    -- Check English content format
    IF first_section.content::jsonb ? 'en' THEN
      RAISE NOTICE 'English content type: %', jsonb_typeof(first_section.content::jsonb -> 'en');
      IF jsonb_typeof(first_section.content::jsonb -> 'en') = 'array' THEN
        RAISE NOTICE 'English content array length: %', jsonb_array_length(first_section.content::jsonb -> 'en');
      END IF;
    ELSE
      RAISE NOTICE 'No English content found';
    END IF;
  ELSE
    RAISE NOTICE 'No sections found in rights_sections table';
  END IF;
END $$;

-- Now check blog_posts table
DO $$ 
DECLARE
  post_count integer;
  first_post record;
  title_langs text[];
  content_langs text[];
BEGIN
  -- Get count of posts
  SELECT COUNT(*) INTO post_count FROM blog_posts;
  RAISE NOTICE 'Found % posts in blog_posts table', post_count;
  
  -- Get first post
  SELECT * INTO first_post FROM blog_posts ORDER BY "order" LIMIT 1;
  
  IF first_post IS NOT NULL THEN
    -- Check title languages
    SELECT ARRAY(
      SELECT jsonb_object_keys(first_post.title::jsonb)
    ) INTO title_langs;
    RAISE NOTICE 'First post title languages: %', title_langs;
    
    -- Check content languages
    SELECT ARRAY(
      SELECT jsonb_object_keys(first_post.content::jsonb)
    ) INTO content_langs;
    RAISE NOTICE 'First post content languages: %', content_langs;
    
    -- Check English content format
    IF first_post.content::jsonb ? 'en' THEN
      RAISE NOTICE 'English content type: %', jsonb_typeof(first_post.content::jsonb -> 'en');
      IF jsonb_typeof(first_post.content::jsonb -> 'en') = 'string' THEN
        RAISE NOTICE 'English content length: %', length(first_post.content::jsonb ->> 'en');
      END IF;
    ELSE
      RAISE NOTICE 'No English content found';
    END IF;
  ELSE
    RAISE NOTICE 'No posts found in blog_posts table';
  END IF;
END $$;