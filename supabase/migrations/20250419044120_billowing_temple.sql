/*
  # Add test user account
  
  1. Changes
    - Create test user with known credentials
    - Add corresponding profile
    - Set up proper permissions
*/

-- Create test user with known password
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'test@example.com',
  crypt('Om3praz0l3!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false
)
ON CONFLICT (id) DO NOTHING;

-- Create corresponding profile
INSERT INTO public.profiles (
  id,
  username,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'test_user',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;