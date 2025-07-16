import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Users, Package, Calendar, BarChart3, PieChart, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PlatformMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalBusinesses: number;
  averageOrderValue: number;
  growthRate: number;
  topPerformingBusinesses: Array<{
    name: string;
    revenue: number;
    orders: number;
  }>;
  userGrowth: Array<{
    date: string;
    customers: number;
    vendors: number;
    drivers: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export function PlatformAnalytics() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchPlatformMetrics();
  }, [timeRange]);

  const fetchPlatformMetrics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      // Fetch orders with business info
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          business:businesses(business_name)
        `)
        .eq('order_status', 'Delivered')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('role, created_at')
        .gte('created_at', startDate.toISOString());

      if (usersError) throw usersError;

      // Fetch all businesses
      const { data: businesses, error: businessesError } = await supabase
        .from('businesses')
        .select('*')
        .eq('approval_status', 'Approved');

      if (businessesError) throw businessesError;

      // Calculate metrics
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.order_total_amount), 0) || 0;
      const totalOrders = orders?.length || 0;
      const totalUsers = users?.length || 0;
      const totalBusinesses = businesses?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate growth rate (compare with previous period)
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - days);
      
      const { data: previousOrders } = await supabase
        .from('orders')
        .select('order_total_amount')
        .eq('order_status', 'Delivered')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const previousRevenue = previousOrders?.reduce((sum, order) => sum + Number(order.order_total_amount), 0) || 0;
      const growthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      // Calculate top performing businesses
      const businessStats: Record<string, { revenue: number; orders: number }> = {};
      orders?.forEach(order => {
        const businessName = order.business?.business_name || 'Unknown';
        if (!businessStats[businessName]) {
          businessStats[businessName] = { revenue: 0, orders: 0 };
        }
        businessStats[businessName].revenue += Number(order.order_total_amount);
        businessStats[businessName].orders += 1;
      });

      const topPerformingBusinesses = Object.entries(businessStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate user growth by day
      const userGrowthMap: Record<string, { customers: number; vendors: number; drivers: number }> = {};
      users?.forEach(user => {
        const date = new Date(user.created_at).toISOString().split('T')[0];
        if (!userGrowthMap[date]) {
          userGrowthMap[date] = { customers: 0, vendors: 0, drivers: 0 };
        }
        if (user.role === 'Customer') userGrowthMap[date].customers += 1;
        else if (user.role === 'Vendor') userGrowthMap[date].vendors += 1;
        else if (user.role === 'Driver') userGrowthMap[date].drivers += 1;
      });

      const userGrowth = Object.entries(userGrowthMap)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate revenue by day
      const revenueByDayMap: Record<string, { revenue: number; orders: number }> = {};
      orders?.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        if (!revenueByDayMap[date]) {
          revenueByDayMap[date] = { revenue: 0, orders: 0 };
        }
        revenueByDayMap[date].revenue += Number(order.order_total_amount);
        revenueByDayMap[date].orders += 1;
      });

      const revenueByDay = Object.entries(revenueByDayMap)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setMetrics({
        totalRevenue,
        totalOrders,
        totalUsers,
        totalBusinesses,
        averageOrderValue,
        growthRate,
        topPerformingBusinesses,
        userGrowth,
        revenueByDay
      });

    } catch (error) {
      console.error('Error fetching platform metrics:', error);
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

  if (!metrics) {
    return (
      <div className="text-center py-16">
        <BarChart3 className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No analytics data</h3>
        <p className="mt-2 text-gray-500">Analytics will appear as the platform grows</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Platform Analytics</h2>
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
              <p className="text-2xl font-semibold text-gray-900">R{metrics.totalRevenue.toFixed(2)}</p>
              {metrics.growthRate !== 0 && (
                <p className={`text-sm ${metrics.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.growthRate > 0 ? '+' : ''}{metrics.growthRate.toFixed(1)}% vs previous period
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
              <p className="text-2xl font-semibold text-gray-900">{metrics.totalOrders}</p>
              <p className="text-sm text-gray-500">Avg: R{metrics.averageOrderValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New Users</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.totalUsers}</p>
              <p className="text-sm text-gray-500">This period</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Businesses</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.totalBusinesses}</p>
              <p className="text-sm text-gray-500">Approved vendors</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Daily Revenue</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          {metrics.revenueByDay.length > 0 ? (
            <div className="space-y-3">
              {metrics.revenueByDay.slice(-7).map((day, index) => {
                const maxRevenue = Math.max(...metrics.revenueByDay.map(d => d.revenue));
                const width = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                
                return (
                  <div key={day.date} className="flex items-center space-x-3">
                    <div className="w-16 text-sm text-gray-600">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-300"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <div className="w-20 text-sm font-medium text-gray-900 text-right">
                      R{day.revenue.toFixed(0)}
                    </div>
                    <div className="w-16 text-xs text-gray-500 text-right">
                      {day.orders} orders
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

        {/* Top Businesses */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Top Performing Businesses</h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          
          {metrics.topPerformingBusinesses.length > 0 ? (
            <div className="space-y-4">
              {metrics.topPerformingBusinesses.map((business, index) => (
                <div key={business.name} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{business.name}</p>
                    <p className="text-sm text-gray-500">{business.orders} orders</p>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    R{business.revenue.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No business performance data
            </div>
          )}
        </div>
      </div>

      {/* User Growth Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">User Registration Trends</h3>
        
        {metrics.userGrowth.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.userGrowth.reduce((sum, day) => sum + day.customers, 0)}
                </div>
                <div className="text-sm text-gray-500">New Customers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {metrics.userGrowth.reduce((sum, day) => sum + day.vendors, 0)}
                </div>
                <div className="text-sm text-gray-500">New Vendors</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.userGrowth.reduce((sum, day) => sum + day.drivers, 0)}
                </div>
                <div className="text-sm text-gray-500">New Drivers</div>
              </div>
            </div>
            
            <div className="space-y-2">
              {metrics.userGrowth.slice(-10).map((day) => (
                <div key={day.date} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-blue-600">{day.customers}C</span>
                    <span className="text-green-600">{day.vendors}V</span>
                    <span className="text-purple-600">{day.drivers}D</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No user growth data for this period
          </div>
        )}
      </div>
    </div>
  );
}