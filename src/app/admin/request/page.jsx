'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ConfirmModal from '../../../components/ConfirmModal';
import { requestApi } from '../../../Services/request.service';
import { RequestStatus } from '../../../types/enums';
import { showSuccess, showError } from '../../../Services/toast.service';
import { CubeIcon, MagnifyingGlassIcon, TruckIcon, CheckIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Requested Purchases</h1>
            <p className="text-gray-600 mt-1">Manage and process branch requests</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
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
            placeholder="Search requests by product, status, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white text-gray-900"
            aria-label="Search requests"
          />
        </div>
      </div>


      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <CubeIcon className="w-5 h-5 text-purple-600" />
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
            ) : !filteredRequests.length ? (
              <div className="text-center py-12 col-span-full">
                <CubeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium text-lg">
                  {searchTerm ? 'No requests match your search.' : 'No requests found.'}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Requests will appear here when branches submit them.'}
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
                            {request.purchase?.productName}
                          </h3>
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${request.status === RequestStatus.REQUEST
                              ? 'bg-amber-100 text-amber-800'
                              : request.status === RequestStatus.ACCEPT
                                ? 'bg-emerald-100 text-emerald-800'
                                : request.status === RequestStatus.REJECT
                                  ? 'bg-red-100 text-red-800'
                                  : request.status === RequestStatus.IN_TRANSIT
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {request.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">{request.quantityRequested} {request.purchase?.unit}</span> requested
                          </p>
                          <p className="text-sm text-gray-600">
                            From <span className="font-medium">{request.requestingUser?.username}</span> to <span className="font-medium">{request.adminUser?.username}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
  
                    <div className="flex items-center space-x-2">
                      {request.status === RequestStatus.REQUEST && (
                        <>
                          <button
                            onClick={() => {
                              setActionRequest(request);
                              setActionType(RequestStatus.ACCEPT);
                              setShowConfirmAction(true);
                            }}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:border-emerald-300 transition-colors cursor-pointer"
                            title="Accept Request"
                          >
                            <CheckIcon className="h-4 w-4 mr-2" />
                            Accept
                          </button>
  
                          <button
                            onClick={() => {
                              setActionRequest(request);
                              setActionType(RequestStatus.REJECT);
                              setShowConfirmAction(true);
                            }}
                            className="cursor-pointer inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors"
                            title="Reject Request"
                          >
                            <XMarkIcon className="h-4 w-4 mr-2" />
                            Reject
                          </button>
                        </>
                      )}
  
                      {request.status === RequestStatus.ACCEPT && (
                        <button
                          onClick={() => {
                            setActionRequest(request);
                            setActionType(RequestStatus.IN_TRANSIT);
                            setShowConfirmAction(true);
                          }}
                          className="cursor-pointer inline-flex items-center px-4 py-2 text-sm font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 hover:border-sky-300 transition-colors"
                          title="Mark as In Transit"
                        >
                          <TruckIcon className="h-4 w-4 mr-2" />
                          Ship
                        </button>
                      )}
  
                      {request.status === RequestStatus.IN_TRANSIT && (
                        <button
                          onClick={() => {
                            setActionRequest(request);
                            setActionType(RequestStatus.DELIVERED);
                            setShowConfirmAction(true);
                          }}
                          className="cursor-pointer inline-flex items-center px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:border-emerald-300 transition-colors"
                          title="Mark as Delivered"
                        >
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Deliver
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