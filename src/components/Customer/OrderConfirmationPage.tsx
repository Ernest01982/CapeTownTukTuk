import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle, Clock, MapPin, Phone, Copy, Check } from 'lucide-react';
import { supabase, Order } from '../../lib/supabase';

export function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const confirmationCode = location.state?.confirmationCode;

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          business:businesses(*),
          order_items:order_items(
            *,
            product:products(*)
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (confirmationCode) {
      await navigator.clipboard.writeText(confirmationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h2>
          <Link to="/browse" className="text-sky-600 hover:text-sky-500">
            ← Back to marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600">Your order has been confirmed and is being prepared</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID</span>
                <span className="font-medium">#{order.id.slice(0, 8)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Business</span>
                <span className="font-medium">{order.business?.business_name}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                  {order.order_status}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium">{order.payment_method}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-medium text-lg">R{order.order_total_amount}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Items Ordered</h4>
              <div className="space-y-2">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.quantity}x {item.product?.name}
                    </span>
                    <span className="font-medium">R{item.price_at_purchase}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="space-y-6">
            {/* Confirmation Code */}
            <div className="bg-gradient-to-r from-sky-500 to-amber-500 rounded-lg p-6 text-white">
              <h3 className="text-lg font-medium mb-4">Delivery Confirmation Code</h3>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold mb-2">{confirmationCode || order.delivery_confirmation_code}</div>
                <p className="text-sm opacity-90 mb-3">
                  Give this code to your delivery driver
                </p>
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-sm transition-colors"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <MapPin className="h-6 w-6 text-sky-500" />
                <h3 className="text-lg font-medium text-gray-900">Delivery Address</h3>
              </div>
              <p className="text-gray-600">{order.delivery_address_text}</p>
              
              {order.special_instructions && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Special Instructions</h4>
                  <p className="text-gray-600 text-sm">{order.special_instructions}</p>
                </div>
              )}
            </div>

            {/* Estimated Delivery */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="h-6 w-6 text-sky-500" />
                <h3 className="text-lg font-medium text-gray-900">Estimated Delivery</h3>
              </div>
              <p className="text-gray-600">30-45 minutes</p>
              <p className="text-sm text-gray-500 mt-1">
                You'll receive updates as your order is prepared and out for delivery
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/browse"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-sky-500 to-amber-500 hover:shadow-lg transition-all duration-200"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}