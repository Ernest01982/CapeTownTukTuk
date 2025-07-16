import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AdminDashboard } from '../components/Admin/AdminDashboard';
import { VendorDashboard } from '../components/Vendor/VendorDashboard';
import { DriverDashboard } from '../components/Driver/DriverDashboard';
import { BrowseVendors } from '../components/Customer/BrowseVendors';

export default function DashboardRouter() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function initializeDashboard() {
      try {
        console.log('DashboardRouter: Initializing dashboard...');
        
        // Get current session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session fetch timeout')), 10000)
        );
        
        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (sessionError) {
          console.error('DashboardRouter: Session error:', sessionError);
          setError('Session error');
          navigate('/login', { replace: true });
          return;
        }

        // If no session, redirect to login
        if (!session?.user) {
          console.log('DashboardRouter: No session found, redirecting to login');
          setError('No session');
          navigate('/login', { replace: true });
          return;
        }

        console.log('DashboardRouter: Session found for user:', session.user.email);

        // Query profiles table for user's role with timeout
        const profilePromise = supabase
          .from('profiles')
          .select('role, full_name, email')
          .eq('id', session.user.id)
          .single();
          
        const profileTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
        );

        const { data: profile, error: profileError } = await Promise.race([
          profilePromise,
          profileTimeoutPromise
        ]) as any;

        if (profileError) {
          console.error('DashboardRouter: Profile error:', profileError);
          
          if (profileError.code === 'PGRST116') {
            // Profile doesn't exist
            console.log('DashboardRouter: Profile not found, redirecting to login');
            setError('Profile not found');
          } else {
            // Other database error
            console.log('DashboardRouter: Database error, redirecting to login');
            setError('Database error');
          }
          
          navigate('/login', { replace: true });
          return;
        }

        if (!profile?.role) {
          console.error('DashboardRouter: Profile exists but no role assigned');
          setError('No role assigned');
          navigate('/login', { replace: true });
          return;
        }

        console.log('DashboardRouter: Profile loaded successfully:', profile);
        
        // Save role and stop loading
        setRole(profile.role);
        setError(null);

      } catch (error: any) {
        console.error('DashboardRouter: Initialization error:', error);
        setError(error.message || 'Unknown error');
        
        // Don't hang - always redirect on error
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      } finally {
        setLoading(false);
      }
    }

    // Set a maximum timeout for the entire initialization
    const initTimeout = setTimeout(() => {
      console.error('DashboardRouter: Initialization timeout');
      setError('Initialization timeout');
      setLoading(false);
      navigate('/login', { replace: true });
    }, 15000);

    initializeDashboard().finally(() => {
      clearTimeout(initTimeout);
    });

    return () => {
      clearTimeout(initTimeout);
    };
  }, [navigate]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">
            {error === 'Profile not found' 
              ? 'Your profile could not be found. Please contact support.'
              : error === 'No role assigned'
              ? 'Your account does not have a role assigned. Please contact support.'
              : error === 'Session error' || error === 'No session'
              ? 'Please sign in again.'
              : `Error: ${error}`
            }
          </p>
          <div className="space-y-2 text-sm text-gray-500 mb-4">
            <p>Email: support@tuktuk.co.za</p>
            <p>Phone: +27 21 123 4567</p>
          </div>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-amber-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-lg opacity-50"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard...</h2>
            <p className="text-gray-500">Please wait while we set up your workspace</p>
          </div>
        </div>
      </div>
    );
  }

  // Role-based dashboard rendering
  switch (role) {
    case 'Admin':
      console.log('DashboardRouter: Rendering AdminDashboard');
      return <AdminDashboard />;
    
    case 'Vendor':
      console.log('DashboardRouter: Rendering VendorDashboard');
      return <VendorDashboard />;
    
    case 'Driver':
      console.log('DashboardRouter: Rendering DriverDashboard');
      return <DriverDashboard />;
    
    case 'Customer':
      console.log('DashboardRouter: Rendering BrowseVendors');
      return <BrowseVendors />;
    
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-16 h-16 bg-red-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unknown Role</h2>
            <p className="text-gray-600 mb-4">
              Unknown role "{role}" – contact support for assistance.
            </p>
            <div className="space-y-2 text-sm text-gray-500 mb-4">
              <p>Email: support@tuktuk.co.za</p>
              <p>Phone: +27 21 123 4567</p>
            </div>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      );
  }
}