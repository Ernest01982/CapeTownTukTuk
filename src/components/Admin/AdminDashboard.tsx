import React, { useState, useEffect } from 'react';
import { Users, Building, Package, DollarSign, CheckCircle, XCircle, Clock, TrendingUp, AlertTriangle, Eye, Search, Filter } from 'lucide-react';
import { useAppContext } from '../../context/AppContext'; // Use the AppContext
import { supabase, Business } from '../../lib/supabase';
import { useDebounce } from '../../hooks/useDebounce'; // Import the new hook
import { AccountingPage } from './AccountingPage';
import { PlatformAnalytics } from './PlatformAnalytics';
import { UserManagement } from './UserManagement';
import { VendorApprovalModal } from './VendorApprovalModal';

export function AdminDashboard() {
  const { auth } = useAppContext();
  const { profile } = auth;

  const [pendingBusinesses, setPendingBusinesses] = useState<Business[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platformStats, setPlatformStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeDrivers: 0
  });

  // --- Start of Debounce Implementation ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms delay
  // --- End of Debounce Implementation ---


  useEffect(() => {
    fetchDashboardData();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      console.log('AdminDashboard: Fetching dashboard data...');

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select(`
          *,
          profile:profiles(full_name, phone_number, email, created_at)
        `)
        .order('created_at', { ascending: false });

      if (businessError) {
        console.error('AdminDashboard: Business fetch error:', businessError);
        setAllBusinesses([]);
        setPendingBusinesses([]);
      } else {
        const businesses = businessData || [];
        setAllBusinesses(businesses);
        setPendingBusinesses(businesses.filter(b => b.approval_status === 'Pending'));
      }

      try {
        const [usersResult, ordersResult, driversResult] = await Promise.allSettled([
          supabase.from('profiles').select('id', { count: 'exact' }),
          supabase.from('orders').select('id, order_total_amount', { count: 'exact' }),
          supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'Driver').eq('is_active', true)
        ]);

        let totalUsers = 0;
        let totalOrders = 0;
        let totalRevenue = 0;
        let activeDrivers = 0;

        if (usersResult.status === 'fulfilled' && usersResult.value.count !== null) totalUsers = usersResult.value.count;
        if (ordersResult.status === 'fulfilled') {
          totalOrders = ordersResult.value.count || 0;
          if (ordersResult.value.data) {
            totalRevenue = ordersResult.value.data.reduce((sum, order) => sum + Number(order.order_total_amount || 0), 0);
          }
        }
        if (driversResult.status === 'fulfilled' && driversResult.value.count !== null) activeDrivers = driversResult.value.count;

        setPlatformStats({ totalUsers, totalOrders, totalRevenue, activeDrivers });
      } catch (statsError) {
        console.error('AdminDashboard: Stats fetch error:', statsError);
      }
    } catch (error: any) {
      setError(error?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter logic now uses the debounced search term
  const filteredBusinesses = allBusinesses.filter(business => {
    const businessName = business?.business_name || '';
    const profileName = business?.profile?.full_name || '';
    const profileEmail = business?.profile?.email || '';
    
    const matchesSearch = businessName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         profileName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         profileEmail.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (business?.approval_status || '').toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // ... (rest of the functions: setupRealtimeSubscription, updateBusinessStatus, etc. remain the same)
  const setupRealtimeSubscription = () => {
    try {
      const subscription = supabase
        .channel('admin_dashboard')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'businesses' },
          () => {
            console.log('AdminDashboard: Real-time update received');
            fetchDashboardData();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('AdminDashboard: Error setting up real-time subscription:', error);
      return () => {};
    }
  };

  const updateBusinessStatus = async (businessId: string, status: 'Approved' | 'Rejected', notes?: string) => {
    setActionLoading(businessId);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ 
          approval_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId);

      if (error) throw error;
      
      try {
        const business = allBusinesses.find(b => b.id === businessId);
        if (business && profile?.id) {
          await supabase.from('audit_log').insert({
            user_id: profile.id,
            action: `BUSINESS_${status.toUpperCase()}`,
            details: {
              business_id: businessId,
              business_name: business.business_name,
              notes: notes || null
            }
          });
        }
      } catch (auditError) {
        console.error('AdminDashboard: Audit log error:', auditError);
      }
      
      fetchDashboardData();
      setShowApprovalModal(false);
      setSelectedBusiness(null);
    } catch (error: any) {
      setError(error?.message || 'Failed to update business status');
    } finally {
      setActionLoading(null);
    }
  };

  const openApprovalModal = (business: Business) => {
    setSelectedBusiness(business);
    setShowApprovalModal(true);
  };


  // The JSX part of the component remains largely the same...
  // You can copy from here down to replace the rest of your file.

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Admin Dashboard...</h2>
          <p className="text-gray-600">Please wait while we load your data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchDashboardData();
            }}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Pending Approvals',
      value: pendingBusinesses.length.toString(),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      urgent: pendingBusinesses.length > 5
    },
    {
      name: 'Total Businesses',
      value: allBusinesses.filter(b => b?.approval_status === 'Approved').length.toString(),
      icon: Building,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Platform Users',
      value: platformStats.totalUsers.toString(),
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Total Revenue',
      value: `R${platformStats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome back, {profile?.full_name || 'Admin'}!</p>
              </div>
              <div className="flex items-center space-x-4">
                {pendingBusinesses.length > 0 && (
                  <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">{pendingBusinesses.length} pending approvals</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6">
              <nav className="flex space-x-8">
                {[
                  { id: 'overview', name: 'Overview' },
                  { id: 'approvals', name: 'Vendor Approvals', count: pendingBusinesses.length },
                  { id: 'businesses', name: 'All Businesses', count: allBusinesses.length },
                  { id: 'users', name: 'User Management' },
                  { id: 'accounting', name: 'Accounting' },
                  { id: 'analytics', name: 'Analytics' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-sky-500 text-sky-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span>{tab.name}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activeTab === tab.id ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-600'
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
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.name} className={`bg-white rounded-lg shadow-sm border p-6 ${
                  stat.urgent ? 'border-yellow-300 ring-2 ring-yellow-100' : 'border-gray-200'
                }`}>
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                      {stat.urgent && (
                        <p className="text-xs text-yellow-600 font-medium">Requires attention</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'approvals' && (
         <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Vendor Approval Queue</h2>
              <div className="text-sm text-gray-500">
                {pendingBusinesses.length} applications pending review
              </div>
            </div>

            {pendingBusinesses.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                <CheckCircle className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">All caught up!</h3>
                <p className="mt-2 text-gray-500">No pending vendor applications to review</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Business
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applied
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingBusinesses.map((business) => (
                        <tr key={business.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {business?.business_name}
                              </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {business?.contact_person_name || business?.profile?.full_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {business?.created_at ? new Date(business.created_at).toLocaleDateString() : 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => openApprovalModal(business)}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Review
                              </button>
                            </div>
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

        {activeTab === 'businesses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">All Businesses</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search businesses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredBusinesses.map((business) => (
                        <tr key={business.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
                                    <Building className="h-5 w-5 text-white" />
                                </div>
                                </div>
                                <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{business?.business_name}</div>
                                </div>
                            </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{business?.profile?.full_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                business?.approval_status === 'Approved' ? 'bg-green-100 text-green-800' :
                                business?.approval_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                                {business?.approval_status}
                            </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{business?.created_at ? new Date(business.created_at).toLocaleDateString() : ''}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => openApprovalModal(business)} className="text-sky-600 hover:text-sky-900">View Details</button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'accounting' && <AccountingPage />}
        {activeTab === 'analytics' && <PlatformAnalytics />}
      </div>

      {showApprovalModal && selectedBusiness && (
        <VendorApprovalModal
          business={selectedBusiness}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedBusiness(null);
          }}
          onApprove={(notes) => updateBusinessStatus(selectedBusiness.id, 'Approved', notes)}
          onReject={(notes) => updateBusinessStatus(selectedBusiness.id, 'Rejected', notes)}
          loading={actionLoading === selectedBusiness.id}
        />
      )}
    </div>
  );
}
