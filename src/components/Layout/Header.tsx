import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, User, LogOut, Menu, Settings } from 'lucide-react';
import { useAppContext } from '../../context/AppContext'; // Import the new hook

export function Header() {
  const { auth, cart } = useAppContext(); // Use the new hook
  const { user, profile, signOut } = auth; // Destructure auth state
  const { getTotalItems } = cart; // Destructure cart state
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      navigate('/');
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      navigate('/');
    }
  };

  const getDashboardLink = () => {
    if (!profile) return '/dashboard';
    
    switch (profile.role) {
      case 'Customer':
        return '/browse';
      case 'Vendor':
        return '/vendor';
      case 'Driver':
        return '/driver';
      case 'Admin':
        return '/admin';
      default:
        return '/dashboard';
    }
  };

  const getDashboardLabel = () => {
    if (!profile) return 'Dashboard';
    
    switch (profile.role) {
      case 'Customer':
        return 'Browse';
      case 'Vendor':
        return 'Vendor Dashboard';
      case 'Driver':
        return 'Driver Dashboard';
      case 'Admin':
        return 'Admin Dashboard';
      default:
        return 'Dashboard';
    }
  };


  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-sky-500 to-orange-500 rounded-lg">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">TukTuk</h1>
              <p className="text-xs text-gray-500">Cape Town Delivery</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/browse" 
              className="text-gray-700 hover:text-sky-600 transition-colors"
            >
              Browse
            </Link>
            <Link 
              to="/how-it-works" 
              className="text-gray-700 hover:text-sky-600 transition-colors"
            >
              How It Works
            </Link>
            <Link 
              to="/become-vendor" 
              className="text-gray-700 hover:text-sky-600 transition-colors"
            >
              Become a Vendor
            </Link>
            <Link 
              to="/drive-with-us" 
              className="text-gray-700 hover:text-sky-600 transition-colors"
            >
              Drive With Us
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Role-specific dashboard link */}
                <Link
                  to={getDashboardLink()}
                  className="flex items-center space-x-2 text-gray-700 hover:text-sky-600 transition-colors"
                >
                  {profile?.role === 'Admin' ? (
                    <Settings className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="hidden sm:inline">
                    {getDashboardLabel()}
                  </span>
                </Link>

                {/* User info and role badge */}
                <div className="flex items-center space-x-2">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium text-gray-900">
                      {profile?.full_name || 'User'}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      profile?.role === 'Admin' ? 'bg-red-100 text-red-800' :
                      profile?.role === 'Vendor' ? 'bg-green-100 text-green-800' :
                      profile?.role === 'Driver' ? 'bg-purple-100 text-purple-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {profile?.role}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-sky-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-sky-500 to-orange-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}
            
            {/* Mobile menu button */}
            <button className="md:hidden p-2 text-gray-700 hover:text-sky-600">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}