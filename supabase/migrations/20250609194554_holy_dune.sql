/*
  # Create accounting ledger table for financial tracking

  1. New Tables
    - `accounting_ledger`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders.id)
      - `business_id` (uuid, references businesses.id)
      - `transaction_type` (text, not null)
      - `amount` (decimal, not null)
      - `payout_status` (text, default 'Owed')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `accounting_ledger` table
    - Add policies for vendors and admins
*/

-- Create transaction type enum
CREATE TYPE transaction_type AS ENUM (
  'SaleRevenue',
  'VendorPayout',
  'PlatformFee',
  'DeliveryFee',
  'Refund'
);

-- Create payout status enum
CREATE TYPE payout_status AS ENUM ('Owed', 'Processing', 'Paid', 'Failed');

-- Create accounting_ledger table
CREATE TABLE IF NOT EXISTS accounting_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  business_id uuid REFERENCES businesses(id),
  transaction_type transaction_type NOT NULL,
  amount decimal(10,2) NOT NULL,
  payout_status payout_status DEFAULT 'Owed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS accounting_ledger_order_id_idx ON accounting_ledger(order_id);
CREATE INDEX IF NOT EXISTS accounting_ledger_business_id_idx ON accounting_ledger(business_id);
CREATE INDEX IF NOT EXISTS accounting_ledger_transaction_type_idx ON accounting_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS accounting_ledger_payout_status_idx ON accounting_ledger(payout_status);

-- Enable RLS
ALTER TABLE accounting_ledger ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Vendors can view own ledger entries"
  ON accounting_ledger
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE id = accounting_ledger.business_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all ledger entries"
  ON accounting_ledger
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Only admins can insert ledger entries"
  ON accounting_ledger
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Only admins can update ledger entries"
  ON accounting_ledger
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER accounting_ledger_updated_at
  BEFORE UPDATE ON accounting_ledger
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create function to automatically create ledger entries when orders are completed
CREATE OR REPLACE FUNCTION create_ledger_entries_on_order_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create entries when order status changes to 'Delivered'
  IF NEW.order_status = 'Delivered' AND OLD.order_status != 'Delivered' THEN
    -- Create sale revenue entry
    INSERT INTO accounting_ledger (
      order_id,
      business_id,
      transaction_type,
      amount,
      payout_status
    ) VALUES (
      NEW.id,
      NEW.business_id,
      'SaleRevenue',
      NEW.order_total_amount,
      'Owed'
    );
    
    -- Create platform fee entry (10% of order total)
    INSERT INTO accounting_ledger (
      order_id,
      business_id,
      transaction_type,
      amount,
      payout_status
    ) VALUES (
      NEW.id,
      NEW.business_id,
      'PlatformFee',
      NEW.order_total_amount * 0.10,
      'Paid'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic ledger entry creation
CREATE TRIGGER orders_create_ledger_entries
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_ledger_entries_on_order_completion();