/*
  # Create orders and order items tables for order management

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, references profiles.id)
      - `business_id` (uuid, references businesses.id)
      - `driver_id` (uuid, references profiles.id, nullable)
      - `order_status` (text, not null, default 'Pending')
      - `delivery_address_text` (text, not null)
      - `order_total_amount` (decimal, not null)
      - `payment_method` (text, default 'COD')
      - `delivery_confirmation_code` (varchar(4), not null)
      - `special_instructions` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders.id)
      - `product_id` (uuid, references products.id)
      - `quantity` (integer, not null)
      - `price_at_purchase` (decimal, not null)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for customers, vendors, and drivers
*/

-- Create order status type
CREATE TYPE order_status AS ENUM (
  'Pending', 
  'Confirmed', 
  'Preparing', 
  'Ready_for_Pickup', 
  'Out_for_Delivery', 
  'Delivered', 
  'Cancelled'
);

-- Create payment method type
CREATE TYPE payment_method AS ENUM ('COD', 'Card', 'EFT', 'Digital_Wallet');

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES profiles(id),
  business_id uuid NOT NULL REFERENCES businesses(id),
  driver_id uuid REFERENCES profiles(id),
  order_status order_status DEFAULT 'Pending',
  delivery_address_text text NOT NULL,
  order_total_amount decimal(10,2) NOT NULL CHECK (order_total_amount >= 0),
  payment_method payment_method DEFAULT 'COD',
  delivery_confirmation_code varchar(4) NOT NULL DEFAULT LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  special_instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  price_at_purchase decimal(10,2) NOT NULL CHECK (price_at_purchase >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON orders(customer_id);
CREATE INDEX IF NOT EXISTS orders_business_id_idx ON orders(business_id);
CREATE INDEX IF NOT EXISTS orders_driver_id_idx ON orders(driver_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(order_status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies for orders table
CREATE POLICY "Customers can view own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Vendors can view orders for their business"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE id = orders.business_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can view assigned orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    driver_id = auth.uid() OR
    (driver_id IS NULL AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Driver'
    ))
  );

CREATE POLICY "Customers can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Vendors can update orders for their business"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE id = orders.business_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can update assigned orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Admins can view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Policies for order_items table
CREATE POLICY "Order items follow order permissions"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_items.order_id AND (
        customer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM businesses
          WHERE id = orders.business_id AND user_id = auth.uid()
        ) OR
        driver_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'Admin'
        )
      )
    )
  );

CREATE POLICY "Customers can insert order items for own orders"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_items.order_id AND customer_id = auth.uid()
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();