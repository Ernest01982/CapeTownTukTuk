// src/components/Auth/AuthGuard.tsx (Improved)
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// ... (Spinner component for loading state)

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Spinner message="Verifying access..." />;
  }

  if (!user || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && profile.role !== requiredRole && profile.role !== 'Admin') {
    // Admins can access everything
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}