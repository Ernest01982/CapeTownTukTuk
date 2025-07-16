# Administrator Account Creation Guide

## Creating the Administrator Account

Since I cannot directly access your Supabase database or send emails, you'll need to create the administrator account through one of these methods:

### Method 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to Authentication > Users
   - Click "Add User"

2. **Create the user with these details:**
   - Email: `ernest@hundo.co.za`
   - Password: `password`
   - Email Confirm: `true` (to skip email verification)

3. **Set the user profile:**
   - After user creation, go to Table Editor > profiles
   - Find the new user record and update:
     - `role`: `'Admin'`
     - `full_name`: `'Ernest Administrator'`
     - `is_active`: `true`
     - `popia_consent_timestamp`: current timestamp

### Method 2: Using SQL Commands

Execute these SQL commands in your Supabase SQL Editor:

```sql
-- Insert user into auth.users (this requires admin privileges)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_confirm_token_sent_at
) VALUES (
  gen_random_uuid(),
  'ernest@hundo.co.za',
  crypt('password', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  now()
);

-- Get the user ID (replace with actual ID from above)
-- Then insert into profiles table
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

### Method 3: Using the Registration Form

1. Go to `/register` on your application
2. Choose "I'm a Customer" (we'll change the role after)
3. Fill in the form with:
   - Full Name: Ernest Administrator
   - Email: ernest@hundo.co.za
   - Password: password
   - Phone: +27 11 123 4567
4. After registration, manually update the role in the database:

```sql
UPDATE profiles 
SET role = 'Admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'ernest@hundo.co.za');
```

## Password Requirements Implementation

To implement the password requirements you specified, you'll need to add password validation. Here's the implementation:

### Frontend Validation (already partially implemented)
The registration forms already have basic password validation. To enhance it:

```javascript
const validatePassword = (password) => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength) {
    return 'Password must be at least 8 characters long';
  }
  if (!hasUppercase) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!hasLowercase) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!hasNumbers) {
    return 'Password must contain at least one number';
  }
  if (!hasSpecialChar) {
    return 'Password must contain at least one special character';
  }
  return null;
};
```

### Backend Validation (Supabase Edge Function)
Create a password policy in Supabase:

```sql
-- Add password policy (if supported by your Supabase version)
ALTER ROLE authenticator SET password_encryption TO 'scram-sha-256';
```

## Mandatory Password Change Implementation

To force password change on first login, you can:

1. **Add a field to track first login:**

```sql
ALTER TABLE profiles ADD COLUMN must_change_password BOOLEAN DEFAULT false;

-- Set this to true for the admin account
UPDATE profiles 
SET must_change_password = true 
WHERE id = (SELECT id FROM auth.users WHERE email = 'ernest@hundo.co.za');
```

2. **Check in your authentication flow:**
   - After successful login, check the `must_change_password` flag
   - If true, redirect to a password change page
   - Only allow access to other parts of the app after password change

## Email Notification Setup

To send email notifications, you'll need to:

1. **Configure Supabase Auth emails:**
   - Go to Authentication > Settings in Supabase Dashboard
   - Configure SMTP settings or use Supabase's built-in email service

2. **Send welcome email manually or via trigger:**

```sql
-- Example trigger to send notification (requires email service setup)
CREATE OR REPLACE FUNCTION notify_admin_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- This would integrate with your email service
  -- For now, you can manually send the email
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_creation_notification
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.role = 'Admin')
  EXECUTE FUNCTION notify_admin_creation();
```

## Audit Trail Implementation

Add audit logging for account creation:

```sql
-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Admin'
    )
  );

-- Log the admin account creation
INSERT INTO audit_log (user_id, action, details) VALUES (
  (SELECT id FROM auth.users WHERE email = 'ernest@hundo.co.za'),
  'ADMIN_ACCOUNT_CREATED',
  jsonb_build_object(
    'email', 'ernest@hundo.co.za',
    'created_by', 'system',
    'initial_password_set', true,
    'must_change_password', true
  )
);
```

## Verification Steps

After creating the account, verify:

1. ✅ User can log in with ernest@hundo.co.za / password
2. ✅ User has Admin role and can access Admin Dashboard
3. ✅ User can see vendor approvals and accounting sections
4. ✅ Password change is enforced (if implemented)
5. ✅ Audit trail entry exists

## Security Notes

- The initial password "password" is intentionally weak for setup purposes
- Ensure the user changes it immediately upon first login
- Consider implementing 2FA for admin accounts
- Regularly audit admin account activities
- Use strong passwords and consider password managers

## Next Steps

1. Create the account using one of the methods above
2. Test login functionality
3. Verify admin permissions
4. Implement password change enforcement
5. Set up email notifications
6. Configure audit logging