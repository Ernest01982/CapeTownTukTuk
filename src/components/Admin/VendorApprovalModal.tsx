import React, { useState } from 'react';
import { X, Building, User, MapPin, Phone, Mail, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Business } from '../../lib/supabase';

interface VendorApprovalModalProps {
  business: Business;
  onClose: () => void;
  onApprove: (notes?: string) => void;
  onReject: (notes?: string) => void;
  loading: boolean;
}

export function VendorApprovalModal({ business, onClose, onApprove, onReject, loading }: VendorApprovalModalProps) {
  const [notes, setNotes] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  const handleSubmit = () => {
    if (action === 'approve') {
      onApprove(notes);
    } else if (action === 'reject') {
      onReject(notes);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium text-gray-900">Vendor Application Review</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Business Information */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">Business Details</h4>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Name</label>
                  <p className="mt-1 text-sm text-gray-900">{business.business_name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {business.business_description || 'No description provided'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Address</label>
                  <div className="mt-1 flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <p className="text-sm text-gray-900">{business.address_text}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Application Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(business.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">Contact Information</h4>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Owner Name</label>
                  <p className="mt-1 text-sm text-gray-900">{business.profile?.full_name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {business.contact_person_name || business.profile?.full_name}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{business.profile?.email}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {business.profile?.phone_number || 'No phone number provided'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Review Section */}
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Review Checklist</h4>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" defaultChecked />
                  <span className="text-sm text-gray-700">Business name is appropriate and professional</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" defaultChecked />
                  <span className="text-sm text-gray-700">Contact information is complete</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" defaultChecked />
                  <span className="text-sm text-gray-700">Business address is valid and specific</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" defaultChecked />
                  <span className="text-sm text-gray-700">Business type is suitable for platform</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" defaultChecked />
                  <span className="text-sm text-gray-700">No duplicate or suspicious applications</span>
                </div>
              </div>
            </div>

            {/* Decision Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Review Decision</h4>
              
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setAction('approve')}
                    className={`flex-1 flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
                      action === 'approve'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Approve
                  </button>
                  
                  <button
                    onClick={() => setAction('reject')}
                    className={`flex-1 flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
                      action === 'reject'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Reject
                  </button>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes {action === 'reject' && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="notes"
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={
                        action === 'approve'
                          ? 'Optional: Add any notes about the approval...'
                          : action === 'reject'
                          ? 'Required: Explain why this application is being rejected...'
                          : 'Add review notes...'
                      }
                    />
                  </div>
                  {action === 'reject' && (
                    <p className="mt-1 text-sm text-red-600">
                      Please provide a reason for rejection to help the vendor understand the decision.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={!action || loading || (action === 'reject' && !notes.trim())}
                className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                  action === 'approve'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : action === 'reject'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? 'Processing...' : action === 'approve' ? 'Approve Business' : action === 'reject' ? 'Reject Application' : 'Select Action'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}