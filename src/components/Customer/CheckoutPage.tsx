import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, Truck } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCart();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Card' | 'EFT' | 'Digital_Wallet'>('COD');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No items to checkout</h2>
          <Link to="/browse" className="text-sky-600 hover:text-sky-500">
            ← Back to marketplace
          </Link>
        </div>
      </div>
    );
  }

  // Group items by business (for now, we'll handle single business orders)
  const businessId = items[0].product.business_id;
  const businessName = items[0].product.business?.business_name;

  const generateConfirmationCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      setError('Please enter a delivery address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const confirmationCode = generateConfirmationCode();
      const totalAmount = getTotalPrice() + 25; // Including delivery fee

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: profile?.id,
          business_id: businessId,
          order_status: 'Pending',
          delivery_address_text: deliveryAddress,
          order_total_amount: totalAmount,
          payment_method: paymentMethod,
          delivery_confirmation_code: confirmationCode,
          special_instructions: specialInstructions || null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_purchase: item.product.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart and navigate to confirmation
      clearCart();
      navigate(`/order-confirmation/${orderData.id}`, {
        state: { confirmationCode }
      });

    } catch (error: any) {
      console.error('Error placing order:', error);
      setError(error.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getTotalPrice();
  const deliveryFee = 25;
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/cart"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Cart</span>
            </Link>
            
            <h1 className="text-xl font-semibold text-gray-900">Checkout</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Delivery Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <MapPin className="h-6 w-6 text-sky-500" />
                <h3 className="text-lg font-medium text-gray-900">Delivery Information</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address *
                  </label>
                  <textarea
                    id="address"
                    rows={3}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Enter your complete delivery address"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    id="instructions"
                    rows={2}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Any special delivery instructions..."
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CreditCard className="h-6 w-6 text-sky-500" />
                <h3 className="text-lg font-medium text-gray-900">Payment Method</h3>
              </div>
              
              <div className="space-y-3">
                {[
                  { value: 'COD', label: 'Cash on Delivery', description: 'Pay when your order arrives' },
                  { value: 'Card', label: 'Credit/Debit Card', description: 'Pay securely online' },
                  { value: 'EFT', label: 'EFT Transfer', description: 'Electronic funds transfer' },
                  { value: 'Digital_Wallet', label: 'Digital Wallet', description: 'PayPal, Apple Pay, etc.' }
                ].map((method) => (
                  <label key={method.value} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="mt-1 h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{method.label}</div>
                      <div className="text-sm text-gray-500">{method.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
                  <Truck className="h-5 w-5 text-sky-500" />
                  <span className="font-medium text-gray-900">{businessName}</span>
                </div>
                
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="font-medium">R{(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">R{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">R{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>R{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-500 to-amber-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>

              <div className="mt-4 text-xs text-gray-500 text-center">
                By placing this order, you agree to our terms of service and privacy policy.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}