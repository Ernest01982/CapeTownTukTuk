/*
  # Create businesses table for vendor management

  1. New Tables
    - `businesses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `business_name` (text, not null)
      - `business_description` (text)
      - `address_text` (text, not null)
      - `contact_person_name` (text)
      - `approval_status` (text, default 'Pending')
      - `bank_account_details` (text, encrypted)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `businesses` table
    - Add policies for vendors to manage their businesses
    - Add policy for admins to view all businesses
*/

-- Create approval status type
CREATE TYPE approval_status AS ENUM ('Pending', 'Approved', 'Rejected');

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_description text,
  address_text text NOT NULL,
  contact_person_name text,
  approval_status approval_status DEFAULT 'Pending',
  bank_account_details text, -- Encrypted bank details
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS businesses_user_id_idx ON businesses(user_id);
CREATE INDEX IF NOT EXISTS businesses_approval_status_idx ON businesses(approval_status);

-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Vendors can view own businesses"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Vendors can insert own businesses"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Vendor', 'Admin')
    )
  );

CREATE POLICY "Vendors can update own businesses"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Approved businesses visible to customers"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (approval_status = 'Approved');

-- Create trigger for updated_at
CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();