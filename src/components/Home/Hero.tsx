import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Clock, Shield, Heart } from 'lucide-react';

export function Hero() {
  return (
    <div className="relative bg-gradient-to-br from-sky-50 via-white to-orange-50 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block xl:inline">Fast delivery from</span>{' '}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-orange-500 xl:inline">
                  local Cape Town businesses
                </span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Supporting our community one delivery at a time. Order from your favorite local vendors and get it delivered by our trusted Tuk-Tuk drivers in minutes.
              </p>
              
              {/* Feature highlights */}
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-sky-500" />
                  <span className="text-sm text-gray-600">Fast delivery</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">Safe & secure</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span className="text-sm text-gray-600">Local support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-orange-500" />
                  <span className="text-sm text-gray-600">Tuk-Tuk fleet</span>
                </div>
              </div>

              <div className="mt-8 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link
                    to="/browse"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-sky-500 to-orange-500 hover:shadow-lg md:py-4 md:text-lg md:px-10 transition-all duration-200"
                  >
                    Order Now
                  </Link>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <Link
                    to="/how-it-works"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-sky-700 bg-sky-100 hover:bg-sky-200 md:py-4 md:text-lg md:px-10 transition-all duration-200"
                  >
                    How it works
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      
      {/* Hero image */}
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <div className="h-56 w-full bg-gradient-to-br from-sky-400 to-orange-400 sm:h-72 md:h-96 lg:w-full lg:h-full relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="absolute top-10 left-10 w-20 h-20 bg-white bg-opacity-20 rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-32 h-32 bg-white bg-opacity-10 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Truck className="h-32 w-32 text-white opacity-40" />
          </div>
        </div>
      </div>
    </div>
  );
}