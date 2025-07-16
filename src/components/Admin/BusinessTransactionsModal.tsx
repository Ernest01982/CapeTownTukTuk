import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { supabase, Business, AccountingLedger } from '../../lib/supabase';

interface BusinessTransactionsModalProps {
  business: Business;
  onClose: () => void;
}

interface TransactionWithOrder extends AccountingLedger {
  order?: {
    id: string;
    created_at: string;
    customer: {
      full_name: string;
    };
  };
}

export function BusinessTransactionsModal({ business, onClose }: BusinessTransactionsModalProps) {
  const [transactions, setTransactions] = useState<TransactionWithOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [business.id]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('accounting_ledger')
        .select(`
          *,
          order:orders(
            id,
            created_at,
            customer:profiles(full_name)
          )
        `)
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = transactions
    .filter(t => t.transaction_type === 'SaleRevenue')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalPayouts = transactions
    .filter(t => t.transaction_type === 'VendorPayout')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const outstandingBalance = totalRevenue - totalPayouts;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-medium text-gray-900">{business.business_name}</h3>
            <p className="text-sm text-gray-500">Transaction History</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900">R{totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <TrendingDown className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">Total Paid Out</p>
                <p className="text-2xl font-bold text-blue-900">R{totalPayouts.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Outstanding</p>
                <p className="text-2xl font-bold text-yellow-900">R{outstandingBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h4 className="text-lg font-medium text-gray-900">All Transactions</h4>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No transactions yet</h3>
              <p className="mt-2 text-gray-500">Transactions will appear here once orders are completed</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.transaction_type === 'SaleRevenue'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {transaction.transaction_type === 'SaleRevenue' ? (
                            <>
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Revenue
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Payout
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.transaction_type === 'SaleRevenue' ? (
                          <>
                            Order from {transaction.order?.customer?.full_name || 'Customer'}
                            <div className="text-xs text-gray-500">
                              Order #{transaction.order?.id?.slice(0, 8)}
                            </div>
                          </>
                        ) : (
                          'Manual payout by admin'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={
                          transaction.transaction_type === 'SaleRevenue'
                            ? 'text-green-600'
                            : 'text-blue-600'
                        }>
                          {transaction.transaction_type === 'SaleRevenue' ? '+' : '-'}R{Number(transaction.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.payout_status === 'Paid'
                            ? 'bg-green-100 text-green-800'
                            : transaction.payout_status === 'Owed'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.payout_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}