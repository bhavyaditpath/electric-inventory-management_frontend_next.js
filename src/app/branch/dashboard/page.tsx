"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { inventoryApi } from '@/Services/inventory.service';
import { purchaseApi } from '@/Services/purchase.service';
import { requestApi } from '@/Services/request.service';
import { Inventory, PurchaseResponseDto, RequestResponseDto } from '@/types/api-types';
import { AlertStatus } from '@/types/enums';
import { alertApi, StockAlert } from '@/Services/alert.api';

export default function BranchDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [purchases, setPurchases] = useState<PurchaseResponseDto[]>([]);
  const [requests, setRequests] = useState<RequestResponseDto[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.branchId) return;

      try {
        setLoading(true);
        const [inventoryRes, purchasesRes, requestsRes, alertsRes] = await Promise.all([
          inventoryApi.getAll(),
          purchaseApi.getPurchases(),
          requestApi.getRequests(),
          alertApi.getByBranch(user.branchId, AlertStatus.ACTIVE),
        ]);

        if (inventoryRes?.data) {
          const inv = inventoryRes.data;

          let items: any[] = [];

          if (inv.items && Array.isArray(inv.items)) {
            items = inv.items;
          } else if (Array.isArray(inv)) {
            items = inv;
          }

          const normalized = items
            .filter(item => item.branchId === user.branchId)
            .map(item => ({
              ...item,
              lastPurchaseDate: new Date(item.lastPurchaseDate),
            }));

          setInventory(normalized);
        }
        if (purchasesRes.success && purchasesRes.data) {
          setPurchases((purchasesRes.data as PurchaseResponseDto[]).filter(purchase => purchase.branchId === user.branchId));
        } else if (Array.isArray(purchasesRes)) {
          // Handle case where API returns array directly
          setPurchases((purchasesRes as PurchaseResponseDto[]).filter(purchase => purchase.branchId === user.branchId));
        }
        if (requestsRes.success && requestsRes.data) {
          setRequests(requestsRes.data as RequestResponseDto[]);
        }
        if (alertsRes.success && alertsRes.data) {
          setActiveAlerts(alertsRes.data as StockAlert[]);
        } else if (Array.isArray(alertsRes)) {
          // Handle case where API returns array directly
          setActiveAlerts(alertsRes as StockAlert[]);
        }
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.branchId]);

  const currentStock = inventory.reduce((sum, item) => sum + item.currentQuantity, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysPurchases = purchases.filter(purchase => {
    const purchaseDate = new Date(purchase.createdAt);
    purchaseDate.setHours(0, 0, 0, 0);
    return purchaseDate.getTime() === today.getTime();
  });
  const todaysSales = todaysPurchases.reduce((sum, purchase) => sum + purchase.totalPrice, 0);
  const activeAlertsCount = activeAlerts.length;

  const pendingOrders = requests.filter(request => request.status === 'Request').length;

  const recentSales = purchases
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const stockAlerts = inventory
    .filter(item => item.currentQuantity <= item.lowStockThreshold)
    .sort((a, b) => a.currentQuantity - b.currentQuantity)
    .slice(0, 3);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Less than 1 hour ago';
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { text: 'Out of Stock', color: 'text-red-600' };
    if (quantity <= threshold) return { text: 'Low Stock', color: 'text-red-600' };
    if (quantity <= threshold * 2) return { text: 'Reorder Soon', color: 'text-orange-600' };
    return { text: 'Good', color: 'text-green-600' };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="h-24 bg-gray-300 rounded"></div>
            <div className="h-24 bg-gray-300 rounded"></div>
            <div className="h-24 bg-gray-300 rounded"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-300 rounded"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Branch Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your branch inventory and sales</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Branch-specific Dashboard Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Stock</h3>
          <p className="text-3xl font-bold text-blue-600">{currentStock}</p>
          <p className="text-sm text-gray-500">Items available</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Alerts</h3>
          <p className="text-3xl font-bold text-red-600">{activeAlertsCount}</p>
          <p className="text-sm text-gray-500">Stock alerts</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Orders</h3>
          <p className="text-3xl font-bold text-orange-600">{pendingOrders}</p>
          <p className="text-sm text-gray-500">From admin</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Sales</h2>
          <div className="space-y-4">
            {recentSales.length > 0 ? (
              recentSales.map((sale, index) => (
                <div key={sale.id} className={`flex items-center justify-between py-2 ${index < recentSales.length - 1 ? 'border-b border-gray-200' : ''}`}>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sale.productName} - {sale.brand}</p>
                    <p className="text-xs text-gray-500">{formatTimeAgo(new Date(sale.createdAt))}</p>
                  </div>
                  <span className="text-sm text-green-600">${Number(sale.totalPrice).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No recent sales</p>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Stock Alerts</h2>
          <div className="space-y-4">
            {stockAlerts.length > 0 ? (
              stockAlerts.map((item, index) => {
                const status = getStockStatus(item.currentQuantity, item.lowStockThreshold);
                return (
                  <div key={item.id} className={`flex items-center justify-between py-2 ${index < stockAlerts.length - 1 ? 'border-b border-gray-200' : ''}`}>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.productName} - {item.brand}</p>
                      <p className={`text-xs ${status.color}`}>Only {item.currentQuantity} left</p>
                    </div>
                    <span className={`text-sm ${status.color}`}>{status.text}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500">All items are well stocked</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/branch/requestedpurchase')}
            className="bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-color cursor-pointer"
          >
            Request Stock from Admin
          </button>
          <button
            onClick={() => router.push('/branch/sales')}
            className="bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-colors cursor-pointer"
          >
            Record New Sale
          </button>
          <button
            onClick={() => router.push('/branch/inventory')}
            className="bg-purple-600 text-white px-4 py-3 rounded-md hover:bg-purple-700 transition-colors cursor-pointer"
          >
            View Inventory
          </button>
        </div>
      </div>
    </div>
  );
}