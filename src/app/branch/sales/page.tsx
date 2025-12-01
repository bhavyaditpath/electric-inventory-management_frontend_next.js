"use client";

import { useState, useEffect } from "react";
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/outline";
import DataTable from "../../../components/DataTable";
import FormModal, { FormField } from "../../../components/FormModal";
import ConfirmModal from "../../../components/ConfirmModal";

// Mock sales data - replace with API calls
interface SaleRecord {
  id: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  customerName?: string;
  customerPhone?: string;
  saleDate: string;
  paymentMethod: "cash" | "card" | "upi" | "bank_transfer";
  status: "completed" | "pending" | "cancelled";
  notes?: string;
}

const mockSalesData: SaleRecord[] = [
  {
    id: 1,
    itemName: "LED Bulb 10W",
    quantity: 5,
    unitPrice: 3.00,
    totalAmount: 15.00,
    customerName: "John Smith",
    customerPhone: "+1-555-0123",
    saleDate: "2024-01-15T14:30:00Z",
    paymentMethod: "cash",
    status: "completed",
    notes: "Regular customer",
  },
  {
    id: 2,
    itemName: "Extension Cord 5m",
    quantity: 2,
    unitPrice: 10.00,
    totalAmount: 20.00,
    customerName: "Sarah Johnson",
    customerPhone: "+1-555-0456",
    saleDate: "2024-01-15T16:45:00Z",
    paymentMethod: "card",
    status: "completed",
  },
  {
    id: 3,
    itemName: "Circuit Breaker 20A",
    quantity: 1,
    unitPrice: 18.00,
    totalAmount: 18.00,
    saleDate: "2024-01-14T11:20:00Z",
    paymentMethod: "upi",
    status: "completed",
    notes: "Emergency repair",
  },
];

const paymentMethodOptions = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

const statusOptions = [
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
];

export default function BranchSalesPage() {
  const [sales, setSales] = useState<SaleRecord[]>(mockSalesData);
  const [loading, setLoading] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SaleRecord | null>(null);
  const [deletingItem, setDeletingItem] = useState<SaleRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const columns = [
    {
      key: "itemName",
      header: "Item Name",
      sortable: true,
    },
    {
      key: "quantity",
      header: "Quantity",
      sortable: true,
    },
    {
      key: "unitPrice",
      header: "Unit Price",
      sortable: true,
      render: (value: number) => `$${value.toFixed(2)}`,
    },
    {
      key: "totalAmount",
      header: "Total Amount",
      sortable: true,
      render: (value: number) => `$${value.toFixed(2)}`,
    },
    {
      key: "customerName",
      header: "Customer",
      sortable: true,
      render: (value: string) => value || "Walk-in Customer",
    },
    {
      key: "paymentMethod",
      header: "Payment",
      sortable: true,
      render: (value: string) => (
        <span className="capitalize">
          {value.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (value: string) => {
        const statusColors = {
          completed: "bg-green-100 text-green-800",
          pending: "bg-yellow-100 text-yellow-800",
          cancelled: "bg-red-100 text-red-800",
        };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      },
    },
    {
      key: "saleDate",
      header: "Sale Date",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const handleAdd = () => {
    setEditingItem(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (item: SaleRecord) => {
    setEditingItem(item);
    setIsFormModalOpen(true);
  };

  const handleDelete = (item: SaleRecord) => {
    setDeletingItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (editingItem) {
        // Update existing sale record
        setSales(prev =>
          prev.map(item =>
            item.id === editingItem.id
              ? { ...item, ...data, totalAmount: data.quantity * data.unitPrice }
              : item
          )
        );
      } else {
        // Add new sale record
        const newItem: SaleRecord = {
          id: Math.max(...sales.map(s => s.id)) + 1,
          ...data,
          totalAmount: data.quantity * data.unitPrice,
          saleDate: new Date().toISOString(),
          status: "completed",
        };
        setSales(prev => [...prev, newItem]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSales(prev => prev.filter(item => item.id !== deletingItem.id));
    } finally {
      setIsSubmitting(false);
    }
  };

  const actions = (row: SaleRecord) => (
    <div className="flex space-x-2">
      <button
        onClick={() => handleEdit(row)}
        className="text-blue-600 hover:text-blue-900 p-1"
        title="Edit"
      >
        <PencilIcon className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleDelete(row)}
        className="text-red-600 hover:text-red-900 p-1"
        title="Delete"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Records</h1>
          <p className="text-gray-600 mt-2">Track and manage branch sales transactions</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Record Sale</span>
        </button>
      </div>

      <DataTable
        data={sales}
        columns={columns}
        loading={loading}
        emptyMessage="No sales records found"
        actions={actions}
        moduleName="Branch Sales"
        pagination={true}
        pageSize={10}
        showPageSizeSelector={true}
        pageSizeOptions={[5, 10, 25, 50]}
        striped={true}
        hover={true}
        size="md"
      />

      {/* Add/Edit Modal */}
      <FormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingItem ? "Edit Sale Record" : "Record New Sale"}
        onSubmit={handleFormSubmit}
        submitLabel={editingItem ? "Update Sale" : "Record Sale"}
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Item Name"
            name="itemName"
            value={editingItem?.itemName}
            placeholder="Enter item name"
            required
          />
          <FormField
            label="Quantity"
            name="quantity"
            type="number"
            value={editingItem?.quantity}
            placeholder="Enter quantity sold"
            required
            min="1"
          />
          <FormField
            label="Unit Price"
            name="unitPrice"
            type="number"
            step="0.01"
            value={editingItem?.unitPrice}
            placeholder="Enter selling price"
            required
            min="0"
          />
          <FormField
            label="Payment Method"
            name="paymentMethod"
            type="select"
            value={editingItem?.paymentMethod}
            options={paymentMethodOptions}
            required
          />
          <FormField
            label="Customer Name"
            name="customerName"
            value={editingItem?.customerName}
            placeholder="Enter customer name (optional)"
          />
          <FormField
            label="Customer Phone"
            name="customerPhone"
            value={editingItem?.customerPhone}
            placeholder="Enter customer phone (optional)"
          />
          {editingItem && (
            <FormField
              label="Status"
              name="status"
              type="select"
              value={editingItem?.status}
              options={statusOptions}
              required
            />
          )}
          <div className="md:col-span-2">
            <FormField
              label="Notes"
              name="notes"
              type="textarea"
              value={editingItem?.notes}
              placeholder="Additional notes or details"
            />
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Sale Record"
        message={`Are you sure you want to delete the sale record for "${deletingItem?.itemName}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        isDeleting={isSubmitting}
        confirmLabel="Delete Record"
        variant="danger"
      />
    </div>
  );
}