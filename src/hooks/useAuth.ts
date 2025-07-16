import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Since we clear auth state on app restart, there should be no initial session
    // But we still check to be safe
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        console.log('Found existing session for:', session.user.email);
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        console.log('No existing session found');
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_OUT' || !session?.user) {
          console.log('User signed out or no session');
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else if (session?.user) {
          console.log('User signed in:', session.user.email);
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
      
      console.log('Profile fetched successfully:', data);
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      
      // If profile doesn't exist, create one
      if (error.code === 'PGRST116') {
        console.log('Profile not found, this might be expected for new users');
      } else {
        console.error('Profile load failed', error?.message);
      }
      
      // Don't set profile to null here - let the component handle the missing profile
      // setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: {
    full_name: string;
    phone_number: string;
    role?: 'Customer' | 'Vendor' | 'Driver';
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.full_name,
          phone_number: userData.phone_number,
          role: userData.role || 'Customer'
        }
      }
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting to sign in:', email);
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Sign in error:', error);
      setLoading(false);
    } else {
      console.log('Sign in successful:', data.user?.email);
      // Don't set loading to false here - let the auth state change handler manage it
    }
    
    return { data, error };
  };

  const signOut = async () => {
    try {
      console.log('Signing out user');
      setLoading(true);
      
      // Clear local state first
      setUser(null);
      setProfile(null);
      
      // Clear any auth-related localStorage/sessionStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        return { error };
      }
      
      console.log('Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('Error during sign out:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
    }

    return { data, error };
  };

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile
  };
}