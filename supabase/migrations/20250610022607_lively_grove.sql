/*
  # Fix admin profile and ensure proper setup

  1. Upsert admin profile
    - Ensure ernest@hundo.co.za has proper profile with Admin role
    - Handle case where user exists but profile is missing or incorrect

  2. Add email column to profiles table
    - Add email column for better user management
    - Update existing profiles with email from auth.users
*/

-- First, add email column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text;
  END IF;
END $$;

-- Upsert the admin profile
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'ernest@hundo.co.za';
    
    IF admin_user_id IS NOT NULL THEN
        -- Upsert the profile
        INSERT INTO public.profiles (id, full_name, role, email, phone_number, is_active, popia_consent_timestamp)
        VALUES (
            admin_user_id, 
            'Ernest Administrator', 
            'Admin', 
            'ernest@hundo.co.za',
            '+27 11 123 4567',
            true,
            now()
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'Admin',
            email = 'ernest@hundo.co.za',
            full_name = 'Ernest Administrator',
            is_active = true,
            updated_at = now();
            
        RAISE NOTICE 'Admin profile upserted successfully for user ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user ernest@hundo.co.za not found in auth.users';
    END IF;
END $$;

-- Update existing profiles with email from auth.users where email is missing
UPDATE profiles 
SET email = auth.users.email
FROM auth.users 
WHERE profiles.id = auth.users.id 
AND profiles.email IS NULL;