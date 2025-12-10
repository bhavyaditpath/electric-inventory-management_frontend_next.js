'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ConfirmModal from '../../../components/ConfirmModal';
import { requestApi } from '../../../Services/request.service';
import { RequestStatus } from '../../../types/enums';
import { showSuccess, showError } from '../../../Services/toast.service';
import { TruckIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const RequestPage = () => {
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requests, setRequests] = useState([]);

  const [showConfirmAction, setShowConfirmAction] = useState(false);
  const [actionRequest, setActionRequest] = useState(null);
  const [actionType, setActionType] = useState('');

  // ✔ Load requests
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
      console.error('Failed to load requests:', err);
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  const firstLoad = useRef(false);
  useEffect(() => {
    if (!firstLoad.current) {
      firstLoad.current = true;
      loadRequests();
    }
  }, [loadRequests]);

  // API call every 5000 millisecond
  // useEffect(() => {
  //   const interval = setInterval(loadRequests, 5000);
  //   return () => clearInterval(interval);
  // }, [loadRequests]);

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Request Management</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">All Requests</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {loadingRequests ? (
            <p className="text-gray-500">Loading requests...</p>
          ) : !requests.length ? (
            <p className="text-gray-500">No requests found.</p>
          ) : (
            requests.map(request => (
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
                      className="p-1 text-blue-600 hover:text-blue-800"
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
                      className="p-1 text-purple-600 hover:text-purple-800"
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