import React, { useState, useEffect } from 'react';
import { MapPin, Clock, DollarSign, Package, Navigation, Phone, CheckCircle, AlertCircle, Star, TrendingUp, Calendar, User, Eye, Truck, Target, Award, Zap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Order } from '../../lib/supabase';

export function DriverDashboard() {
  const { profile } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [completingOrder, setCompletingOrder] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (profile) {
      fetchOrders();
      setupRealtimeSubscription();
    }
  }, [profile]);

  const fetchOrders = async () => {
    try {
      // Fetch available orders (not assigned to any driver)
      const { data: availableData, error: availableError } = await supabase
        .from('orders')
        .select(`
          *,
          business:businesses(*),
          customer:profiles!orders_customer_id_fkey(*),
          order_items:order_items(
            *,
            product:products(*)
          )
        `)
        .is('driver_id', null)
        .in('order_status', ['Confirmed', 'Preparing', 'Ready_for_Pickup'])
        .order('created_at', { ascending: true });

      if (availableError) throw availableError;
      setAvailableOrders(availableData || []);

      // Fetch my assigned orders (active)
      const { data: myData, error: myError } = await supabase
        .from('orders')
        .select(`
          *,
          business:businesses(*),
          customer:profiles!orders_customer_id_fkey(*),
          order_items:order_items(
            *,
            product:products(*)
          )
        `)
        .eq('driver_id', profile?.id)
        .in('order_status', ['Ready_for_Pickup', 'Out_for_Delivery'])
        .order('created_at', { ascending: true });

      if (myError) throw myError;
      setMyOrders(myData || []);

      // Fetch completed orders for earnings
      const { data: completedData, error: completedError } = await supabase
        .from('orders')
        .select(`
          *,
          business:businesses(*),
          customer:profiles!orders_customer_id_fkey(*)
        `)
        .eq('driver_id', profile?.id)
        .eq('order_status', 'Delivered')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('created_at', { ascending: false });

      if (completedError) throw completedError;
      setCompletedOrders(completedData || []);

    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('driver_orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders(); // Refresh orders when any change occurs
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const acceptOrder = async (orderId: string) => {
    try {
      // Attempt to claim the order atomically
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          driver_id: profile?.id,
          order_status: 'Ready_for_Pickup'
        })
        .eq('id', orderId)
        .is('driver_id', null) // Only update if no driver is assigned
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned means another driver got it first
          setError('This order was just taken by another driver');
          setTimeout(() => setError(''), 3000);
        } else {
          throw error;
        }
      } else if (data) {
        // Successfully claimed the order
        fetchOrders();
        setActiveTab('my-orders');
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      setError('Failed to accept order. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId)
        .eq('driver_id', profile?.id); // Ensure only the assigned driver can update

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const completeDelivery = async (orderId: string, orderConfirmationCode: string) => {
    if (confirmationCode !== orderConfirmationCode) {
      setError('Invalid confirmation code. Please check with the customer.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setCompletingOrder(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: 'Delivered' })
        .eq('id', orderId)
        .eq('driver_id', profile?.id);

      if (error) throw error;
      
      setConfirmationCode('');
      fetchOrders();
    } catch (error) {
      console.error('Error completing delivery:', error);
      setError('Failed to complete delivery');
      setTimeout(() => setError(''), 3000);
    } finally {
      setCompletingOrder(null);
    }
  };

  const calculateDistance = (order: Order): string => {
    // Mock distance calculation - in real app, use geolocation
    const distances = ['1.2', '2.5', '3.8', '1.9', '4.2', '2.1', '3.5'];
    return distances[Math.floor(Math.random() * distances.length)];
  };

  const calculateEarnings = () => {
    const today = new Date().toDateString();
    const todayOrders = completedOrders.filter(order => 
      new Date(order.created_at).toDateString() === today
    );
    
    const thisWeek = completedOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return orderDate >= weekAgo;
    });

    const thisMonth = completedOrders.length; // Already filtered to last 30 days

    return {
      today: todayOrders.length * 25,
      week: thisWeek.length * 25,
      month: thisMonth * 25,
      todayDeliveries: todayOrders.length,
      weekDeliveries: thisWeek.length,
      monthDeliveries: thisMonth
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto mb-6"></div>
            <Truck className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Driver Dashboard</h2>
          <p className="text-gray-600">Preparing your delivery workspace...</p>
        </div>
      </div>
    );
  }

  const earnings = calculateEarnings();
  
  const stats = [
    {
      name: 'Today\'s Earnings',
      value: `R${earnings.today}`,
      subValue: `${earnings.todayDeliveries} deliveries`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      gradient: 'from-emerald-500 to-green-600'
    },
    {
      name: 'Active Deliveries',
      value: myOrders.length.toString(),
      subValue: 'In progress',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      name: 'Available Orders',
      value: availableOrders.length.toString(),
      subValue: 'Ready to accept',
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      gradient: 'from-orange-500 to-red-600'
    },
    {
      name: 'Driver Rating',
      value: '4.8',
      subValue: 'Based on reviews',
      icon: Star,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      gradient: 'from-purple-500 to-pink-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Truck className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Driver Dashboard
                  </h1>
                  <p className="text-gray-600 text-lg">Welcome back, {profile?.full_name}!</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                {/* Online Status Toggle */}
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <button
                    onClick={() => setIsOnline(!isOnline)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isOnline ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        isOnline ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Quick Stats */}
                <div className="hidden lg:flex items-center space-x-6 bg-gray-50 rounded-2xl px-6 py-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">R{earnings.today}</div>
                    <div className="text-xs text-gray-500">Today</div>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{myOrders.length}</div>
                    <div className="text-xs text-gray-500">Active</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Enhanced Tabs */}
            <div className="mt-8">
              <nav className="flex space-x-1 bg-gray-100 rounded-2xl p-1">
                {[
                  { id: 'available', name: 'Available Orders', count: availableOrders.length, icon: Target },
                  { id: 'my-orders', name: 'My Deliveries', count: myOrders.length, icon: Package },
                  { id: 'earnings', name: 'Earnings', icon: DollarSign },
                  { id: 'history', name: 'History', icon: Calendar }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                    {tab.count !== undefined && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activeTab === tab.id 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                {stat.name === 'Driver Rating' && (
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-3 w-3 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.subValue}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'available' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Available Orders</h2>
                <p className="text-gray-600">Accept orders and start earning</p>
              </div>
              {!isOnline && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-xl text-sm flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>Go online to see orders</span>
                </div>
              )}
            </div>
            
            {!isOnline ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Package className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">You're offline</h3>
                <p className="text-gray-500 mb-6">Go online to start accepting delivery orders</p>
                <button
                  onClick={() => setIsOnline(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                >
                  Go Online
                </button>
              </div>
            ) : availableOrders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Package className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No available orders</h3>
                <p className="text-gray-500">Check back soon for new delivery opportunities</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {availableOrders.map((order) => {
                  const distance = calculateDistance(order);
                  const estimatedTime = Math.ceil(parseFloat(distance) * 3 + 10); // 3 min per km + 10 min base
                  
                  return (
                    <div key={order.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <Package className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {order.business?.business_name}
                            </h3>
                            <p className="text-sm text-gray-500">Order #{order.id.slice(0, 8)}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          order.order_status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                          order.order_status === 'Preparing' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {order.order_status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{distance} km away</span>
                          <span>•</span>
                          <Clock className="h-4 w-4 text-green-500" />
                          <span>~{estimatedTime} min</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 text-emerald-500" />
                          <span>R{order.order_total_amount} order • <span className="font-semibold text-emerald-600">Earn R25</span></span>
                        </div>
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                          <strong className="text-gray-900">Deliver to:</strong> {order.delivery_address_text.slice(0, 60)}...
                        </div>
                      </div>

                      <button
                        onClick={() => acceptOrder(order.id)}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                      >
                        Accept Order
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-orders' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Active Deliveries</h2>
              <p className="text-gray-600">Manage your current delivery orders</p>
            </div>
            
            {myOrders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Navigation className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No active deliveries</h3>
                <p className="text-gray-500">Accept orders from the available tab to start earning</p>
              </div>
            ) : (
              <div className="space-y-6">
                {myOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Order Info */}
                        <div>
                          <div className="flex items-center space-x-4 mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                              <Navigation className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">
                                {order.business?.business_name}
                              </h3>
                              <p className="text-gray-600">
                                To: {order.customer?.full_name}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                              <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Delivery Address:</p>
                                <p className="text-sm text-gray-600">{order.delivery_address_text}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-green-500" />
                                <span className="text-gray-600">{order.customer?.phone_number}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <DollarSign className="h-4 w-4 text-emerald-500" />
                                <span className="font-medium text-gray-900">R{order.order_total_amount}</span>
                              </div>
                            </div>

                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              order.order_status === 'Ready_for_Pickup' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {order.order_status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-4">
                          {order.order_status === 'Ready_for_Pickup' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'Out_for_Delivery')}
                              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200"
                            >
                              Start Delivery
                            </button>
                          )}
                          
                          {order.order_status === 'Out_for_Delivery' && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Customer Confirmation Code
                                </label>
                                <input
                                  type="text"
                                  value={confirmationCode}
                                  onChange={(e) => setConfirmationCode(e.target.value)}
                                  placeholder="Enter 4-digit code"
                                  maxLength={4}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
                                />
                              </div>
                              <button
                                onClick={() => completeDelivery(order.id, order.delivery_confirmation_code)}
                                disabled={completingOrder === order.id || confirmationCode.length !== 4}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                              >
                                {completingOrder === order.id ? 'Completing...' : 'Complete Delivery'}
                              </button>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 py-2 px-4 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                              <Navigation className="h-4 w-4" />
                              <span>Directions</span>
                            </button>
                            
                            <button className="flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 py-2 px-4 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                              <Phone className="h-4 w-4" />
                              <span>Call</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {order.order_items?.map((item) => (
                            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                              <span className="text-sm text-gray-600">
                                {item.quantity}x {item.product?.name}
                              </span>
                              <span className="text-sm font-medium text-gray-900">R{item.price_at_purchase}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Earnings Dashboard</h2>
              <p className="text-gray-600">Track your delivery earnings and performance</p>
            </div>
            
            {/* Earnings Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Earnings</p>
                    <p className="text-3xl font-bold text-green-600">R{earnings.today}</p>
                    <p className="text-sm text-gray-500">{earnings.todayDeliveries} deliveries</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Week</p>
                    <p className="text-3xl font-bold text-blue-600">R{earnings.week}</p>
                    <p className="text-sm text-gray-500">{earnings.weekDeliveries} deliveries</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-3xl font-bold text-purple-600">R{earnings.month}</p>
                    <p className="text-sm text-gray-500">{earnings.monthDeliveries} deliveries</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Star className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">4.8</div>
                  <div className="text-sm text-gray-500 mb-2">Average Rating</div>
                  <div className="flex justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-4 w-4 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">98%</div>
                  <div className="text-sm text-gray-500">On-time Delivery</div>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Clock className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">15 min</div>
                  <div className="text-sm text-gray-500">Avg Delivery Time</div>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Award className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">R25</div>
                  <div className="text-sm text-gray-500">Per Delivery</div>
                </div>
              </div>
            </div>

            {/* Weekly Earnings Chart */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Weekly Earnings</h3>
              <div className="space-y-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                  const earnings = [125, 200, 175, 250, 300, 400, 350][index];
                  const maxEarnings = 400;
                  const width = (earnings / maxEarnings) * 100;
                  
                  return (
                    <div key={day} className="flex items-center space-x-4">
                      <div className="w-12 text-sm font-medium text-gray-600">{day}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-8 rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                          style={{ width: `${width}%` }}
                        >
                          <span className="text-white text-sm font-medium">R{earnings}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Delivery History</h2>
              <p className="text-gray-600">View your completed deliveries</p>
            </div>
            
            {completedOrders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No completed deliveries</h3>
                <p className="text-gray-500">Your delivery history will appear here</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Business
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Earnings
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {completedOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              #{order.id.slice(0, 8)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{order.business?.business_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{order.customer?.full_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">R{order.order_total_amount}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-green-600">R25.00</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}