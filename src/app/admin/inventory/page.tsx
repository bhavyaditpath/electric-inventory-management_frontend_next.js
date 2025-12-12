"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DataTable from "../../../components/DataTable";
import ConfirmModal from "../../../components/ConfirmModal";
import ColumnCustomizer from "../../../components/ColumnCustomizer";
import { useColumnCustomization } from "../../../hooks/useColumnCustomization";
import { showError, showSuccess } from "../../../Services/toast.service";
import { inventoryApi } from "@/Services/inventory.service";
import { purchaseApi } from "@/Services/purchase.service";
import { useSearchParams } from "next/navigation";

export interface InventoryItem {
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

export default function AdminInventoryPage() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") || ""; // <-- get global search from navbar
  const [searchTerm, setSearchTerm] = useState(urlSearch); // <-- APPLY IT HERE
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortBy, setSortBy] = useState<string>("productName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const loadInventory = useCallback(async (
    page = currentPage,
    size = pageSize,
    search = searchTerm,
    sortField = sortBy,
    sortDir = sortOrder
  ) => {
    try {
      setLoading(true);

      const res = await inventoryApi.getAll({
        page,
        pageSize: size,
        search: search.trim() || undefined,
        sortBy: sortField,
        sortOrder: sortDir,
      });

      console.log("Inventory API Response:", res.data);

      const paginated = res.data;

      if (paginated && Array.isArray(paginated.items)) {
        setInventory(paginated.items);
        setTotalRecords(paginated.total);
      } else {
        setInventory([]);
        setTotalRecords(0);
      }

    } catch (e) {
      console.error("Inventory Load Error:", e);
      showError("Error loading inventory");
      setInventory([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortBy, sortOrder]);

  const firstLoad = useRef(false);

  useEffect(() => {
    if (!firstLoad.current) {
      firstLoad.current = true;
      loadInventory(1, pageSize, urlSearch);
    }
  }, [loadInventory, urlSearch]);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      loadInventory(page, pageSize, searchTerm, sortBy, sortOrder);
    },
    [pageSize, searchTerm, sortBy, sortOrder, loadInventory]
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setPageSize(newSize);
      setCurrentPage(1);
      loadInventory(1, newSize, searchTerm, sortBy, sortOrder);
    },
    [searchTerm, sortBy, sortOrder, loadInventory]
  );

  const handleSort = (column: string, direction: "asc" | "desc") => {
    setSortBy(column);
    setSortOrder(direction);
    setCurrentPage(1);
    loadInventory(1, pageSize, searchTerm, column, direction);
  };

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

  const columns = [
    { key: "productName", header: "Product Name", sortable: true },

    {
      key: "branch",
      header: "Branch",
      sortable: true,
      render: (value: any) => value?.name || "N/A",
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
      header: "Low Stock Limit",
      sortable: true,
      render: (value: number, row: InventoryItem) => (
        <span
          className={
            row.currentQuantity <= value ? "text-red-600 font-medium" : "text-gray-600"
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
      render: (value: string) => new Date(value).toLocaleDateString("en-IN"),
    },
  ];

  const { tableColumns, handleColumnsChange } = useColumnCustomization(
    columns,
    "adminInventoryColumnConfig"
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Global Inventory Overview</h1>
            <p className="text-gray-600 mt-2">
              View purchased items and stock levels across all branches
            </p>
          </div>

          <div className="mt-4 md:mt-0">
            <button
              onClick={() => setShowCustomizer(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
              focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
            >
              <span className="text-sm font-medium">Customize Columns</span>
            </button>
          </div>
        </div>

        <ColumnCustomizer
          visible={showCustomizer}
          onClose={() => setShowCustomizer(false)}
          columns={tableColumns}
          onApply={handleColumnsChange}
          omitColumns={["productName"]}
        />
      </div>

      {/* TABLE */}
      <DataTable
        data={inventory}
        columns={tableColumns}
        loading={loading}
        emptyMessage="No inventory found"
        moduleName="Inventory"
        pagination={true}
        serverSide={true}
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalRecords}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSort={handleSort}
        showPageSizeSelector={true}
        pageSizeOptions={[5, 10, 25, 50]}
      />

      {/* STOCK SUMMARY */}
      {inventory.length > 0 && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">
            Global Stock Alert Summary
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-3 rounded border-l-4 border-red-500">
              <div className="text-red-800 font-medium">Low Stock Items</div>
              <div className="text-red-600 text-2xl font-bold">
                {inventory.filter((i) => i.currentQuantity <= i.lowStockThreshold).length}
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
              <div className="text-yellow-800 font-medium">Warning Level</div>
              <div className="text-yellow-600 text-2xl font-bold">
                {inventory.filter(
                  (i) =>
                    i.currentQuantity > i.lowStockThreshold &&
                    i.currentQuantity <= i.lowStockThreshold * 2
                ).length}
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
              <div className="text-green-800 font-medium">Good Stock</div>
              <div className="text-green-600 text-2xl font-bold">
                {inventory.filter((i) => i.currentQuantity > i.lowStockThreshold * 2)
                  .length}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
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