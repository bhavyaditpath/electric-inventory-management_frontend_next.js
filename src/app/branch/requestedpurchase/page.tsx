'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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

  const firstLoad = useRef(false);
  // Load requests
  const loadRequests = useCallback(async (currentPage = page, currentPageSize = pageSize, currentSearchTerm = searchTerm) => {
    try {
      setLoadingRequests(true);
      const response = await requestApi.getRequests({
        page: currentPage,
        pageSize: currentPageSize,
        search: currentSearchTerm || undefined
      });
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
  }, [page, pageSize, searchTerm]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadRequests(newPage, pageSize);
  };

  useEffect(() => {
    if (!firstLoad.current) {
      firstLoad.current = true;
      loadRequests();
    }
  }, [loadRequests]);

  // Reload requests when search term changes
  useEffect(() => {
    setPage(1); // Reset to first page when searching
    loadRequests(1, pageSize, searchTerm);
  }, [searchTerm]);

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

  return (
    <div className="p-4 sm:p-6 bg-[var(--theme-bg)] text-[var(--theme-text)] min-h-screen">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--theme-text)]">Requested Purchases</h1>
            <p className="text-[var(--theme-text-muted)] mt-1 text-sm sm:text-base">Track the status of your purchase requests</p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-3 py-2 sm:px-4 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg hover:bg-[var(--theme-surface-muted)] transition-colors text-sm sm:text-base"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1 sm:mr-2 text-[var(--theme-text-muted)]" />
              <span className="text-[var(--theme-text)]">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 sm:mb-8">
        <div className="relative max-w-md mx-auto sm:mx-0">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-[var(--theme-text-muted)]" />
          </div>
          <input
            type="text"
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-[var(--theme-border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-[var(--theme-surface)] text-[var(--theme-text)] text-sm sm:text-base"
            aria-label="Search requests"
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)] shadow-sm">
        <div className="px-4 sm:px-6 py-4 border-b border-[var(--theme-border)]">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
              <CubeIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--theme-text)]">All Requests</h2>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {loadingRequests ? (
              <div className="col-span-full flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : !requests.length ? (
              <div className="text-center py-12 col-span-full">
                <CubeIcon className="w-16 h-16 text-[var(--theme-text-muted)] mx-auto mb-4" />
                <p className="text-[var(--theme-text-muted)] font-medium text-lg">
                  {searchTerm ? 'No requests match your search.' : 'No requests found.'}
                </p>
                <p className="text-[var(--theme-text-muted)] text-sm mt-1">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Your purchase requests will appear here.'}
                </p>
              </div>
            ) : (
              requests.map((request: RequestResponseDto) => (
                <div key={request.id} className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col space-y-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col space-y-2 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 sm:space-x-3">
                        <h3 className="text-base sm:text-lg font-semibold text-[var(--theme-text)] truncate">
                          {request.purchase?.productName || 'Unknown Product'}
                        </h3>
                        <span
                          className={`px-2 py-1 sm:px-3 text-xs font-medium rounded-full self-start sm:self-auto flex-shrink-0 ${request.status === RequestStatus.REQUEST
                            ? 'bg-amber-100 text-amber-800'
                            : request.status === RequestStatus.IN_TRANSIT
                              ? 'bg-sky-100 text-sky-800'
                              : request.status === RequestStatus.DELIVERED
                                ? 'bg-emerald-100 text-emerald-800'
                                : request.status === RequestStatus.REJECT
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-[var(--theme-surface-muted)] text-[var(--theme-text)]'
                            }`}
                        >
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1">
                        <p className="text-sm text-[var(--theme-text-muted)]">
                          <span className="font-medium">{request.quantityRequested}</span> units requested
                        </p>
                        <p className="text-sm text-[var(--theme-text-muted)]">
                          Assigned to <span className="font-medium">{request.adminUser?.username || "Not Assigned"}</span>
                        </p>
                        <p className="text-xs text-[var(--theme-text-muted)]">
                          Requested on {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-start pt-0">
                      {request.status === RequestStatus.IN_TRANSIT && (
                        <button
                          onClick={() => handleStatusUpdate(request.id, RequestStatus.DELIVERED)}
                          className="cursor-pointer inline-flex items-center px-3 py-2 sm:px-4 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:border-emerald-300 transition-colors w-full sm:w-auto justify-center"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          <span className="hidden xs:inline">Mark Delivered</span>
                          <span className="xs:hidden">Deliver</span>
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
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 px-4 sm:px-6 py-4">
              <div className="text-sm text-[var(--theme-text)] text-center sm:text-left">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} results
              </div>
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-[var(--theme-text-muted)] bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-md hover:bg-[var(--theme-surface-muted)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
                <span className="text-sm text-[var(--theme-text)] px-3 py-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-[var(--theme-text-muted)] bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-md hover:bg-[var(--theme-surface-muted)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="hidden sm:inline">Next</span>
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

