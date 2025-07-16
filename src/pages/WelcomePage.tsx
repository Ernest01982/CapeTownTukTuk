import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function WelcomePage() {
  const { profile } = useAuth();

  const getDashboardLink = () => {
    if (!profile) return '/';
    
    switch (profile.role) {
      case 'Customer':
        return '/customer';
      case 'Vendor':
        return '/vendor';
      case 'Driver':
        return '/driver';
      case 'Admin':
        return '/admin';
      default:
        return '/';
    }
  };

  const getRoleMessage = () => {
    if (!profile) return 'Welcome to TukTuk!';
    
    switch (profile.role) {
      case 'Customer':
        return 'Start browsing local vendors and place your first order!';
      case 'Vendor':
        return 'Set up your business profile and start selling to the Cape Town community!';
      case 'Driver':
        return 'Complete your driver profile and start earning with deliveries!';
      case 'Admin':
        return 'Access your admin dashboard to manage the platform!';
      default:
        return 'Welcome to TukTuk!';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to TukTuk!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your account has been created successfully
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Hello, {profile?.full_name}!
          </h3>
          <p className="text-gray-600 mb-6">
            {getRoleMessage()}
          </p>

          <Link
            to={getDashboardLink()}
            className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-sky-500 to-orange-500 hover:shadow-lg transition-all duration-200"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              You can always access your dashboard from the user menu in the header.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}