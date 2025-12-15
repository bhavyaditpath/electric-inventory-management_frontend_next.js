'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { requestApi } from '../../../Services/request.service';
import { RequestResponseDto, PaginatedResponse } from '../../../types/api-types';
import { RequestStatus } from '../../../types/enums';
import { showSuccess, showError } from '../../../Services/toast.service';
import { MagnifyingGlassIcon, CubeIcon, CheckCircleIcon, TruckIcon, XCircleIcon, ClockIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const RequestedPurchasePage = () => {
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requests, setRequests] = useState<RequestResponseDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  // Load requests
  const loadRequests = useCallback(async (currentPage = page, currentPageSize = pageSize) => {
    try {
      setLoadingRequests(true);
      const response = await requestApi.getRequests({ page: currentPage, pageSize: currentPageSize });
      if (response.success) {
        const data = response.data as PaginatedResponse<RequestResponseDto>;
        setRequests(Array.isArray(data.items) ? data.items : []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 0);
      } else {
        showError(response.message || 'Failed to load requests');
        setRequests([]);
        setTotal(0);
        setTotalPages(0);
      }
    } catch (err) {
      setRequests([]);
      setTotal(0);
      setTotalPages(0);
      console.error('Failed to load requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  }, [page, pageSize]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadRequests(newPage, pageSize);
  };

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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="flex items-center text-3xl font-bold text-gray-900">
          <CubeIcon className="h-7 w-7 mr-2 text-gray-600" />
          Requested Purchases
        </h1>

        <p className="text-gray-600 mt-2">Track the status of your purchase requests</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search requests by product, status, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10 pr-4 py-2 text-gray-700"
            aria-label="Search requests"
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">All Requests</h2>
        <div className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestedPurchasePage;
