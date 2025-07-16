import React from 'react';
import { Clock, Shield, MapPin, Users, Smartphone, CreditCard } from 'lucide-react';

const features = [
  {
    icon: Clock,
    title: 'Fast Delivery',
    description: 'Get your orders delivered in 30-60 minutes by our reliable Tuk-Tuk drivers across Cape Town.',
    color: 'text-sky-500'
  },
  {
    icon: Users,
    title: 'Support Local',
    description: 'Every order supports local Cape Town businesses and helps create jobs in our community.',
    color: 'text-green-500'
  },
  {
    icon: Shield,
    title: 'Safe & Secure',
    description: 'POPIA compliant platform with secure payments and verified drivers for peace of mind.',
    color: 'text-purple-500'
  },
  {
    icon: MapPin,
    title: 'Wide Coverage',
    description: 'Serving communities across Cape Town with expanding delivery zones every month.',
    color: 'text-red-500'
  },
  {
    icon: Smartphone,
    title: 'Easy Ordering',
    description: 'Browse local vendors, place orders, and track deliveries all from our user-friendly platform.',
    color: 'text-orange-500'
  },
  {
    icon: CreditCard,
    title: 'Flexible Payment',
    description: 'Pay cash on delivery, card, EFT, or digital wallet - whatever works best for you.',
    color: 'text-blue-500'
  }
];

export function Features() {
  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Why Choose TukTuk?
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            We're more than just a delivery service - we're building a stronger Cape Town community
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="relative group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 p-3 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {feature.title}
                    </h3>
                  </div>
                </div>
                <p className="mt-4 text-gray-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}