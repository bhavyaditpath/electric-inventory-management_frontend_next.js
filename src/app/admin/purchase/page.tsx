'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import InputField from '../../../components/InputField';
import ConfirmModal from '../../../components/ConfirmModal';
import { purchaseApi } from '../../../Services/purchase.service';
import { PurchaseDto, PurchaseResponseDto } from '../../../types/api-types';
import { showSuccess, showError } from '../../../Services/toast.service';
import { exportPurchasesToPDF } from '../../../utils/pdfExport';
import { useAuth } from '../../../contexts/AuthContext';
import { ArrowPathIcon, DocumentTextIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

const PurchasePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { user } = useAuth();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [loading, setLoading] = useState(false);
  const [purchases, setPurchases] = useState<PurchaseResponseDto[]>([]);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseResponseDto | null>(null);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [formData, setFormData] = useState<PurchaseDto>({
    productName: '',
    quantity: '0',
    unit: 'pieces',
    pricePerUnit: '0',
    totalPrice: '0',
    lowStockThreshold: '10',
    brand: '',
  });

  // VALIDATION FUNCTION
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.productName.trim()) newErrors.productName = "Product name is required";
    if (!formData.brand.trim()) newErrors.brand = "Supplier name is required";

    const qty = parseFloat(formData.quantity);
    if (!qty || qty <= 0) newErrors.quantity = "Quantity must be greater than 0";

    if (!formData.unit.trim()) newErrors.unit = "Unit is required";

    const price = parseFloat(formData.pricePerUnit);
    if (!price || price <= 0) newErrors.pricePerUnit = "Price per unit must be greater than 0";

    const total = parseFloat(formData.totalPrice);
    if (!total || total <= 0) newErrors.totalPrice = "Total price must be greater than 0";

    const threshold = parseFloat(formData.lowStockThreshold);
    if (!threshold || threshold <= 0)
      newErrors.lowStockThreshold = "Low stock threshold must be at least 1";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Load all purchases
  const loadPurchases = useCallback(async () => {
    try {
      setLoadingPurchases(true);
      const response = await purchaseApi.getPurchases();
      setPurchases(Array.isArray(response) ? response : []);
    } catch (err) {
      setPurchases([]);
      console.error('Failed to load purchases:', err);
    } finally {
      setLoadingPurchases(false);
    }
  }, []);
  const firstLoad = useRef(false);
  useEffect(() => {
    if (!firstLoad.current) {
      firstLoad.current = true;
      loadPurchases();
    }
  }, [loadPurchases]);

  // Load purchase from URL edit
  // useEffect(() => {
  //   if (!editId) return;

  //   (async () => {
  //     try {
  //       const response = await purchaseApi.getPurchase(editId);
  //       setEditingPurchase(response as PurchaseResponseDto);
  //     } catch (err) {
  //       showError('Failed to load purchase for editing');
  //     }
  //   })();
  // }, [editId]);

  // Sync editingPurchase → formData
  useEffect(() => {
    if (!editingPurchase) return;

    setFormData({
      productName: editingPurchase.productName,
      quantity: editingPurchase.quantity.toString(),
      unit: editingPurchase.unit,
      pricePerUnit: editingPurchase.pricePerUnit.toString(),
      totalPrice: editingPurchase.totalPrice.toString(),
      lowStockThreshold: editingPurchase.lowStockThreshold.toString(),
      brand: editingPurchase.brand,
    });
  }, [editingPurchase]);

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const processedValue = value;

    setFormData(prev => {
      const updated = { ...prev, [name]: processedValue };

      if (name === 'quantity' || name === 'pricePerUnit') {
        updated.totalPrice =
          (parseFloat(name === 'quantity' ? processedValue : prev.quantity) *
            parseFloat(name === 'pricePerUnit' ? processedValue : prev.pricePerUnit)).toString();
      }

      return updated;
    });

    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    router.push('/admin/purchase');
    setEditingPurchase(null);

    setFormData({
      productName: '',
      quantity: '0',
      unit: 'pieces',
      pricePerUnit: '0',
      totalPrice: '0',
      lowStockThreshold: '10',
      brand: '',
    });
  };

  // Delete Purchase
  const handleDeletePurchase = async () => {
    if (!deleteId) return;
    try {
      await purchaseApi.removePurchase(deleteId.toString());
      showSuccess('Purchase deleted');
      loadPurchases();
    } catch (err) {
      showError('Failed to delete purchase');
    } finally {
      setShowConfirmDelete(false);
      setDeleteId(null);
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError("Please fix the errors in the form.");
      return;
    }

    setLoading(true);

    try {
      if (editingPurchase) {
        await purchaseApi.editRecordPurchase(editingPurchase.id.toString(), formData);
        showSuccess('Purchase updated');
      } else {
        await purchaseApi.recordPurchase(formData);
        showSuccess('Purchase recorded');
      }

      handleCancelEdit();
      loadPurchases();

    } catch (err) {
      showError('Failed to save purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Management</h1>
            <p className="text-gray-600 mt-1">Record and manage inventory purchases</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Purchase Form */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <ShoppingCartIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {editingPurchase ? 'Edit Purchase' : 'Record New Purchase'}
              </h2>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              <InputField
                label="Product/Item Name"
                type="text"
                value={formData.productName}
                onChange={handleInputChange}
                name="productName"
                error={errors.productName}
              />

              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  name="quantity"
                  step="0.01"
                  error={errors.quantity}
                />

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white text-gray-900"
                  >
                    <option value="pieces">Pieces</option>
                    <option value="boxes">Boxes</option>
                    <option value="kgs">Kgs</option>
                  </select>
                  {errors.unit && (
                    <p className="text-red-500 text-sm mt-1">{errors.unit}</p>
                  )}
                </div>
              </div>

              <InputField
                label="Price per Unit"
                type="number"
                value={formData.pricePerUnit}
                onChange={handleInputChange}
                name="pricePerUnit"
                step="0.01"
                error={errors.pricePerUnit}
              />

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Total Price</label>
                <input
                  type="text"
                  value={`Rs ${formData.totalPrice}`}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-gray-50 text-gray-900 font-medium"
                />
                {errors.totalPrice && <p className="text-red-500 text-sm mt-1">{errors.totalPrice}</p>}
              </div>

              <InputField
                label="Low Stock Alert Threshold"
                type="number"
                value={formData.lowStockThreshold}
                onChange={handleInputChange}
                name="lowStockThreshold"
                error={errors.lowStockThreshold}
              />

              <InputField
                label="Supplier Name"
                type="text"
                value={formData.brand}
                onChange={handleInputChange}
                name="brand"
                error={errors.brand}
              />

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3.5 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-2 focus:ring-blue-200 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3 inline-block"></div>
                      {editingPurchase ? 'Updating...' : 'Recording...'}
                    </>
                  ) : (
                    editingPurchase ? 'Update Purchase' : 'Record Purchase'
                  )}
                </button>
                {editingPurchase && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 py-3.5 px-4 rounded-lg font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus:ring-2 focus:ring-gray-200 transition-all duration-200"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* HISTORY */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <DocumentTextIcon className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Purchases
                  <span className="text-sm font-normal text-gray-500 ml-2">(last 3 days)</span>
                </h2>
              </div>
              <button
                onClick={() => exportPurchasesToPDF(purchases, user?.branch || 'All Branches')}
                disabled={!purchases || purchases.length === 0}
                className={`inline-flex items-center px-4 py-2 rounded-lg font-semibold text-white transition-all duration-200 ${
                  !purchases || purchases.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 active:bg-green-800 focus:ring-2 focus:ring-green-200 shadow-lg hover:shadow-xl'
                }`}
              >
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Export PDF
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {!purchases || purchases.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium text-lg">No purchases recorded yet</p>
                  <p className="text-gray-500 text-sm mt-1">Start by recording your first purchase</p>
                </div>
              ) : (
                purchases.slice(0, 10).map(purchase => (
                  <div key={purchase.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{purchase.productName}</h3>
                        <p className="text-sm text-gray-600">{purchase.brand}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{purchase.quantity} {purchase.unit}</span>
                          <span>×</span>
                          <span>Rs {purchase.pricePerUnit}</span>
                          <span>=</span>
                          <span className="font-semibold text-blue-600">Rs {purchase.totalPrice}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {new Date(purchase.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            Threshold: {purchase.lowStockThreshold}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Delete Purchase"
        message="Are you sure you want to delete this purchase? This action cannot be undone."
        onConfirm={handleDeletePurchase}
        variant="danger"
      />
    </div>
  );
};

export default PurchasePage;
