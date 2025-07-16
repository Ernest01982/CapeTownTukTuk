import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Package, Users, Calendar, BarChart3 } from 'lucide-react';
import { supabase, Business, Order } from '../../lib/supabase';

interface AnalyticsTabProps {
  business: Business;
}

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  dailyStats: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  monthlyGrowth: number;
}

export function AnalyticsTab({ business }: AnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [business.id, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      // Fetch orders with items
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(
            *,
            product:products(name)
          )
        `)
        .eq('business_id', business.id)
        .eq('order_status', 'Delivered')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      // Calculate analytics
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.order_total_amount), 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate top products
      const productStats: Record<string, { quantity: number; revenue: number }> = {};
      orders?.forEach(order => {
        order.order_items?.forEach(item => {
          const productName = item.product?.name || 'Unknown Product';
          if (!productStats[productName]) {
            productStats[productName] = { quantity: 0, revenue: 0 };
          }
          productStats[productName].quantity += item.quantity;
          productStats[productName].revenue += Number(item.price_at_purchase) * item.quantity;
        });
      });

      const topProducts = Object.entries(productStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate daily stats
      const dailyStatsMap: Record<string, { orders: number; revenue: number }> = {};
      orders?.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        if (!dailyStatsMap[date]) {
          dailyStatsMap[date] = { orders: 0, revenue: 0 };
        }
        dailyStatsMap[date].orders += 1;
        dailyStatsMap[date].revenue += Number(order.order_total_amount);
      });

      const dailyStats = Object.entries(dailyStatsMap)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate growth (compare with previous period)
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - days);
      
      const { data: previousOrders } = await supabase
        .from('orders')
        .select('order_total_amount')
        .eq('business_id', business.id)
        .eq('order_status', 'Delivered')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const previousRevenue = previousOrders?.reduce((sum, order) => sum + Number(order.order_total_amount), 0) || 0;
      const monthlyGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      setAnalytics({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        topProducts,
        dailyStats,
        monthlyGrowth
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-16">
        <BarChart3 className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No analytics data</h3>
        <p className="mt-2 text-gray-500">Complete some orders to see your analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Business Analytics</h2>
        <div className="flex items-center space-x-2">
          {[
            { key: '7d', label: 'Last 7 days' },
            { key: '30d', label: 'Last 30 days' },
            { key: '90d', label: 'Last 90 days' }
          ].map((range) => (
            <button
              key={range.key}
              onClick={() => setTimeRange(range.key as any)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range.key
                  ? 'bg-sky-100 text-sky-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">R{analytics.totalRevenue.toFixed(2)}</p>
              {analytics.monthlyGrowth !== 0 && (
                <p className={`text-sm ${analytics.monthlyGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.monthlyGrowth > 0 ? '+' : ''}{analytics.monthlyGrowth.toFixed(1)}% vs previous period
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-semibold text-gray-900">R{analytics.averageOrderValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unique Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.totalOrders}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Daily Revenue</h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          
          {analytics.dailyStats.length > 0 ? (
            <div className="space-y-3">
              {analytics.dailyStats.slice(-7).map((day, index) => {
                const maxRevenue = Math.max(...analytics.dailyStats.map(d => d.revenue));
                const width = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                
                return (
                  <div key={day.date} className="flex items-center space-x-3">
                    <div className="w-16 text-sm text-gray-600">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                      <div
                        className="bg-gradient-to-r from-sky-500 to-blue-600 h-4 rounded-full transition-all duration-300"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <div className="w-20 text-sm font-medium text-gray-900 text-right">
                      R{day.revenue.toFixed(0)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No revenue data for this period
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Top Products</h3>
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          
          {analytics.topProducts.length > 0 ? (
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.quantity} sold</p>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    R{product.revenue.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No product sales data
            </div>
          )}
        </div>
      </div>

      {/* Orders Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Orders Timeline</h3>
        
        {analytics.dailyStats.length > 0 ? (
          <div className="space-y-2">
            {analytics.dailyStats.slice(-10).map((day) => (
              <div key={day.date} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-sky-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-600">{day.orders} orders</span>
                  <span className="font-medium text-gray-900">R{day.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No orders data for this period
          </div>
        )}
      </div>
    </div>
  );
}