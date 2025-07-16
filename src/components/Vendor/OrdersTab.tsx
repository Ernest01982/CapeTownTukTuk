import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Eye, Phone, MapPin, User } from 'lucide-react';
import { supabase, Order, Business } from '../../lib/supabase';

interface OrdersTabProps {
  business: Business;
}

export function OrdersTab({ business }: OrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
    setupRealtimeSubscription();
  }, [business.id]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:profiles!orders_customer_id_fkey(*),
          driver:profiles!orders_driver_id_fkey(*),
          order_items:order_items(
            *,
            product:products(*)
          )
        `)
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('vendor_orders')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `business_id=eq.${business.id}`
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId)
        .eq('business_id', business.id);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Confirmed': return 'bg-blue-100 text-blue-800';
      case 'Preparing': return 'bg-purple-100 text-purple-800';
      case 'Ready_for_Pickup': return 'bg-orange-100 text-orange-800';
      case 'Out_for_Delivery': return 'bg-indigo-100 text-indigo-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return Clock;
      case 'Confirmed': return CheckCircle;
      case 'Preparing': return Package;
      case 'Ready_for_Pickup': return Package;
      case 'Out_for_Delivery': return Package;
      case 'Delivered': return CheckCircle;
      case 'Cancelled': return XCircle;
      default: return Clock;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.order_status.toLowerCase().replace('_', '') === filter.replace('_', '');
  });

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.order_status === 'Pending').length,
    preparing: orders.filter(o => ['Confirmed', 'Preparing'].includes(o.order_status)).length,
    completed: orders.filter(o => o.order_status === 'Delivered').length,
    revenue: orders.filter(o => o.order_status === 'Delivered').reduce((sum, o) => sum + Number(o.order_total_amount), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{orderStats.total}</div>
          <div className="text-sm text-gray-500">Total Orders</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">{orderStats.preparing}</div>
          <div className="text-sm text-gray-500">Preparing</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{orderStats.completed}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">R{orderStats.revenue.toFixed(2)}</div>
          <div className="text-sm text-gray-500">Revenue</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Orders', count: orderStats.total },
            { key: 'pending', label: 'Pending', count: orderStats.pending },
            { key: 'preparing', label: 'Preparing', count: orderStats.preparing },
            { key: 'ready', label: 'Ready', count: orders.filter(o => o.order_status === 'Ready_for_Pickup').length },
            { key: 'delivered', label: 'Delivered', count: orderStats.completed },
            { key: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.order_status === 'Cancelled').length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-sky-100 text-sky-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No orders found</h3>
            <p className="mt-2 text-gray-500">
              {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const StatusIcon = getStatusIcon(order.order_status);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.id.slice(0, 8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.payment_method}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {order.customer?.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.customer?.phone_number}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.order_items?.length || 0} items
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.order_items?.slice(0, 2).map(item => item.product?.name).join(', ')}
                          {(order.order_items?.length || 0) > 2 && '...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          R{Number(order.order_total_amount).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {order.order_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                        <div className="text-xs">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-sky-600 hover:text-sky-900 p-1"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {order.order_status === 'Pending' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'Confirmed')}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                            >
                              Confirm
                            </button>
                          )}
                          
                          {order.order_status === 'Confirmed' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'Preparing')}
                              className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700"
                            >
                              Start Preparing
                            </button>
                          )}
                          
                          {order.order_status === 'Preparing' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'Ready_for_Pickup')}
                              className="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700"
                            >
                              Ready
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-gray-900">
                Order #{selectedOrder.id.slice(0, 8)}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{selectedOrder.customer?.full_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{selectedOrder.customer?.phone_number}</span>
                  </div>
                  <div className="flex items-start space-x-2 md:col-span-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-sm">{selectedOrder.delivery_address_text}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                      <div>
                        <span className="font-medium">{item.quantity}x</span> {item.product?.name}
                      </div>
                      <span className="font-medium">R{Number(item.price_at_purchase).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-2 font-bold text-lg">
                    <span>Total</span>
                    <span>R{Number(selectedOrder.order_total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              {selectedOrder.special_instructions && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Special Instructions</h4>
                  <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                    {selectedOrder.special_instructions}
                  </p>
                </div>
              )}

              {/* Order Status */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Status</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.order_status)}`}>
                    {selectedOrder.order_status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Confirmation Code</div>
                  <div className="text-lg font-bold text-gray-900">{selectedOrder.delivery_confirmation_code}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}