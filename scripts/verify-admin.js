import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need this for admin operations

if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.VITE_SUPABASE_ANON_KEY);

async function verifyAdminUser() {
  try {
    console.log('🔍 Checking admin user setup...');
    
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'Admin')
      .single();
    
    if (profileError) {
      console.error('❌ Error fetching admin profile:', profileError);
      return;
    }
    
    if (!profile) {
      console.error('❌ No admin profile found');
      return;
    }
    
    console.log('✅ Admin profile found:');
    console.log('   - ID:', profile.id);
    console.log('   - Name:', profile.full_name);
    console.log('   - Role:', profile.role);
    console.log('   - Active:', profile.is_active);
    console.log('   - Created:', profile.created_at);
    
    // Test authentication
    console.log('\n🔐 Testing admin login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ernest@hundo.co.za',
      password: 'password'
    });
    
    if (authError) {
      console.error('❌ Login failed:', authError.message);
      return;
    }
    
    console.log('✅ Login successful!');
    console.log('   - User ID:', authData.user.id);
    console.log('   - Email:', authData.user.email);
    
    // Sign out
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');
    
    console.log('\n🎉 Admin user is properly configured!');
    console.log('You can now login with:');
    console.log('   Email: ernest@hundo.co.za');
    console.log('   Password: password');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyAdminUser();