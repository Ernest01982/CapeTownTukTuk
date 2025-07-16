import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'Customer' | 'Vendor' | 'Driver' | 'Admin';
}

// A simple spinner component. You can create this in a separate file
// or use a library, but this is sufficient for now.
const Spinner = ({ message }: { message: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{message}</h2>
      <p className="text-gray-600">Please wait...</p>
    </div>
  </div>
);

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { auth } = useAppContext();
  const { user, profile, loading } = auth;
  const location = useLocation();

  // 1. Show a spinner while the auth state is loading to prevent flicker
  if (loading) {
    return <Spinner message="Verifying authentication..." />;
  }

  // 2. If loading is finished and there's no user, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 3. If there is a user but the profile is still loading (rare case), show spinner
  if (!profile) {
      return <Spinner message="Loading profile..." />;
  }

  // 4. Check for role mismatch, but always allow Admins through
  if (requiredRole && profile.role !== requiredRole && profile.role !== 'Admin') {
    // If user is not the required role (and not an Admin), send them to their default dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // 5. If all checks pass, render the protected component
  return <>{children}</>;
}