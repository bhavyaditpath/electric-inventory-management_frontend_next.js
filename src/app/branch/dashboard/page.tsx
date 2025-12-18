"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { inventoryApi } from '@/Services/inventory.service';
import { purchaseApi } from '@/Services/purchase.service';
import { dashboardApi } from '@/Services/dashboard.api';
import { Inventory, PurchaseResponseDto, RequestResponseDto } from '@/types/api-types';
import {
  CubeIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function BranchDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [purchases, setPurchases] = useState<PurchaseResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    currentStock: 0,
    activeAlertsCount: 0,
    pendingOrders: 0,
    todaysSales: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        // Fetch stats from APIs
        const [currentStockRes, activeAlertsRes, pendingOrdersRes, todaysSalesRes] = await Promise.all([
          dashboardApi.getCurrentStock(user.id),
          dashboardApi.getActiveAlerts(user.id),
          dashboardApi.getPendingOrders(user.id),
          dashboardApi.getTodaysSales(user.id)
        ]);

        const currentStock = (currentStockRes as any).currentStock || 0;
        const activeAlertsCount = (activeAlertsRes as any).activeAlerts || 0;
        const pendingOrders = (pendingOrdersRes as any).pendingOrders || 0;
        const todaysSales = (todaysSalesRes as any).todaysSales || 0;

        setStats({ currentStock, activeAlertsCount, pendingOrders, todaysSales });

        // Fetch inventory and purchases for lists
        const [inventoryRes, purchasesRes] = await Promise.all([
          inventoryApi.getAll(),
          purchaseApi.getPurchases()
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
          const purchases = Array.isArray(purchasesRes.data) ? purchasesRes.data : [];
          setPurchases(purchases.filter(purchase => purchase.branchId === user.branchId));
        } else if (Array.isArray(purchasesRes)) {
          setPurchases((purchasesRes as PurchaseResponseDto[]).filter(purchase => purchase.branchId === user.branchId));
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 ">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-80 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 ">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Branch Dashboard</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
            <p className="text-red-800 font-semibold">Error Loading Dashboard</p>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 ">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Branch Dashboard</h1>
            <p className="text-gray-600 mt-1">Electric Inventory Management System</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Current Stock Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Stock</p>
              <p className="text-3xl font-bold text-gray-900">{stats.currentStock}</p>
              <p className="text-sm text-gray-500 mt-1">Items available</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CubeIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Active Alerts Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeAlertsCount}</p>
              <p className="text-sm text-gray-500 mt-1">Stock alerts</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Pending Orders Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingOrders}</p>
              <p className="text-sm text-gray-500 mt-1">From admin</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Today's Sales Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.todaysSales)}</p>
              <p className="text-sm text-gray-500 mt-1">Revenue today</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Sales */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <ShoppingCartIcon className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
            </div>
          </div>

          <div className="p-6">
            {recentSales.length > 0 ? (
              <div className="space-y-4">
                {recentSales.map((sale, index) => (
                  <div key={sale.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <ChartBarIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{sale.productName}</p>
                        <p className="text-xs text-gray-600">{sale.brand}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(new Date(sale.createdAt))}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-green-600">{formatCurrency(sale.totalPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCartIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No recent sales</p>
                <p className="text-gray-400 text-sm">Recent sales will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Stock Alerts</h2>
            </div>
          </div>

          <div className="p-6">
            {stockAlerts.length > 0 ? (
              <div className="space-y-4">
                {stockAlerts.map((item, index) => {
                  const status = getStockStatus(item.currentQuantity, item.lowStockThreshold);
                  return (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                          status.color.includes('red') ? 'bg-red-100' :
                          status.color.includes('orange') ? 'bg-orange-100' : 'bg-gray-100'
                        }`}>
                          <ExclamationTriangleIcon className={`w-4 h-4 ${
                            status.color.includes('red') ? 'text-red-600' :
                            status.color.includes('orange') ? 'text-orange-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                          <p className="text-xs text-gray-600">{item.brand}</p>
                          <p className={`text-xs mt-1 ${status.color}`}>Only {item.currentQuantity} left</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status.color.includes('red') ? 'bg-red-100 text-red-800' :
                          status.color.includes('orange') ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {status.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CubeIcon className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">All items are well stocked</p>
                <p className="text-gray-400 text-sm">No stock alerts at this time</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <PlusIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/branch/requestedpurchase')}
              className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              Request Stock
            </button>
            <button
              onClick={() => router.push('/branch/sales')}
              className="flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <ShoppingCartIcon className="w-5 h-5 mr-2" />
              Record Sale
            </button>
            <button
              onClick={() => router.push('/branch/inventory')}
              className="flex items-center justify-center px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <EyeIcon className="w-5 h-5 mr-2" />
              View Inventory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}