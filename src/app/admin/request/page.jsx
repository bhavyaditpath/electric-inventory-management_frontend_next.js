'use client';

import React, { useState, useEffect, useCallback } from 'react';
import InputField from '../../../components/InputField';
import ConfirmModal from '../../../components/ConfirmModal';
import { requestApi } from '../../../Services/request.service';
import { purchaseApi } from '../../../Services/purchase.service';
import { UserRole, RequestStatus } from '../../../types/enums';
import { showSuccess, showError } from '../../../Services/toast.service';
import { useAuth } from '../../../contexts/AuthContext';
import { TruckIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const RequestPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isBranch = user?.role === UserRole.BRANCH;

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requests, setRequests] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);

  const [showConfirmAction, setShowConfirmAction] = useState(false);
  const [actionRequest, setActionRequest] = useState(null);
  const [actionType, setActionType] = useState('');

  const [formData, setFormData] = useState({
    adminUserId: 0,
    purchaseId: 0,
    quantityRequested: 0,
  });

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (formData.adminUserId === 0) newErrors.adminUserId = "Please select an Admin user";
    if (formData.purchaseId === 0) newErrors.purchaseId = "Please select a purchase";
    if (formData.quantityRequested <= 0) newErrors.quantityRequested = "Quantity must be greater than 0";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Load requests
  const loadRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const response = await requestApi.getRequests();
      setRequests(Array.isArray(response) ? response : []);
    } catch (err) {
      setRequests([]);
      console.error('Failed to load requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  // Load purchases and admins
  useEffect(() => {
    const loadData = async () => {
      try {
        const [purchasesRes, adminsRes] = await Promise.all([
          purchaseApi.getPurchases(),
          requestApi.getAdminsForDropdown()
        ]);
        setPurchases(Array.isArray(purchasesRes) ? purchasesRes : []);
        setAdminUsers(Array.isArray(adminsRes) ? adminsRes : []);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: ['adminUserId', 'purchaseId', 'quantityRequested'].includes(name) ? Number(value) : value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Submit request
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showError("Please fix the errors in the form.");
      return;
    }

    setLoading(true);
    try {
      await requestApi.createRequest(formData);
      showSuccess('Request submitted successfully');
      setFormData({
        adminUserId: 0,
        purchaseId: 0,
        quantityRequested: 0,
      });
      loadRequests();
    } catch (err) {
      showError('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  // Handle admin actions
  const handleAction = async () => {
    if (!actionRequest) return;
    try {
      await requestApi.updateRequestStatus(actionRequest.id, actionType);
      showSuccess(`Request ${actionType.toLowerCase().replace('_', ' ')}`);
      loadRequests();
    } catch (err) {
      showError('Failed to update request status');
    } finally {
      setShowConfirmAction(false);
      setActionRequest(null);
      setActionType('');
    }
  };

  // Polling for updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadRequests();
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [loadRequests]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">
        {isAdmin ? 'Request Management' : 'Product Requests'}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Request Form for Branch */}
        {isBranch && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Request Product</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Admin</label>
                <select
                  name="adminUserId"
                  value={formData.adminUserId.toString()}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700"
                >
                  <option value="0">Select Admin</option>
                  {adminUsers.map(admin => (
                    <option key={admin.id} value={admin.id}>{admin.username}</option>
                  ))}
                </select>
                {errors.adminUserId && <p className="text-red-500 text-sm mt-1">{errors.adminUserId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Purchase</label>
                <select
                  name="purchaseId"
                  value={formData.purchaseId.toString()}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700"
                >
                  <option value="0">Select Purchase</option>
                  {purchases.filter(p => p.userId === formData.adminUserId).map(purchase => (
                    <option key={purchase.id} value={purchase.id}>
                      {purchase.productName} - {purchase.quantity} {purchase.unit} ({purchase.brand})
                    </option>
                  ))}
                </select>
                {errors.purchaseId && <p className="text-red-500 text-sm mt-1">{errors.purchaseId}</p>}
              </div>

              <InputField
                label="Quantity Requested"
                type="number"
                value={formData.quantityRequested.toString()}
                onChange={handleInputChange}
                name="quantityRequested"
                error={errors.quantityRequested}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        )}

        {/* Requests List */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            {isAdmin ? 'All Requests' : 'My Requests'}
          </h2>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loadingRequests ? (
              <p className="text-gray-500">Loading requests...</p>
            ) : !requests || requests.length === 0 ? (
              <p className="text-gray-500">No requests found.</p>
            ) : (
              requests.map(request => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-600">{request.purchase?.productName}</h3>
                      <p className="text-sm text-gray-600">
                        Quantity Requested: {request.quantityRequested} {request.purchase?.unit}
                      </p>
                      <p className="text-sm text-gray-600">
                        From: {request.requestingUser?.username} To: {request.adminUser?.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        request.status === RequestStatus.REQUEST ? 'bg-yellow-100 text-yellow-800' :
                        request.status === RequestStatus.ACCEPT ? 'bg-green-100 text-green-800' :
                        request.status === RequestStatus.REJECT ? 'bg-red-100 text-red-800' :
                        request.status === RequestStatus.IN_TRANSIT ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>

                    {isAdmin && request.status === RequestStatus.REQUEST && (
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

                    {isAdmin && request.status === RequestStatus.ACCEPT && (
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

                    {isAdmin && request.status === RequestStatus.IN_TRANSIT && (
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
      </div>

      <ConfirmModal
        isOpen={showConfirmAction}
        onClose={() => setShowConfirmAction(false)}
        title={`Confirm ${actionType}`}
        message={`Are you sure you want to ${actionType.toLowerCase()} this request?`}
        onConfirm={handleAction}
        variant={actionType === RequestStatus.REJECT ? "danger" : "primary"}
      />
    </div>
  );
};

export default RequestPage;