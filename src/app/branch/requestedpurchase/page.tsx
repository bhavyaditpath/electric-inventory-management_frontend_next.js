'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { requestApi } from '../../../Services/request.service';
import { RequestResponseDto } from '../../../types/api-types';
import { RequestStatus } from '../../../types/enums';
import { showSuccess, showError } from '../../../Services/toast.service';
import { MagnifyingGlassIcon, CubeIcon, CheckCircleIcon, TruckIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const RequestedPurchasePage: React.FC = () => {
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requests, setRequests] = useState<RequestResponseDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  // Load requests
  const loadRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const response = await requestApi.getRequests();
      if (response.success) {
        setRequests(Array.isArray(response.data) ? response.data : []);
      } else {
        showError(response.message || 'Failed to load requests');
        setRequests([]);
      }
    } catch (err) {
      setRequests([]);
      console.error('Failed to load requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const filteredRequests = requests.filter(request =>
    request.purchase?.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusUpdate = async (requestId: number, newStatus: string) => {
    try {
      const response = await requestApi.updateRequestStatus(requestId, newStatus);
      if (response.success) {
        showSuccess(`Status updated to ${newStatus}`);
        loadRequests();
      } else {
        showError(response.message || 'Failed to update status');
      }
    } catch (err) {
      showError('Failed to update status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case RequestStatus.REQUEST:
        return <ClockIcon className="h-4 w-4" />;
      case RequestStatus.IN_TRANSIT:
        return <TruckIcon className="h-4 w-4" />;
      case RequestStatus.DELIVERED:
        return <CheckCircleIcon className="h-4 w-4" />;
      case RequestStatus.REJECT:
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <CubeIcon className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case RequestStatus.REQUEST:
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case RequestStatus.IN_TRANSIT:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case RequestStatus.DELIVERED:
        return `${baseClasses} bg-green-100 text-green-800`;
      case RequestStatus.REJECT:
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Requested Purchases</h1>
        <div className="text-sm text-gray-600">
          {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by product name or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <CubeIcon className="h-6 w-6 mr-2 text-gray-600" />
            Requested Purchase Items
          </h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {loadingRequests ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-500">Loading requests...</span>
              </div>
            ) : !filteredRequests || filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No requests match your search.' : 'No requests found.'}
                </p>
              </div>
            ) : (
              filteredRequests.map(request => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <CubeIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <h3 className="font-medium text-gray-900">{request.purchase?.productName || 'Unknown Product'}</h3>
                      </div>

                      <p className="text-sm text-gray-600 mb-1">
                        Quantity: {request.quantityRequested}
                      </p>

                      {/* NEW: Requesting User */}
                      <p className="text-sm text-gray-600 mb-1">
                        Requested By: <span className="font-medium">{request.requestingUser?.username}</span>
                      </p>

                      {/* NEW: Admin User */}
                      <p className="text-sm text-gray-600 mb-1">
                        Assigned Admin: <span className="font-medium">{request.adminUser?.username || "Not Assigned"}</span>
                      </p>

                      <div className="flex items-center mb-1">
                        <span className="text-sm text-gray-600 mr-2">Status:</span>
                        <span className={getStatusBadge(request.status)}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{request.status}</span>
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Requested: {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      {request.status === RequestStatus.IN_TRANSIT && (
                        <button
                          onClick={() => handleStatusUpdate(request.id, RequestStatus.DELIVERED)}
                          className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm font-medium transition-colors flex items-center"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Mark as Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestedPurchasePage;