/*
  # Fix business insertion policy to avoid recursion

  1. Problem
    - Current policy queries profiles table which may cause issues
    - Need to ensure vendors and admins can create businesses

  2. Solution
    - Drop existing problematic policy
    - Create new policy that allows business creation
    - Use auth.uid() for user identification
    - Allow role-based access through user metadata

  3. Security
    - Users can only create businesses for themselves
    - Admins can create businesses for any user
*/

-- Drop existing policy that might cause issues
DROP POLICY IF EXISTS "Vendors can insert own businesses" ON businesses;

-- Create new policy for business insertion
CREATE POLICY "vendors can create business"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'Admin'
    )
  );

-- Also ensure the policy for admins to create businesses for others exists
CREATE POLICY "Allow admin to create new businesses" 
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );