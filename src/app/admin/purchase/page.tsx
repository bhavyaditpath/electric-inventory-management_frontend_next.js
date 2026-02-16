'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import InputField from '../../../components/InputField';
import ConfirmModal from '../../../components/ConfirmModal';
import { purchaseApi } from '../../../Services/purchase.service';
import { PurchaseDto, PurchaseResponseDto } from '../../../types/api-types';
import { showSuccess, showError } from '../../../Services/toast.service';
import { exportPurchasesToPDF } from '../../../utils/pdfExport';
import { calculatePurchaseTotalPrice, validatePurchaseForm } from '../../../utils/purchaseValidation';
import { useAuth } from '../../../contexts/AuthContext';
import {
  ArrowPathIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const PurchasePage = () => {
  const router = useRouter();
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

  const buildNormalizedFormData = useCallback(
    (data: PurchaseDto): PurchaseDto => ({
      ...data,
      productName: data.productName.trim(),
      unit: data.unit.trim(),
      brand: data.brand.trim(),
      totalPrice: calculatePurchaseTotalPrice(data.quantity, data.pricePerUnit),
    }),
    [],
  );

  const validateForm = () => {
    const normalized = buildNormalizedFormData(formData);
    const newErrors = validatePurchaseForm(normalized);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === 'quantity' || name === 'pricePerUnit') {
        const quantityValue = name === 'quantity' ? value : prev.quantity;
        const priceValue = name === 'pricePerUnit' ? value : prev.pricePerUnit;
        updated.totalPrice = calculatePurchaseTotalPrice(quantityValue, priceValue);
      }

      return updated;
    });

    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

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

  const handleDeletePurchase = async () => {
    if (!deleteId) return;
    try {
      await purchaseApi.removePurchase(deleteId.toString());
      showSuccess('Purchase deleted');
      loadPurchases();
    } catch (error) {
      console.error('Failed to delete purchase:', error);
      showError('Failed to delete purchase');
    } finally {
      setShowConfirmDelete(false);
      setDeleteId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Please fix the errors in the form.');
      return;
    }

    setLoading(true);
    try {
      const payload = buildNormalizedFormData(formData);

      if (editingPurchase) {
        await purchaseApi.editRecordPurchase(editingPurchase.id.toString(), payload);
        showSuccess('Purchase updated');
      } else {
        await purchaseApi.recordPurchase(payload);
        showSuccess('Purchase recorded');
      }

      handleCancelEdit();
      loadPurchases();
    } catch (error) {
      console.error('Failed to save purchase:', error);
      showError('Failed to save purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-[var(--theme-bg)] text-[var(--theme-text)] min-h-screen">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--theme-text)]">Purchase Management</h1>
            <p className="text-[var(--theme-text-muted)] mt-1 text-sm sm:text-base">
              Record and manage inventory purchases
            </p>
          </div>
          <button
            onClick={loadPurchases}
            disabled={loadingPurchases}
            className="inline-flex items-center justify-center px-3 py-2 sm:px-4 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg hover:bg-[var(--theme-surface-muted)] transition-colors text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon
              className={`w-4 h-4 mr-1 sm:mr-2 text-[var(--theme-text-muted)] ${loadingPurchases ? 'animate-spin' : ''}`}
            />
            <span className="text-[var(--theme-text)]">{loadingPurchases ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        <div className="bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)] shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-[var(--theme-border)]">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <ShoppingCartIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-[var(--theme-text)]">
                {editingPurchase ? 'Edit Purchase' : 'Record New Purchase'}
              </h2>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <InputField
                label="Product/Item Name"
                type="text"
                value={formData.productName}
                onChange={handleInputChange}
                name="productName"
                maxLength={255}
                error={errors.productName}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                <InputField
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  name="quantity"
                  step="0.01"
                  min="0.01"
                  max="99999999.99"
                  error={errors.quantity}
                />

                <div>
                  <label className="block text-sm font-semibold text-[var(--theme-text)] mb-2">Unit</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[var(--theme-border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-[var(--theme-surface)] text-[var(--theme-text)]"
                  >
                    <option value="pieces">Pieces</option>
                    <option value="boxes">Boxes</option>
                    <option value="kgs">Kgs</option>
                  </select>
                  {errors.unit && <p className="text-red-500 text-sm mt-1">{errors.unit}</p>}
                </div>
              </div>

              <InputField
                label="Price per Unit"
                type="number"
                value={formData.pricePerUnit}
                onChange={handleInputChange}
                name="pricePerUnit"
                step="0.01"
                min="0.01"
                max="99999999.99"
                error={errors.pricePerUnit}
              />

              <div>
                <label className="block text-sm font-semibold text-[var(--theme-text)] mb-2">Total Price</label>
                <input
                  type="text"
                  value={`Rs ${formData.totalPrice}`}
                  readOnly
                  className="w-full px-4 py-3 border border-[var(--theme-border)] rounded-lg shadow-sm bg-[var(--theme-surface-muted)] text-[var(--theme-text)] font-medium"
                />
                {errors.totalPrice && <p className="text-red-500 text-sm mt-1">{errors.totalPrice}</p>}
              </div>

              <InputField
                label="Low Stock Alert Threshold"
                type="number"
                value={formData.lowStockThreshold}
                onChange={handleInputChange}
                name="lowStockThreshold"
                min="1"
                step="1"
                error={errors.lowStockThreshold}
              />

              <InputField
                label="Supplier Name"
                type="text"
                value={formData.brand}
                onChange={handleInputChange}
                name="brand"
                maxLength={255}
                error={errors.brand}
              />

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
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
                  ) : editingPurchase ? (
                    'Update Purchase'
                  ) : (
                    'Record Purchase'
                  )}
                </button>
                {editingPurchase && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 py-3 px-4 rounded-lg font-semibold text-[var(--theme-text)] bg-[var(--theme-surface)] border border-[var(--theme-border)] hover:bg-[var(--theme-surface-muted)] focus:ring-2 focus:ring-gray-200 transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)] shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-[var(--theme-border)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <DocumentTextIcon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-[var(--theme-text)]">Recent Purchases</h2>
                  <p className="text-xs sm:text-sm text-[var(--theme-text-muted)]">Latest records from this page</p>
                </div>
              </div>
              <button
                onClick={() => exportPurchasesToPDF(purchases, user?.branch || 'All Branches')}
                disabled={!purchases || purchases.length === 0}
                className={`inline-flex items-center justify-center px-3 py-2 rounded-lg font-semibold text-white text-sm transition-all duration-200 ${
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

          <div className="p-4 sm:p-6">
            {loadingPurchases ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[var(--theme-text-muted)] font-medium">Loading purchases...</p>
              </div>
            ) : !purchases || purchases.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCartIcon className="w-14 h-14 text-[var(--theme-text-muted)] mx-auto mb-4" />
                <p className="text-[var(--theme-text-muted)] font-medium text-base sm:text-lg">No purchases recorded yet</p>
                <p className="text-[var(--theme-text-muted)] text-sm mt-1">Start by recording your first purchase</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[35rem] overflow-y-auto pr-1">
                {purchases.slice(0, 10).map((purchase) => (
                  <div
                    key={purchase.id}
                    className="border border-[var(--theme-border)] rounded-lg p-4 hover:bg-[var(--theme-surface-muted)] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[var(--theme-text)] truncate">{purchase.productName}</h3>
                        <p className="text-sm text-[var(--theme-text-muted)]">{purchase.brand}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--theme-text-muted)]">
                          <span>
                            {purchase.quantity} {purchase.unit}
                          </span>
                          <span>x</span>
                          <span>Rs {purchase.pricePerUnit}</span>
                          <span>=</span>
                          <span className="font-semibold text-blue-600">Rs {purchase.totalPrice}</span>
                        </div>
                      </div>
                      <span className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded whitespace-nowrap">
                        Threshold: {purchase.lowStockThreshold}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center text-xs text-[var(--theme-text-muted)]">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      {new Date(purchase.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
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


