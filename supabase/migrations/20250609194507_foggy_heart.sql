/*
  # Create categories table for product categorization

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, not null, unique)
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `categories` table
    - Add policies for public read access
    - Add policy for admins to manage categories
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Categories are viewable by everyone"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Only admins can update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insert default categories
INSERT INTO categories (name, description) VALUES
  ('Food & Beverages', 'Restaurant meals, drinks, and food items'),
  ('Groceries', 'Fresh produce, packaged foods, and household items'),
  ('Pharmacy', 'Medicines, health products, and medical supplies'),
  ('Electronics', 'Mobile phones, accessories, and small electronics'),
  ('Fashion', 'Clothing, shoes, and accessories'),
  ('Books & Stationery', 'Books, notebooks, and office supplies'),
  ('Home & Garden', 'Home decor, plants, and household tools'),
  ('Other', 'Miscellaneous items and services')
ON CONFLICT (name) DO NOTHING;