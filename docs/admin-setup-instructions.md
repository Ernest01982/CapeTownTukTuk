# Admin Account Setup Instructions

## Quick Setup for Testing

The easiest way to test the admin functionality is to use the demo admin account that should already be set up:

**Admin Login:**
- Email: `ernest@hundo.co.za`
- Password: `password`

## If Admin Account Doesn't Exist

If the admin account doesn't exist or you need to create a new one, follow these steps:

### Method 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to Authentication > Users
   - Click "Add User"

2. **Create the user:**
   - Email: `ernest@hundo.co.za`
   - Password: `password`
   - Email Confirm: `true` (to skip email verification)

3. **Set the user profile:**
   - Go to Table Editor > profiles
   - Find the new user record and update:
     - `role`: `'Admin'`
     - `full_name`: `'Ernest Administrator'`
     - `is_active`: `true`

### Method 2: Using SQL Commands

Execute these SQL commands in your Supabase SQL Editor:

```sql
-- First, create the auth user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'ernest@hundo.co.za',
  crypt('password', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Ernest Administrator", "phone_number": "+27 11 123 4567", "role": "Admin"}'
);

-- Then create the profile
INSERT INTO profiles (
  id,
  full_name,
  phone_number,
  role,
  is_active,
  popia_consent_timestamp,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'ernest@hundo.co.za'),
  'Ernest Administrator',
  '+27 11 123 4567',
  'Admin',
  true,
  now(),
  now(),
  now()
);
```

### Method 3: Update Existing User

If you have an existing user that you want to make an admin:

```sql
-- Update an existing user's role to Admin
UPDATE profiles 
SET role = 'Admin', full_name = 'Ernest Administrator'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

## Verification Steps

After creating the admin account:

1. ✅ Sign in with `ernest@hundo.co.za` / `password`
2. ✅ Check that you're redirected to `/admin`
3. ✅ Verify you can see the Admin Dashboard with tabs:
   - Overview
   - Vendor Approvals
   - All Businesses
   - User Management
   - Accounting
   - Analytics
4. ✅ Test the vendor approval functionality
5. ✅ Check the accounting/payouts section

## Troubleshooting

**If you can't see the admin dashboard:**
1. Check that the user's role is exactly `'Admin'` (case-sensitive)
2. Make sure `is_active` is `true`
3. Clear browser cache and try again
4. Check browser console for any errors

**If routing doesn't work:**
1. Try navigating directly to `/admin`
2. Check that the AuthGuard is working properly
3. Verify the user profile is loading correctly

## Demo Data

To test the admin functionality properly, you might want to create some demo data:

```sql
-- Create demo categories
INSERT INTO categories (name, description) VALUES 
('Food', 'Restaurant and food items'),
('Grocery', 'Grocery and household items'),
('Pharmacy', 'Medical and health products');

-- Create demo businesses (these will be pending approval)
INSERT INTO businesses (user_id, business_name, business_description, address_text, approval_status) VALUES 
((SELECT id FROM profiles WHERE role = 'Vendor' LIMIT 1), 'Demo Restaurant', 'Great local food', '123 Main St, Cape Town', 'Pending'),
((SELECT id FROM profiles WHERE role = 'Vendor' LIMIT 1), 'Corner Store', 'Convenience store', '456 Oak Ave, Cape Town', 'Pending');
```

This will give you some businesses to approve and test the admin functionality.