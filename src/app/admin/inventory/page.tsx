"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import DataTable from "../../../components/DataTable";
import ConfirmModal from "../../../components/ConfirmModal";
import { showError, showSuccess } from "../../../Services/toast.service";
import { inventoryApi } from "@/Services/inventory.service";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { purchaseApi } from "@/Services/purchase.service";

interface InventoryItem {
  id: string;
  productName: string;
  currentQuantity: number;
  unit: string;
  lowStockThreshold: number;
  brand: string;
  branchId?: number;
  branch?: any;
  lastPurchaseDate: Date | string;
  totalPurchased: number;
}

export default function BranchInventoryPage() {
  const router = useRouter();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);

      const response = await inventoryApi.getAll();

      if (Array.isArray(response)) {
        setInventory(response as InventoryItem[]);
      } else {
        setInventory([]);
      }

    } catch (error) {
      console.error("Failed to load inventory:", error);
      showError("Failed to load inventory");
      setInventory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) =>
      item.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  const handleDeleteInventory = async () => {
    if (!deleteId) return;

    try {
      await purchaseApi.removePurchase(deleteId);
      showSuccess("Inventory deleted successfully!");
      loadInventory();
    } catch (error) {
      console.error("Failed to delete inventory:", error);
      showError("Failed to delete inventory");
    } finally {
      setShowConfirmDelete(false);
      setDeleteId(null);
    }
  };

  const actions = useCallback(
    (row: InventoryItem) => (
      <div className="flex space-x-2">
        <button
          onClick={() => router.push(`/admin/purchase?edit=${row.id}`)}
          className="p-1 text-blue-600 hover:text-blue-800"
          title="Edit Purchase"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            setDeleteId(row.id);
            setShowConfirmDelete(true);
          }}
          className="p-1 text-red-600 hover:text-red-800"
          title="Delete Inventory"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    ),
    []
  );

  const columns = [
    { key: "productName", header: "Product Name", sortable: true },
    {
      key: "branch",
      header: "Branch",
      sortable: true,
      render: (value: any) => value?.name || 'N/A',
    },
    {
      key: "currentQuantity",
      header: "Current Stock",
      sortable: true,
      render: (value: number, row: InventoryItem) => (
        <span
          className={`font-medium ${value <= row.lowStockThreshold
            ? "text-red-600"
            : value <= row.lowStockThreshold * 2
              ? "text-yellow-600"
              : "text-green-600"
            }`}
        >
          {value} {row.unit}
        </span>
      ),
    },

    {
      key: "totalPurchased",
      header: "Total Purchased",
      sortable: true,
      render: (value: number, row: InventoryItem) => `${value} ${row.unit}`,
    },

    {
      key: "lowStockThreshold",
      header: "Low Stock Alert",
      sortable: true,
      render: (value: number, row: InventoryItem) => (
        <span
          className={
            row.currentQuantity <= value
              ? "text-red-600 font-medium"
              : "text-gray-600"
          }
        >
          {value} {row.unit}
        </span>
      ),
    },

    { key: "brand", header: "Brand", sortable: true },

    {
      key: "lastPurchaseDate",
      header: "Last Purchase",
      sortable: true,
      render: (value: string) =>
        new Date(value).toLocaleDateString("en-IN"),
    },
  ];


  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Global Inventory Overview</h1>
        <p className="text-gray-600 mt-2">View purchased items and current stock levels across all branches</p>
      </div>

      <DataTable
        data={filteredInventory}
        columns={columns}
        loading={loading}
        emptyMessage="No inventory items found"
        moduleName="Global Inventory Overview"
        pagination={true}
        pageSize={10}
        showPageSizeSelector={true}
        pageSizeOptions={[5, 10, 25, 50]}
        striped={true}
        hover={true}
        size="md"
        actions={actions}
      />

      {/* Stock Alert Summary */}
      {filteredInventory.length > 0 && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Global Stock Alert Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-3 rounded border-l-4 border-red-500">
              <div className="text-red-800 font-medium">Low Stock Items</div>
              <div className="text-red-600 text-2xl font-bold">
                {filteredInventory.filter(item => item.currentQuantity <= item.lowStockThreshold).length}
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
              <div className="text-yellow-800 font-medium">Warning Level</div>
              <div className="text-yellow-600 text-2xl font-bold">
                {filteredInventory.filter(item => item.currentQuantity > item.lowStockThreshold && item.currentQuantity <= item.lowStockThreshold * 2).length}
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
              <div className="text-green-800 font-medium">Good Stock</div>
              <div className="text-green-600 text-2xl font-bold">
                {filteredInventory.filter(item => item.currentQuantity > item.lowStockThreshold * 2).length}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Delete Inventory Item"
        message="Are you sure you want to delete this inventory item? This action cannot be undone."
        onConfirm={handleDeleteInventory}
        variant="danger"
      />
    </div>
  );
}