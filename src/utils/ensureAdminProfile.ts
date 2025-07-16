import { supabase } from '../lib/supabase';

export async function ensureAdminProfile() {
  try {
    console.log('Ensuring admin profile exists...');
    
    // Check if admin user exists in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('Cannot check auth users (requires service role), skipping admin check');
      return;
    }
    
    const adminUser = authUser.users.find(user => user.email === 'ernest@hundo.co.za');
    
    if (!adminUser) {
      console.log('Admin user not found in auth.users');
      return;
    }
    
    // Upsert admin profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: adminUser.id,
        full_name: 'Ernest Administrator',
        email: 'ernest@hundo.co.za',
        phone_number: '+27 11 123 4567',
        role: 'Admin',
        is_active: true,
        popia_consent_timestamp: new Date().toISOString()
      }, {
        onConflict: 'id'
      });
    
    if (profileError) {
      console.error('Error upserting admin profile:', profileError);
    } else {
      console.log('Admin profile ensured successfully');
    }
    
  } catch (error) {
    console.error('Error ensuring admin profile:', error);
    // Don't throw - this is not critical for app startup
  }
}