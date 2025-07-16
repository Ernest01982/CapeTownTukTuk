import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Store, Truck } from 'lucide-react';

export function MainRegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-amber-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-sky-500 to-amber-500 rounded-xl">
              <Truck className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Join Our Delivery Network
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose how you'd like to be part of Cape Town's fastest growing delivery community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Customer Registration Card */}
          <Link
            to="/register/customer"
            className="group relative bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-sky-100 group-hover:bg-sky-200 transition-colors duration-300 mb-6">
                <Users className="h-10 w-10 text-sky-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">I'm a Customer</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Order from your favorite local businesses and get fast delivery to your door
              </p>
              
              <div className="space-y-3 text-sm text-gray-500 mb-8">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                  <span>Browse local vendors</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                  <span>Track your orders in real-time</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                  <span>Support local businesses</span>
                </div>
              </div>
              
              <div className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-sky-500 to-amber-500 group-hover:shadow-lg transition-all duration-200">
                Get Started as Customer
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-8 h-8 bg-sky-100 rounded-full opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 bg-amber-100 rounded-full opacity-50 group-hover:opacity-75 transition-opacity"></div>
          </Link>

          {/* Vendor Registration Card */}
          <Link
            to="/register/vendor"
            className="group relative bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-amber-100 group-hover:bg-amber-200 transition-colors duration-300 mb-6">
                <Store className="h-10 w-10 text-amber-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">I'm a Business/Vendor</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Grow your business by reaching more customers with our delivery platform
              </p>
              
              <div className="space-y-3 text-sm text-gray-500 mb-8">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span>Reach new customers</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span>Manage orders easily</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span>Grow your revenue</span>
                </div>
              </div>
              
              <div className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-amber-500 to-orange-500 group-hover:shadow-lg transition-all duration-200">
                Join as Business
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-8 h-8 bg-amber-100 rounded-full opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 bg-sky-100 rounded-full opacity-50 group-hover:opacity-75 transition-opacity"></div>
          </Link>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-amber-600 hover:text-amber-500 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}