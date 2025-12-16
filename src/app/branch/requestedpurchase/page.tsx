'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { requestApi } from '../../../Services/request.service';
import { RequestResponseDto, PaginatedResponse } from '../../../types/api-types';
import { RequestStatus } from '../../../types/enums';
import { showSuccess, showError } from '../../../Services/toast.service';
import { MagnifyingGlassIcon, CubeIcon, CheckCircleIcon, TruckIcon, XCircleIcon, ClockIcon, ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Requested Purchases</h1>
            <p className="text-gray-600 mt-1">Track the status of your purchase requests</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2 text-gray-600" />
            <span className="text-gray-700">Refresh</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search requests by product or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white text-gray-900"
            aria-label="Search requests"
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
              <CubeIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">All Requests</h2>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loadingRequests ? (
              <div className="col-span-full flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : !filteredRequests || filteredRequests.length === 0 ? (
              <div className="text-center py-12 col-span-full">
                <CubeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium text-lg">
                  {searchTerm ? 'No requests match your search.' : 'No requests found.'}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Your purchase requests will appear here.'}
                </p>
              </div>
            ) : (
              filteredRequests.map(request => (
                <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.purchase?.productName || 'Unknown Product'}
                          </h3>
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${request.status === RequestStatus.REQUEST
                              ? 'bg-amber-100 text-amber-800'
                              : request.status === RequestStatus.IN_TRANSIT
                                ? 'bg-sky-100 text-sky-800'
                                : request.status === RequestStatus.DELIVERED
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : request.status === RequestStatus.REJECT
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {request.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">{request.quantityRequested}</span> units requested
                          </p>
                          <p className="text-sm text-gray-600">
                            Assigned to <span className="font-medium">{request.adminUser?.username || "Not Assigned"}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Requested on {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {request.status === RequestStatus.IN_TRANSIT && (
                        <button
                          onClick={() => handleStatusUpdate(request.id, RequestStatus.DELIVERED)}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:border-emerald-300 transition-colors"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
          )}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4">
              <div className="text-sm text-gray-700">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-1" />
                  Previous
                </button>
                <span className="text-sm text-gray-700 px-3 py-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default RequestedPurchasePage;
