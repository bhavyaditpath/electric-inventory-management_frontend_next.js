"use client";

export default function BranchDashboardPage() {
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
          <p className="text-3xl font-bold text-blue-600">856</p>
          <p className="text-sm text-gray-500">Items available</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Today's Sales</h3>
          <p className="text-3xl font-bold text-green-600">$2,450</p>
          <p className="text-sm text-gray-500">Revenue today</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Orders</h3>
          <p className="text-3xl font-bold text-orange-600">8</p>
          <p className="text-sm text-gray-500">From admin</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Sales</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">Fan - Model X200</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
              <span className="text-sm text-green-600">$45</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">Switch - Double Pole</p>
                <p className="text-xs text-gray-500">4 hours ago</p>
              </div>
              <span className="text-sm text-green-600">$12</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">Wire - 1.5mm Copper</p>
                <p className="text-xs text-gray-500">6 hours ago</p>
              </div>
              <span className="text-sm text-green-600">$28</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Stock Alerts</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">LED Bulbs - 10W</p>
                <p className="text-xs text-red-600">Only 3 left</p>
              </div>
              <span className="text-sm text-red-600">Low Stock</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">Extension Cord - 5m</p>
                <p className="text-xs text-orange-600">Only 8 left</p>
              </div>
              <span className="text-sm text-orange-600">Reorder Soon</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">Circuit Breaker</p>
                <p className="text-xs text-gray-500">15 in stock</p>
              </div>
              <span className="text-sm text-green-600">Good</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors">
            Request Stock from Admin
          </button>
          <button className="bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-colors">
            Record New Sale
          </button>
          <button className="bg-purple-600 text-white px-4 py-3 rounded-md hover:bg-purple-700 transition-colors">
            View Inventory
          </button>
        </div>
      </div>
    </div>
  );
}