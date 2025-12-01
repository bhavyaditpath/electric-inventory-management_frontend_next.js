"use client";

export default function DashboardPage() {
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
          <p className="text-3xl font-bold text-blue-600">1,234</p>
          <p className="text-sm text-gray-500">Items in stock</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Branches</h3>
          <p className="text-3xl font-bold text-green-600">12</p>
          <p className="text-sm text-gray-500">Branches online</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Monthly Sales</h3>
          <p className="text-3xl font-bold text-purple-600">$45,678</p>
          <p className="text-sm text-gray-500">This month</p>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">New inventory added</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
            <span className="text-sm text-blue-600">+50 items</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">Branch request approved</p>
              <p className="text-xs text-gray-500">4 hours ago</p>
            </div>
            <span className="text-sm text-green-600">Approved</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-900">Low stock alert</p>
              <p className="text-xs text-gray-500">6 hours ago</p>
            </div>
            <span className="text-sm text-red-600">5 items</span>
          </div>
        </div>
      </div>
    </div>
  );
}