'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import InputField from '../../../components/InputField';
import ConfirmModal from '../../../components/ConfirmModal';
import { purchaseApi } from '../../../Services/purchase.service';
import { PurchaseDto, PurchaseResponseDto } from '../../../types/api-types';
import { showSuccess, showError } from '../../../Services/toast.service';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const PurchasePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<PurchaseDto>({
    productName: '',
    quantity: 0,
    unit: 'pieces',
    pricePerUnit: 0,
    totalPrice: 0,
    lowStockThreshold: 10,
    brand: '',
  });

  const [purchases, setPurchases] = useState<PurchaseResponseDto[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseResponseDto | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    loadPurchases();
  }, []);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      loadPurchaseForEdit(editId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (editingPurchase) {
      setFormData({
        productName: editingPurchase.productName,
        quantity: editingPurchase.quantity,
        unit: editingPurchase.unit,
        pricePerUnit: editingPurchase.pricePerUnit,
        totalPrice: editingPurchase.totalPrice,
        lowStockThreshold: editingPurchase.lowStockThreshold,
        brand: editingPurchase.brand,
      });
    }
  }, [editingPurchase]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.productName.trim()) newErrors.productName = "Product Name is required";
    if (!formData.brand.trim()) newErrors.brand = "Brand is required";
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = "Quantity must be greater than 0";
    if (!formData.pricePerUnit || formData.pricePerUnit <= 0) newErrors.pricePerUnit = "Price per unit must be greater than 0";
    if (!formData.totalPrice || formData.totalPrice <= 0) newErrors.totalPrice = "Total price must be greater than 0";
    if (!formData.lowStockThreshold || formData.lowStockThreshold <= 0)
      newErrors.lowStockThreshold = "Low stock threshold must be greater than 0";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const loadPurchases = async () => {
    try {
      setLoadingPurchases(true);
      const response = await purchaseApi.getPurchases();
      let InventoryData: PurchaseResponseDto[] = [];
      if (Array.isArray(response)) {
        InventoryData = response as PurchaseResponseDto[];
      }
      setPurchases(InventoryData);
    } catch (error) {
      console.error('Failed to load purchases:', error);
      setPurchases([]);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const loadPurchaseForEdit = async (id: string) => {
    try {
      const response = await purchaseApi.getPurchase(id);
      setEditingPurchase(response.data as PurchaseResponseDto);
    } catch (error) {
      console.error('Failed to load purchase for edit:', error);
      showError('Failed to load purchase for editing');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' ? parseFloat(value) || 0 : value;

    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));

    // Auto-calc total price
    if (name === 'quantity' || name === 'pricePerUnit') {
      const quantity =
        name === 'quantity'
          ? (typeof processedValue === 'number' ? processedValue : 0)
          : formData.quantity;

      const pricePerUnit =
        name === 'pricePerUnit'
          ? (typeof processedValue === 'number' ? processedValue : 0)
          : formData.pricePerUnit;

      setFormData(prev => ({
        ...prev,
        totalPrice: quantity * pricePerUnit,
      }));
    }

    setErrors(prev => ({ ...prev, [name]: '' })); // Clear error of field
  };

  const handleCancelEdit = () => {
    setEditingPurchase(null);
    setFormData({
      productName: '',
      quantity: 0,
      unit: 'pieces',
      pricePerUnit: 0,
      totalPrice: 0,
      lowStockThreshold: 10,
      brand: '',
    });
    setErrors({});
  };

  const handleDeletePurchase = async () => {
    if (!deleteId) return;

    try {
      await purchaseApi.removePurchase(deleteId.toString());
      showSuccess('Purchase deleted successfully!');
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
      showError("Please fill all required fields correctly.");
      return;
    }

    setLoading(true);

    try {
      if (editingPurchase) {
        await purchaseApi.editRecordPurchase(editingPurchase.id.toString(), formData);
        showSuccess('Purchase updated successfully!');
        setEditingPurchase(null);
      } else {
        await purchaseApi.recordPurchase(formData);
        showSuccess('Purchase recorded successfully!');
      }

      setFormData({
        productName: '',
        quantity: 0,
        unit: 'pieces',
        pricePerUnit: 0,
        totalPrice: 0,
        lowStockThreshold: 10,
        brand: '',
      });

      loadPurchases();
    } catch (error) {
      console.error('Failed to save purchase:', error);
      showError('Failed to save purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Purchase Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Purchase Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            {editingPurchase ? 'Edit Purchase' : 'Record New Purchase'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                value={formData.quantity.toString()}
                onChange={handleInputChange}
                name="quantity"
                step="0.01"
                error={errors.quantity}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pieces">Pieces</option>
                  <option value="boxes">Boxes</option>
                  <option value="kgs">Kgs</option>
                </select>
              </div>
            </div>

            <InputField
              label="Price per Unit"
              type="number"
              value={formData.pricePerUnit.toString()}
              onChange={handleInputChange}
              name="pricePerUnit"
              step="0.01"
              error={errors.pricePerUnit}
            />

            <InputField
              label="Total Price"
              type="number"
              value={formData.totalPrice.toString()}
              onChange={handleInputChange}
              name="totalPrice"
              step="0.01"
              error={errors.totalPrice}
            />

            <InputField
              label="Low Stock Alert Threshold"
              type="number"
              value={formData.lowStockThreshold.toString()}
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

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (editingPurchase ? 'Updating...' : 'Recording...') : (editingPurchase ? 'Update Purchase' : 'Record Purchase')}
              </button>
              {editingPurchase && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Purchase History */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Recent Purchases</h2>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {!purchases || purchases.length === 0 ? (
              <p className="text-gray-500">No purchases recorded yet.</p>
            ) : (
              purchases.slice(0, 10).map(purchase => (
                <div key={purchase.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-600">{purchase.productName}</h3>
                      <p className="text-sm text-gray-600">{purchase.brand}</p>
                      <p className="text-sm text-gray-600">
                        {purchase.quantity} {purchase.unit} × ₹{purchase.pricePerUnit} = ₹{purchase.totalPrice}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <p className="text-sm text-gray-600">Threshold: {purchase.lowStockThreshold}</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingPurchase(purchase)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Edit Purchase"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(purchase.id);
                            setShowConfirmDelete(true);
                          }}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete Purchase"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
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
