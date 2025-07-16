import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-sky-500 to-orange-500 rounded-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">TukTuk</h2>
                <p className="text-sm text-gray-400">Cape Town Delivery</p>
              </div>
            </Link>
            <p className="text-gray-400 text-sm">
              Supporting local businesses with fast, reliable delivery across Cape Town's communities.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/browse" className="text-gray-400 hover:text-white transition-colors">Browse Stores</Link></li>
              <li><Link to="/how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/become-vendor" className="text-gray-400 hover:text-white transition-colors">Become a Vendor</Link></li>
              <li><Link to="/drive-with-us" className="text-gray-400 hover:text-white transition-colors">Drive With Us</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link to="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-sky-500" />
                <span className="text-gray-400">+27 21 123 4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-sky-500" />
                <span className="text-gray-400">hello@tuktuk.co.za</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-sky-500" />
                <span className="text-gray-400">Cape Town, South Africa</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 TukTuk Cape Town Delivery. All rights reserved.</p>
          <p className="mt-2 text-sm">
            POPIA compliant • Supporting local businesses • Proudly South African
          </p>
        </div>
      </div>
    </footer>
  );
}