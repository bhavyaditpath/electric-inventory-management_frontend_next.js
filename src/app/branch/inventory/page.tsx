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
import { ArrowPathIcon, CubeIcon } from '@heroicons/react/24/outline';

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

export default function BranchInventoryPage() {
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
  const [stockSummary, setStockSummary] = useState({
    low: 0,
    warning: 0,
    good: 0,
  });

  const loadStockSummary = useCallback(async (search = searchTerm) => {
    try {
      const res = await inventoryApi.getStockSummary({
        search: search.trim() || undefined,
      });

      if (res?.data) {
        setStockSummary({
          low: res.data.low || 0,
          warning: res.data.warning || 0,
          good: res.data.good || 0,
        });
      }
    } catch (e) {
      console.error("Stock summary load error:", e);
    }
  }, [searchTerm]);

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

  useEffect(() => {
    setSearchTerm(urlSearch);
    setCurrentPage(1);
    loadInventory(1, pageSize, urlSearch);
    loadStockSummary(urlSearch);
  }, [urlSearch]);

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
            row.currentQuantity <= value ? "text-red-600 font-medium" : "text-[var(--theme-text-muted)]"
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
    "branchInventoryColumnConfig"
  );

  return (
    <div className="p-6 bg-[var(--theme-bg)] text-[var(--theme-text)] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--theme-text)]">Branch Inventory</h1>
            <p className="text-[var(--theme-text-muted)] mt-1 text-sm sm:text-base">View purchased items and current stock levels for this branch</p>
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            <button
              onClick={() =>
                loadInventory(currentPage, pageSize, searchTerm, sortBy, sortOrder)
              }
              className="inline-flex items-center justify-center px-3 py-2 sm:px-4 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg hover:bg-[var(--theme-surface-muted)] transition-colors text-sm sm:text-base"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1 sm:mr-2 text-[var(--theme-text-muted)]" />
              <span className="text-[var(--theme-text)]">Refresh</span>
            </button>
            <button
              onClick={() => setShowCustomizer(true)}
              className="inline-flex items-center justify-center px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors text-sm sm:text-base"
            >
              <span className="text-sm font-medium">Customize Columns</span>
            </button>
          </div>
        </div>
      </div>

      <ColumnCustomizer
        visible={showCustomizer}
        onClose={() => setShowCustomizer(false)}
        columns={tableColumns}
        onApply={handleColumnsChange}
        omitColumns={["productName"]}
      />

      {/* TABLE */}
      <DataTable
        data={inventory}
        columns={tableColumns}
        loading={loading}
        emptyMessage="No inventory found"
        moduleName="Branch Inventory"
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
        <div className="mt-8 bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)] shadow-sm">
          <div className="px-6 py-4 border-b border-[var(--theme-border)]">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <CubeIcon className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--theme-text)]">Stock Alert Summary</h3>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-red-50 p-4 sm:p-6 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-red-800 font-semibold text-base sm:text-lg">Low Stock Items</div>
                    <div className="text-red-600 text-2xl sm:text-3xl font-bold mt-1">
                       {stockSummary.low}
                    </div>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center ml-3">
                    <CubeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 sm:p-6 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-yellow-800 font-semibold text-base sm:text-lg">Warning Level</div>
                    <div className="text-yellow-600 text-2xl sm:text-3xl font-bold mt-1">
                     {stockSummary.warning}
                    </div>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center ml-3">
                    <CubeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 sm:p-6 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-green-800 font-semibold text-base sm:text-lg">Good Stock</div>
                    <div className="text-green-600 text-2xl sm:text-3xl font-bold mt-1">
                      {stockSummary.good}
                    </div>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center ml-3">
                    <CubeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                </div>
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
