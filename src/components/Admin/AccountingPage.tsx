import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, Eye, Plus, Calendar } from 'lucide-react';
import { supabase, Business, AccountingLedger } from '../../lib/supabase';
import { PayoutModal } from './PayoutModal';
import { BusinessTransactionsModal } from './BusinessTransactionsModal';

interface VendorSummary {
  business: Business;
  totalRevenue: number;
  totalPaidOut: number;
  outstandingBalance: number;
  transactionCount: number;
}

export function AccountingPage() {
  const [vendorSummaries, setVendorSummaries] = useState<VendorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);

  useEffect(() => {
    fetchVendorSummaries();
  }, []);

  const fetchVendorSummaries = async () => {
    try {
      // Fetch all approved businesses
      const { data: businesses, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('approval_status', 'Approved')
        .order('business_name');

      if (businessError) throw businessError;

      // Fetch all ledger entries
      const { data: ledgerEntries, error: ledgerError } = await supabase
        .from('accounting_ledger')
        .select('*');

      if (ledgerError) throw ledgerError;

      // Calculate summaries for each business
      const summaries: VendorSummary[] = businesses.map(business => {
        const businessEntries = ledgerEntries.filter(entry => entry.business_id === business.id);
        
        const totalRevenue = businessEntries
          .filter(entry => entry.transaction_type === 'SaleRevenue')
          .reduce((sum, entry) => sum + Number(entry.amount), 0);
        
        const totalPaidOut = businessEntries
          .filter(entry => entry.transaction_type === 'VendorPayout')
          .reduce((sum, entry) => sum + Number(entry.amount), 0);
        
        const outstandingBalance = totalRevenue - totalPaidOut;

        return {
          business,
          totalRevenue,
          totalPaidOut,
          outstandingBalance,
          transactionCount: businessEntries.length
        };
      });

      setVendorSummaries(summaries);
    } catch (error) {
      console.error('Error fetching vendor summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutComplete = () => {
    setShowPayoutModal(false);
    setSelectedBusiness(null);
    fetchVendorSummaries(); // Refresh data
  };

  const openPayoutModal = (business: Business) => {
    setSelectedBusiness(business);
    setShowPayoutModal(true);
  };

  const openTransactionsModal = (business: Business) => {
    setSelectedBusiness(business);
    setShowTransactionsModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  const totalPlatformRevenue = vendorSummaries.reduce((sum, vendor) => sum + vendor.totalRevenue, 0);
  const totalOutstanding = vendorSummaries.reduce((sum, vendor) => sum + vendor.outstandingBalance, 0);
  const totalPaidOut = vendorSummaries.reduce((sum, vendor) => sum + vendor.totalPaidOut, 0);

  const stats = [
    {
      name: 'Total Platform Revenue',
      value: `R${totalPlatformRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Outstanding Payouts',
      value: `R${totalOutstanding.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      name: 'Total Paid Out',
      value: `R${totalPaidOut.toFixed(2)}`,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Active Vendors',
      value: vendorSummaries.length.toString(),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vendor Payouts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Vendor Payouts Dashboard</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage vendor payments and track outstanding balances
          </p>
        </div>
        
        {vendorSummaries.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No vendor data</h3>
            <p className="mt-2 text-gray-500">No approved vendors with transactions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Paid Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outstanding Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendorSummaries.map((vendor) => (
                  <tr key={vendor.business.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <button
                          onClick={() => openTransactionsModal(vendor.business)}
                          className="text-sm font-medium text-sky-600 hover:text-sky-900 transition-colors"
                        >
                          {vendor.business.business_name}
                        </button>
                        <div className="text-sm text-gray-500">
                          {vendor.business.business_description?.slice(0, 40)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        R{vendor.totalRevenue.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        R{vendor.totalPaidOut.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        vendor.outstandingBalance > 0 ? 'text-yellow-600' : 'text-gray-900'
                      }`}>
                        R{vendor.outstandingBalance.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {vendor.transactionCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openTransactionsModal(vendor.business)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </button>
                        {vendor.outstandingBalance > 0 && (
                          <button
                            onClick={() => openPayoutModal(vendor.business)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Log Payout
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showPayoutModal && selectedBusiness && (
        <PayoutModal
          business={selectedBusiness}
          onClose={() => {
            setShowPayoutModal(false);
            setSelectedBusiness(null);
          }}
          onComplete={handlePayoutComplete}
        />
      )}

      {showTransactionsModal && selectedBusiness && (
        <BusinessTransactionsModal
          business={selectedBusiness}
          onClose={() => {
            setShowTransactionsModal(false);
            setSelectedBusiness(null);
          }}
        />
      )}
    </div>
  );
}