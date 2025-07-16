import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'Customer' | 'Vendor' | 'Driver' | 'Admin';
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  console.log('AuthGuard - User:', !!user, 'Profile:', profile?.role, 'Required:', requiredRole, 'Loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we verify your access</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('AuthGuard - No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile) {
    console.log('AuthGuard - No profile, showing loading');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Profile...</h2>
          <p className="text-gray-600">Setting up your dashboard...</p>
        </div>
      </div>
    );
  }

  // Early return for Admin users - they should always have access
  if (profile.role === 'Admin') {
    console.log('AuthGuard - Admin user, granting access');
    return <>{children}</>;
  }

  if (requiredRole && profile.role !== requiredRole) {
    console.log('AuthGuard - Role mismatch. User role:', profile.role, 'Required:', requiredRole);
    return <Navigate to="/" replace />;
  }

  console.log('AuthGuard - Access granted');
  return <>{children}</>;
}