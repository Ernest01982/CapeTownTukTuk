import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, Mail, Phone } from 'lucide-react';

export function VendorConfirmationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-amber-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Application Submitted!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Thank you for registering your business with TukTuk
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center justify-center mb-6">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Your application is under review
          </h3>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Our team will review your business application within 24-48 hours. We'll verify your business details and ensure everything meets our quality standards.
          </p>

          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>Business verification in progress</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span>Account approval pending</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span>Platform access granted</span>
            </div>
          </div>

          <div className="mt-8 p-4 bg-amber-50 rounded-lg">
            <h4 className="font-medium text-amber-800 mb-2">What happens next?</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• We'll email you once your application is approved</li>
              <li>• You can then sign in and set up your product catalog</li>
              <li>• Start receiving orders from Cape Town customers</li>
            </ul>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Questions about your application?
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">support@tuktuk.co.za</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">+27 21 123 4567</span>
              </div>
            </div>
          </div>
        </div>

        <Link
          to="/login"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg transition-all duration-200"
        >
          Sign In to Your Account
        </Link>
      </div>
    </div>
  );
}