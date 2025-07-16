import React, { useState, useEffect } from 'react';
import { Plus, Package, TrendingUp, Users, DollarSign, Upload, Search, Filter } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Business, Product } from '../../lib/supabase';
import { ProductModal } from './ProductModal';
import { ProductCard } from './ProductCard';
import { BulkUploadModal } from './BulkUploadModal';
import { OrdersTab } from './OrdersTab';
import { AnalyticsTab } from './AnalyticsTab';

export function VendorDashboard() {
  const { profile } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAvailable, setFilterAvailable] = useState<'all' | 'available' | 'unavailable'>('all');

  useEffect(() => {
    if (profile) {
      fetchBusinessData();
    }
  }, [profile]);

  const fetchBusinessData = async () => {
    try {
      // Fetch business
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', profile?.id)
        .single();

      if (businessError && businessError.code !== 'PGRST116') {
        throw businessError;
      }

      setBusiness(businessData);

      // Fetch products if business exists
      if (businessData) {
        await fetchProducts(businessData.id);
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (businessId: string) => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleProductSave = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    if (business) {
      fetchProducts(business.id);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;
      
      if (business) {
        fetchProducts(business.id);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const handleToggleAvailability = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !product.is_available })
        .eq('id', product.id);

      if (error) throw error;
      
      if (business) {
        fetchProducts(business.id);
      }
    } catch (error) {
      console.error('Error updating product availability:', error);
      alert('Failed to update product availability. Please try again.');
    }
  };

  const handleBulkUploadComplete = () => {
    setShowBulkUploadModal(false);
    if (business) {
      fetchProducts(business.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Package className="mx-auto h-16 w-16 text-gray-400" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Set up your business</h2>
            <p className="mt-2 text-gray-600">
              Create your business profile to start selling on TukTuk
            </p>
            <button className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-sky-500 to-orange-500 hover:shadow-lg transition-all duration-200">
              <Plus className="mr-2 h-5 w-5" />
              Create Business Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Products',
      value: products.length.toString(),
      icon: Package,
      color: 'text-sky-600',
      bgColor: 'bg-sky-100'
    },
    {
      name: 'Available Products',
      value: products.filter(p => p.is_available).length.toString(),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Total Orders',
      value: '12',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'Revenue (This Month)',
      value: 'R12,450',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  // Filter products based on search and availability
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterAvailable === 'all' ||
                         (filterAvailable === 'available' && product.is_available) ||
                         (filterAvailable === 'unavailable' && !product.is_available);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{business.business_name}</h1>
                <p className="text-gray-600">
                  Status: <span className={`font-medium ${
                    business.approval_status === 'Approved' ? 'text-green-600' :
                    business.approval_status === 'Pending' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {business.approval_status}
                  </span>
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowBulkUploadModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Upload
                </button>
                <button
                  onClick={() => setShowProductModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-sky-500 to-orange-500 hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-6">
              <nav className="flex space-x-8">
                {[
                  { id: 'overview', name: 'Overview' },
                  { id: 'products', name: 'Products', count: products.length },
                  { id: 'orders', name: 'Orders' },
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
                    {tab.count !== undefined && (
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

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowProductModal(true)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Plus className="h-8 w-8 text-sky-500 mb-2" />
                  <h4 className="font-medium text-gray-900">Add New Product</h4>
                  <p className="text-sm text-gray-500">Add a single product to your catalog</p>
                </button>
                
                <button
                  onClick={() => setShowBulkUploadModal(true)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Upload className="h-8 w-8 text-green-500 mb-2" />
                  <h4 className="font-medium text-gray-900">Bulk Upload</h4>
                  <p className="text-sm text-gray-500">Upload multiple products via CSV</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('orders')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Package className="h-8 w-8 text-purple-500 mb-2" />
                  <h4 className="font-medium text-gray-900">Manage Orders</h4>
                  <p className="text-sm text-gray-500">View and process customer orders</p>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">New order received</p>
                        <p className="text-sm text-gray-500">Order #TT-{1000 + item} • R125.50</p>
                      </div>
                      <div className="text-sm text-gray-500">2 min ago</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Products Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Your Products</h2>
                <p className="text-sm text-gray-500">Manage your product catalog</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowBulkUploadModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Upload
                </button>
                <button
                  onClick={() => setShowProductModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-sky-500 to-orange-500 hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <select
                    value={filterAvailable}
                    onChange={(e) => setFilterAvailable(e.target.value as any)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="all">All Products</option>
                    <option value="available">Available Only</option>
                    <option value="unavailable">Unavailable Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                <Package className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {products.length === 0 ? 'No products yet' : 'No products match your search'}
                </h3>
                <p className="mt-2 text-gray-500">
                  {products.length === 0 
                    ? 'Start by adding your first product' 
                    : 'Try adjusting your search or filters'
                  }
                </p>
                {products.length === 0 && (
                  <div className="mt-6 flex justify-center space-x-3">
                    <button
                      onClick={() => setShowProductModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-sky-500 to-orange-500 hover:shadow-lg transition-all duration-200"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Product
                    </button>
                    <button
                      onClick={() => setShowBulkUploadModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Bulk Upload
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                    onToggleAvailability={handleToggleAvailability}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && business && (
          <OrdersTab business={business} />
        )}

        {activeTab === 'analytics' && business && (
          <AnalyticsTab business={business} />
        )}
      </div>

      {/* Modals */}
      {showProductModal && business && (
        <ProductModal
          business={business}
          product={editingProduct}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          onSave={handleProductSave}
        />
      )}

      {showBulkUploadModal && business && (
        <BulkUploadModal
          business={business}
          onClose={() => setShowBulkUploadModal(false)}
          onComplete={handleBulkUploadComplete}
        />
      )}
    </div>
  );
}