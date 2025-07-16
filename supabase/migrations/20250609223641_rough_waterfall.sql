/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - Current admin policy queries profiles table from within profiles policy
    - This creates infinite recursion when fetching profiles

  2. Solution
    - Drop existing problematic policies
    - Create new policies that avoid self-referencing
    - Use auth.uid() directly for user access
    - Remove admin policy that causes recursion (admins can use direct database access)

  3. Security
    - Users can only read/update their own profiles
    - Insert policy allows profile creation for authenticated users
    - Removed recursive admin policy to prevent infinite loops
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Note: Admin access should be handled through service role or direct database access
-- to avoid recursion issues. The application can check user roles after fetching
-- the user's own profile.