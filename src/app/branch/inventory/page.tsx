"use client";

import { useState, useEffect, useMemo } from "react";
import DataTable from "../../../components/DataTable";
import { showError } from "../../../Services/toast.service";
import { purchaseApi } from "@/Services/inventory.service";

interface InventoryItem {
  id: string;
  productName: string;
  currentQuantity: number;
  unit: string;
  lowStockThreshold: number;
  brand: string;
  branchId?: number;
  branch?: any;
  lastPurchaseDate: Date;
  totalPurchased: number;
}

export default function BranchInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInventory = useMemo(() => {
    return inventory.filter(item =>
      item.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const response = await purchaseApi.getAll();
      console.log(response)
      let InventoryData: InventoryItem[] = [];
      if (Array.isArray(response)) {
        InventoryData = response as InventoryItem[];
      }
      setInventory(InventoryData);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      showError('Failed to load inventory');
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: "productName",
      header: "Product Name",
      sortable: true,
    },
    {
      key: "currentQuantity",
      header: "Current Stock",
      sortable: true,
      render: (value: number, row: InventoryItem) => (
        <span className={`font-medium ${value <= row.lowStockThreshold ? "text-red-600" : value <= row.lowStockThreshold * 2 ? "text-yellow-600" : "text-green-600"}`}>
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
        <span className={row.currentQuantity <= value ? "text-red-600 font-medium" : "text-gray-600"}>
          {value} {row.unit}
        </span>
      ),
    },
    {
      key: "brand",
      header: "Brand",
      sortable: true,
    },
    {
      key: "lastPurchaseDate",
      header: "Last Purchase",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Branch Inventory</h1>
            <p className="text-gray-600 mt-2">View purchased items and current stock levels for this branch</p>
          </div>
          <div className="mt-4 md:mt-0">
            <input
              type="text"
              placeholder="Search by product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
            />
          </div>
        </div>
      </div>

      <DataTable
        data={filteredInventory}
        columns={columns}
        loading={loading}
        emptyMessage="No inventory items found"
        moduleName="Branch Inventory"
        pagination={true}
        pageSize={10}
        showPageSizeSelector={true}
        pageSizeOptions={[5, 10, 25, 50]}
        striped={true}
        hover={true}
        size="md"
      />

      {/* Stock Alert Summary */}
      {filteredInventory.length > 0 && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Stock Alert Summary</h3>
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
    </div>
  );
}