"use client";

import { useState, useEffect } from 'react';
import { purchaseApi } from '@/Services/purchase.service';
import { dashboardApi } from '@/Services/dashboard.api';
import { PurchaseResponseDto } from '@/types/api-types';
import {
  CubeIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalInventory: number;
  activeBranches: number;
  monthlySales: number;
  totalRequests: number;
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
  icon: any;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInventory: 0,
    activeBranches: 0,
    monthlySales: 0,
    totalRequests: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

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

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch stats from backend APIs
      const [totalInventoryRes, activeBranchesRes, monthlySalesRes, pendingRequestsRes] = await Promise.all([
        dashboardApi.getTotalInventory(user.id),
        dashboardApi.getActiveBranches(),
        dashboardApi.getMonthlySales(user.id),
        dashboardApi.getPendingRequests(user.id)
      ]);
      console.log('Dashboard API Responses:', {
        totalInventoryRes,
        activeBranchesRes,
        monthlySalesRes,
        pendingRequestsRes
      });

      const totalInventory =
        (totalInventoryRes as any)?.count ??
        0;

      const activeBranches =
        (activeBranchesRes as any)?.count ??
        0;

      const monthlySales =
        (monthlySalesRes as any)?.count ??
        0;

      const totalRequests =
        (pendingRequestsRes as any)?.count ??
        0;


      // Fetch purchase and request data for recent activity
      const purchaseResponse = await purchaseApi.getPurchases();
      let allPurchases: PurchaseResponseDto[] = [];

      if (Array.isArray(purchaseResponse)) {
        allPurchases = purchaseResponse as PurchaseResponseDto[];
      } else if (purchaseResponse.success && purchaseResponse.data) {
        allPurchases = purchaseResponse.data as PurchaseResponseDto[];
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
              color: 'blue',
              icon: CubeIcon
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
        totalRequests,
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
      <div className="p-6 bg-gray-50 min-h-screen">
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

  // Error state
  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
            <p className="text-red-800 font-semibold">Error Loading Dashboard</p>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Electric Inventory Management System</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2 text-gray-600" />
            <span className="text-gray-700">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Inventory Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Inventory</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalInventory.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Items in stock</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CubeIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Active Branches Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Branches</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeBranches}</p>
              <p className="text-sm text-gray-500 mt-1">Branches online</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BuildingStorefrontIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Monthly Sales Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Sales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.monthlySales}</p>
              <p className="text-sm text-gray-500 mt-1">This month</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Pending Requests Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalRequests}</p>
              <p className="text-sm text-gray-500 mt-1">Awaiting approval</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>

        <div className="p-6">
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${activity.color === 'blue' ? 'bg-blue-100' :
                        activity.color === 'green' ? 'bg-green-100' :
                          activity.color === 'red' ? 'bg-red-100' :
                            activity.color === 'yellow' ? 'bg-yellow-100' : 'bg-gray-100'
                        }`}>
                        <IconComponent className={`w-5 h-5 ${activity.color === 'blue' ? 'text-blue-600' :
                          activity.color === 'green' ? 'text-green-600' :
                            activity.color === 'red' ? 'text-red-600' :
                              activity.color === 'yellow' ? 'text-yellow-600' : 'text-gray-600'
                          }`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {activity.value && (
                        <span className="text-sm text-gray-900 font-medium">
                          {activity.value}
                        </span>
                      )}
                      {activity.status && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${activity.color === 'green' ? 'bg-green-100 text-green-800' :
                          activity.color === 'red' ? 'bg-red-100 text-red-800' :
                            activity.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {activity.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No recent activity</p>
              <p className="text-gray-400 text-sm">Recent inventory activities will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
