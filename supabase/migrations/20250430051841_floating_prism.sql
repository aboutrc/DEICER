/*
  # Create blog-images storage bucket
  
  1. New Storage Bucket
    - Create 'blog-images' bucket for storing blog post images
    - Enable public access for direct image embedding
    - Add proper RLS policies
    
  2. Security
    - Allow public read access to images
    - Restrict write access to authenticated users
*/

-- Create blog-images bucket if it doesn't exist
DO $$ 
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('blog-images', 'blog-images', true)
  ON CONFLICT (id) DO UPDATE
  SET public = true;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public Read Access for blog-images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Users Can Upload Images" ON storage.objects;
END $$;

-- Create storage policies
CREATE POLICY "Public Read Access for blog-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Authenticated Users Can Upload Images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blog-images' AND
  auth.role() = 'authenticated'
);

-- Enable RLS on objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;