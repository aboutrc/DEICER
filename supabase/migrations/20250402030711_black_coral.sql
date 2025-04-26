/*
  # Clean recordings data
  
  1. Changes
    - Clear all recordings from the recordings table
    - Remove all objects from recordings storage bucket
    
  2. Notes
    - Safe to run multiple times
    - Preserves table structure
*/

-- Truncate recordings table
TRUNCATE TABLE recordings CASCADE;

-- Delete all objects in recordings bucket
DELETE FROM storage.objects 
WHERE bucket_id = 'recordings';