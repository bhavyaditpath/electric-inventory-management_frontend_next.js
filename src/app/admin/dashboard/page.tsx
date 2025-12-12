"use client";

import { useState, useEffect } from 'react';
import { inventoryApi } from '@/Services/inventory.service';
import { branchApi } from '@/Services/branch.api';
import { purchaseApi } from '@/Services/purchase.service';
import { requestApi } from '@/Services/request.service';
import { Inventory, PurchaseResponseDto, RequestResponseDto } from '@/types/api-types';

interface DashboardStats {
  totalInventory: number;
  activeBranches: number;
  monthlySales: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: 'purchase' | 'request' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  value?: string;
  color: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInventory: 0,
    activeBranches: 0,
    monthlySales: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Helper function to calculate time ago
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Helper function to get current month purchases
  const getCurrentMonthPurchases = (purchases: PurchaseResponseDto[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.createdAt);
      return purchaseDate.getMonth() === currentMonth &&
        purchaseDate.getFullYear() === currentYear;
    });
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data using the same pattern as other files
      const inventoryResponse = await inventoryApi.getAll();
      const branchResponse = await branchApi.getAll();
      const purchaseResponse = await purchaseApi.getPurchases();
      const requestResponse = await requestApi.getRequests();

      let totalInventory = 0;

      if (inventoryResponse?.data) {
        const inv = inventoryResponse.data;
        let items: any[] = [];
        if (inv.items && Array.isArray(inv.items)) {
          items = inv.items;
        }
        else if (Array.isArray(inv)) {
          items = inv;
        }
        const normalized = items.map(item => ({
          ...item,
          lastPurchaseDate: new Date(item.lastPurchaseDate),
        }));

        totalInventory = normalized.reduce((sum, item) => sum + Number(item.currentQuantity), 0);
      } else {
        totalInventory = 0;
      }
      // Process branch data - following admin/branches pattern
      let activeBranches = 0;
      if (branchResponse.success && Array.isArray(branchResponse.data)) {
        activeBranches = branchResponse.data.length;
      } else if (Array.isArray(branchResponse)) {
        activeBranches = branchResponse.length;
      }

      // Process purchase data for monthly sales
      let monthlySales = 0;
      let allPurchases: PurchaseResponseDto[] = [];

      if (Array.isArray(purchaseResponse)) {
        allPurchases = purchaseResponse as PurchaseResponseDto[];
      } else if (purchaseResponse.success && purchaseResponse.data) {
        allPurchases = purchaseResponse.data as PurchaseResponseDto[];
      }

      if (Array.isArray(allPurchases)) {
        const currentMonthPurchases = getCurrentMonthPurchases(allPurchases);
        monthlySales = currentMonthPurchases.reduce((sum: number, purchase: PurchaseResponseDto) => sum + purchase.totalPrice, 0);
      }

      // Process recent activity
      const recentActivity: ActivityItem[] = [];

      // Add recent purchases
      if (Array.isArray(allPurchases)) {
        allPurchases
          .sort((a: PurchaseResponseDto, b: PurchaseResponseDto) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3)
          .forEach(purchase => {
            recentActivity.push({
              id: `purchase-${purchase.id}`,
              type: 'purchase',
              title: 'New inventory purchased',
              description: `${purchase.quantity} ${purchase.unit} of ${purchase.productName}`,
              timestamp: getTimeAgo(purchase.createdAt),
              value: `+${purchase.quantity} items`,
              color: 'blue'
            });
          });
      }

      // Add recent requests
      let allRequests: RequestResponseDto[] = [];
      if (Array.isArray(requestResponse)) {
        allRequests = requestResponse as RequestResponseDto[];
      } else if (requestResponse.success && requestResponse.data) {
        allRequests = requestResponse.data as RequestResponseDto[];
      }

      if (Array.isArray(allRequests)) {
        allRequests
          .sort((a: RequestResponseDto, b: RequestResponseDto) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2)
          .forEach(request => {
            recentActivity.push({
              id: `request-${request.id}`,
              type: 'request',
              title: `Request ${request.status.toLowerCase()}`,
              description: `${request.quantityRequested} items requested`,
              timestamp: getTimeAgo(request.createdAt),
              status: request.status,
              color: request.status === 'Accept' ? 'green' : request.status === 'Reject' ? 'red' : 'yellow'
            });
          });
      }

      // Sort recent activity by timestamp (newest first)
      recentActivity.sort((a, b) => {
        const timeA = a.timestamp.replace('ago', '').trim();
        const timeB = b.timestamp.replace('ago', '').trim();

        // Simple sorting - in production, you'd want more sophisticated time parsing
        return timeA.localeCompare(timeB);
      });

      setStats({
        totalInventory,
        activeBranches,
        monthlySales,
        recentActivity: recentActivity.slice(0, 5) // Show top 5 activities
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to the Electric Inventory Management System</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to the Electric Inventory Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dashboard Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Inventory</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalInventory.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Items in stock</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Branches</h3>
          <p className="text-3xl font-bold text-green-600">{stats.activeBranches}</p>
          <p className="text-sm text-gray-500">Branches online</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Monthly Sales</h3>
          <p className="text-3xl font-bold text-purple-600">{formatCurrency(stats.monthlySales)}</p>
          <p className="text-sm text-gray-500">This month</p>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <button
            onClick={fetchDashboardData}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>
        <div className="space-y-4">
          {stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.description}</p>
                  <p className="text-xs text-gray-400">{activity.timestamp}</p>
                </div>
                <div className="text-right">
                  {activity.value && (
                    <span className={`text-sm text-${activity.color}-600`}>
                      {activity.value}
                    </span>
                  )}
                  {activity.status && (
                    <span className={`text-sm text-${activity.color}-600`}>
                      {activity.status}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}