import React, { useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase, Business } from '../../lib/supabase';

interface BulkUploadModalProps {
  business: Business;
  onClose: () => void;
  onComplete: () => void;
}

interface ProductRow {
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_available: boolean;
}

export function BulkUploadModal({ business, onClose, onComplete }: BulkUploadModalProps) {
  const [csvData, setCsvData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewData, setPreviewData] = useState<ProductRow[]>([]);

  const downloadTemplate = () => {
    const template = `name,description,price,category,image_url,is_available
"Margherita Pizza","Classic pizza with tomato sauce, mozzarella, and fresh basil",85.00,"Food","https://example.com/pizza.jpg",true
"Chicken Burger","Grilled chicken breast with lettuce, tomato, and mayo",65.00,"Food","https://example.com/burger.jpg",true
"Chocolate Cake","Rich chocolate cake with chocolate frosting",45.00,"Desserts","",true`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCsvData = (csv: string): ProductRow[] => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const expectedHeaders = ['name', 'description', 'price', 'category', 'image_url', 'is_available'];
    
    // Validate headers
    const hasAllHeaders = expectedHeaders.every(header => 
      headers.some(h => h.toLowerCase() === header.toLowerCase())
    );
    
    if (!hasAllHeaders) {
      throw new Error('CSV must contain columns: name, description, price, category, image_url, is_available');
    }

    const products: ProductRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      if (values.length !== headers.length) continue;

      const product: any = {};
      headers.forEach((header, index) => {
        const key = header.toLowerCase();
        let value = values[index];
        
        if (key === 'price') {
          product[key] = parseFloat(value) || 0;
        } else if (key === 'is_available') {
          product[key] = value.toLowerCase() === 'true';
        } else {
          product[key] = value;
        }
      });

      if (product.name && product.price > 0) {
        products.push(product);
      }
    }

    return products;
  };

  const handlePreview = () => {
    try {
      setError('');
      const products = parseCsvData(csvData);
      setPreviewData(products);
      setSuccess(`Parsed ${products.length} products successfully`);
    } catch (err: any) {
      setError(err.message);
      setPreviewData([]);
    }
  };

  const handleUpload = async () => {
    if (previewData.length === 0) {
      setError('No valid products to upload');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First, get or create categories
      const categoryNames = [...new Set(previewData.map(p => p.category).filter(Boolean))];
      const categoryMap: Record<string, string> = {};

      for (const categoryName of categoryNames) {
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('name', categoryName)
          .single();

        if (existingCategory) {
          categoryMap[categoryName] = existingCategory.id;
        } else {
          const { data: newCategory, error } = await supabase
            .from('categories')
            .insert({ name: categoryName })
            .select('id')
            .single();

          if (error) throw error;
          categoryMap[categoryName] = newCategory.id;
        }
      }

      // Prepare products for insertion
      const productsToInsert = previewData.map(product => ({
        business_id: business.id,
        name: product.name,
        description: product.description || null,
        price: product.price,
        category_id: product.category ? categoryMap[product.category] : null,
        image_url: product.image_url || null,
        is_available: product.is_available
      }));

      // Insert products
      const { error: insertError } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (insertError) throw insertError;

      setSuccess(`Successfully uploaded ${productsToInsert.length} products!`);
      setTimeout(() => {
        onComplete();
      }, 1500);

    } catch (err: any) {
      console.error('Error uploading products:', err);
      setError(err.message || 'Failed to upload products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-medium text-gray-900">Bulk Upload Products</h3>
            <p className="text-sm text-gray-500 mt-1">Upload multiple products using CSV format</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Download the CSV template to see the required format</li>
              <li>Fill in your product data following the template structure</li>
              <li>Paste your CSV data in the text area below</li>
              <li>Click "Preview" to validate your data</li>
              <li>Click "Upload Products" to add them to your catalog</li>
            </ol>
          </div>

          {/* Download Template */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">CSV Template</h4>
              <p className="text-sm text-gray-600">Download a sample CSV file with the correct format</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </button>
          </div>

          {/* CSV Input */}
          <div>
            <label htmlFor="csvData" className="block text-sm font-medium text-gray-700 mb-2">
              CSV Data
            </label>
            <textarea
              id="csvData"
              rows={8}
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-sm"
              placeholder="Paste your CSV data here..."
            />
          </div>

          {/* Preview Button */}
          <div className="flex justify-center">
            <button
              onClick={handlePreview}
              disabled={!csvData.trim()}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Preview Data
            </button>
          </div>

          {/* Preview Table */}
          {previewData.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Preview ({previewData.length} products)</h4>
              <div className="overflow-x-auto max-h-64 border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.slice(0, 10).map((product, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{product.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">R{product.price}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{product.category || '-'}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            product.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.is_available ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 10 && (
                  <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50">
                    ... and {previewData.length - 10} more products
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={loading || previewData.length === 0}
            className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Products
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}