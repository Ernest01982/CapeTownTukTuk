import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Store, Truck } from 'lucide-react';

export function CallToAction() {
  return (
    <div className="bg-gradient-to-r from-sky-500 to-orange-500">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-12 sm:px-12 lg:py-16 lg:px-16">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Join thousands of Cape Town residents supporting local businesses
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* For Customers */}
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-sky-100">
                  <Store className="h-8 w-8 text-sky-600" />
                </div>
                <h3 className="mt-6 text-xl font-medium text-gray-900">For Customers</h3>
                <p className="mt-2 text-gray-500">
                  Browse local vendors and get fast delivery to your door
                </p>
                <Link
                  to="/register"
                  className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 transition-colors"
                >
                  Start Ordering
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              {/* For Vendors */}
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                  <Store className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="mt-6 text-xl font-medium text-gray-900">For Vendors</h3>
                <p className="mt-2 text-gray-500">
                  Grow your business with our delivery platform
                </p>
                <Link
                  to="/become-vendor"
                  className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  Become a Vendor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              {/* For Drivers */}
              <div className="text-center sm:col-span-2 lg:col-span-1">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100">
                  <Truck className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="mt-6 text-xl font-medium text-gray-900">For Drivers</h3>
                <p className="mt-2 text-gray-500">
                  Earn money delivering orders in your community
                </p>
                <Link
                  to="/drive-with-us"
                  className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                >
                  Drive With Us
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}