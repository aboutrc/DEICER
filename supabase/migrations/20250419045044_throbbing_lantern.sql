/*
  # Create user rc@aboutrc.com
  
  1. Changes
    - Create user with email rc@aboutrc.com
    - Set up corresponding profile
    - Enable email confirmation
    
  2. Security
    - Password is securely hashed
    - User has authenticated role
*/

-- Create user with email rc@aboutrc.com
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  invited_at
)
SELECT
  '11111111-1111-1111-1111-111111111111'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'rc@aboutrc.com',
  crypt('Om3praz0l3!', gen_salt('bf')),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false,
  now(),
  now(),
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'rc@aboutrc.com'
);

-- Create corresponding profile
INSERT INTO public.profiles (
  id,
  username,
  created_at,
  updated_at
)
SELECT
  '11111111-1111-1111-1111-111111111111'::uuid,
  'rc',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE username = 'rc'
);