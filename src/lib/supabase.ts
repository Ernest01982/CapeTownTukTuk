import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,    // Enable auto refresh to keep sessions alive
    persistSession: true,      // Persist sessions across page refreshes
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
});

// Types based on our database schema
export interface Profile {
  id: string;
  full_name: string;
  phone_number: string | null;
  role: 'Customer' | 'Vendor' | 'Driver' | 'Admin';
  is_active: boolean;
  popia_consent_timestamp: string | null;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string | null;
  address_text: string;
  contact_person_name: string | null;
  approval_status: 'Pending' | 'Approved' | 'Rejected';
  bank_account_details: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  business?: Business;
  category?: Category;
}

export interface Order {
  id: string;
  customer_id: string;
  business_id: string;
  driver_id: string | null;
  order_status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready_for_Pickup' | 'Out_for_Delivery' | 'Delivered' | 'Cancelled';
  delivery_address_text: string;
  order_total_amount: number;
  payment_method: 'COD' | 'Card' | 'EFT' | 'Digital_Wallet';
  delivery_confirmation_code: string;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
  business?: Business;
  customer?: Profile;
  driver?: Profile;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  created_at: string;
  product?: Product;
}

export interface AccountingLedger {
  id: string;
  order_id: string | null;
  business_id: string | null;
  transaction_type: 'SaleRevenue' | 'VendorPayout' | 'PlatformFee' | 'DeliveryFee' | 'Refund';
  amount: number;
  payout_status: 'Owed' | 'Processing' | 'Paid' | 'Failed';
  created_at: string;
  updated_at: string;
}