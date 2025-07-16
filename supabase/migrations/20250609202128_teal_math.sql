/*
  # Create automated ledger entries for completed orders

  1. Trigger Function
    - Creates ledger entries when orders are marked as 'Delivered'
    - Automatically calculates revenue for vendors
    - Links transactions to correct order and business

  2. Security
    - Only triggers on order completion
    - Prevents duplicate entries
    - Maintains data integrity
*/

-- Create the trigger function
CREATE OR REPLACE FUNCTION create_ledger_entries_on_order_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create ledger entry when order status changes to 'Delivered'
  IF NEW.order_status = 'Delivered' AND OLD.order_status != 'Delivered' THEN
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS orders_create_ledger_entries ON orders;
CREATE TRIGGER orders_create_ledger_entries
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_ledger_entries_on_order_completion();