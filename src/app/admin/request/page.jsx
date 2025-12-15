'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ConfirmModal from '../../../components/ConfirmModal';
import { requestApi } from '../../../Services/request.service';
import { RequestStatus } from '../../../types/enums';
import { showSuccess, showError } from '../../../Services/toast.service';
import { CubeIcon, MagnifyingGlassIcon, TruckIcon, CheckIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const RequestPage = () => {
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmAction, setShowConfirmAction] = useState(false);
  const [actionRequest, setActionRequest] = useState(null);
  const [actionType, setActionType] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ✔ Load requests
  const loadRequests = useCallback(async (currentPage = page, currentPageSize = pageSize) => {
    try {
      setLoadingRequests(true);
      const response = await requestApi.getRequests({ page: currentPage, pageSize: currentPageSize });

      if (response.success) {
        const data = response.data;
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
      console.error('Failed to load requests:', err);
      setRequests([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoadingRequests(false);
    }
  }, [page, pageSize]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    loadRequests(newPage, pageSize);
  };

  const firstLoad = useRef(false);
  useEffect(() => {
    if (!firstLoad.current) {
      firstLoad.current = true;
      loadRequests();
    }
  }, [loadRequests]);

  // Filter requests based on search term
  const filteredRequests = requests.filter(request =>
    request.purchase?.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.requestingUser?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.adminUser?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // API call every 5000 millisecond
  // useEffect(() => {
  //   const interval = setInterval(loadRequests, 5000);
  //   return () => clearInterval(interval);
  // }, [loadRequests, searchTerm]);

  const handleAction = async () => {
    if (!actionRequest) return;

    try {
      const response = await requestApi.updateRequestStatus(actionRequest.id, actionType);

      if (response.success) {
        showSuccess(response.message || `Request ${actionType}`);
        loadRequests();
      } else {
        showError(response.message || 'Failed to update request status');
      }
    } catch {
      showError('Failed to update request status');
    } finally {
      setShowConfirmAction(false);
      setActionRequest(null);
      setActionType('');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="flex items-center text-3xl font-bold text-gray-900">
          <CubeIcon className="h-7 w-7 mr-2 text-gray-600" />
          Requested Purchases
        </h1>
        <p className="text-gray-600 mt-2">Manage and process branch requests</p>
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


      <div className="card">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">All Requests</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
          {loadingRequests ? (
            <p className="text-gray-500">Loading requests...</p>
          ) : !filteredRequests.length ? (
            <div className="text-center py-8 col-span-full">
              <p className="text-gray-500">
                {searchTerm ? 'No requests match your search.' : 'No requests found.'}
              </p>
            </div>
          ) : (
            filteredRequests.map(request => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-600">
                        {request.purchase?.productName}
                      </h3>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${request.status === RequestStatus.REQUEST
                          ? 'bg-yellow-100 text-yellow-800'
                          : request.status === RequestStatus.ACCEPT
                            ? 'bg-green-100 text-green-800'
                            : request.status === RequestStatus.REJECT
                              ? 'bg-red-100 text-red-800'
                              : request.status === RequestStatus.IN_TRANSIT
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600">
                      Quantity Requested: {request.quantityRequested} {request.purchase?.unit}
                    </p>

                    <p className="text-sm text-gray-600">
                      From: {request.requestingUser?.username} To: {request.adminUser?.username}
                    </p>

                    <p className="text-xs text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {request.status === RequestStatus.REQUEST && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setActionRequest(request);
                          setActionType(RequestStatus.ACCEPT);
                          setShowConfirmAction(true);
                        }}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Accept"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => {
                          setActionRequest(request);
                          setActionType(RequestStatus.REJECT);
                          setShowConfirmAction(true);
                        }}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Reject"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {request.status === RequestStatus.ACCEPT && (
                    <button
                      onClick={() => {
                        setActionRequest(request);
                        setActionType(RequestStatus.IN_TRANSIT);
                        setShowConfirmAction(true);
                      }}
                      className="btn btn-primary btn-sm"
                      title="Mark In Transit"
                    >
                      <TruckIcon className="h-4 w-4" />
                    </button>
                  )}

                  {request.status === RequestStatus.IN_TRANSIT && (
                    <button
                      onClick={() => {
                        setActionRequest(request);
                        setActionType(RequestStatus.DELIVERED);
                        setShowConfirmAction(true);
                      }}
                      className="btn btn-secondary btn-sm"
                      title="Mark Delivered"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-2">
            <div className="text-sm text-gray-700 p-2">
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

      <ConfirmModal
        isOpen={showConfirmAction}
        onClose={() => setShowConfirmAction(false)}
        title={`Confirm ${actionType}`}
        message={`Are you sure you want to ${actionType.toLowerCase()} this request?`}
        onConfirm={handleAction}
        confirmLabel={actionType}
        variant={actionType === RequestStatus.REJECT ? 'danger' : 'info'}
      />
    </div>
  );
};

export default RequestPage;