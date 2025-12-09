"use client";

import { useState, useEffect } from "react";
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import DataTable from "../../../components/DataTable";
import ConfirmModal from "../../../components/ConfirmModal";
import { useAuth } from "../../../contexts/AuthContext";
import { alertApi, StockAlert } from "../../../Services/alert.api";
import { showSuccess, showError } from "../../../Services/toast.service";
import { AlertStatus, AlertPriority } from "../../../types/enums";

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const statusColors = {
  active: "bg-red-100 text-red-800",
  resolved: "bg-green-100 text-green-800",
  dismissed: "bg-gray-100 text-gray-800",
};

export default function BranchAlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isDismissModalOpen, setIsDismissModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<StockAlert | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.branchId && user.branchId > 0) {
      fetchAlerts();
    }
  }, [user?.branchId]);

  const fetchAlerts = async () => {
    if (!user?.branchId || user.branchId <= 0) return;

    try {
      setLoading(true);
      const response = await alertApi.getByBranch(user.branchId, undefined, 1, 100);
      setAlerts((response as any).data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      showError('Error fetching alerts');
    } finally {
      setLoading(false);
    }
  };

  const activeAlerts = alerts.filter(alert => alert.status === AlertStatus.ACTIVE);
  const resolvedAlerts = alerts.filter(alert => alert.status === AlertStatus.RESOLVED);
  const dismissedAlerts = alerts.filter(alert => alert.status === AlertStatus.DISMISSED);

  const columns = [
    {
      key: "itemName",
      header: "Item Name",
      sortable: true,
    },
    {
      key: "currentStock",
      header: "Current Stock",
      sortable: true,
      render: (value: string) => {
        const numValue = parseFloat(value);
        return (
          <span className={`font-medium ${numValue === 0 ? "text-red-600" : numValue <= 5 ? "text-orange-600" : "text-gray-900"}`}>
            {numValue}
          </span>
        );
      },
    },
    {
      key: "minStock",
      header: "Min Stock",
      sortable: true,
    },
    {
      key: "shortage",
      header: "Shortage",
      sortable: true,
      render: (value: string) => {
        const numValue = parseFloat(value);
        return (
          <span className="text-red-600 font-medium">
            -{numValue}
          </span>
        );
      },
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[value as keyof typeof priorityColors] || "bg-gray-100 text-gray-800"}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: "alertType",
      header: "Alert Type",
      sortable: true,
      render: (value: string) => (
        <span className="capitalize">
          {value.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created Date",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const handleResolve = (alert: StockAlert) => {
    setSelectedAlert(alert);
    setIsResolveModalOpen(true);
  };

  const handleDismiss = (alert: StockAlert) => {
    setSelectedAlert(alert);
    setIsDismissModalOpen(true);
  };

  const handleResolveConfirm = async () => {
    if (!selectedAlert) return;

    setIsSubmitting(true);
    try {
      const response = await alertApi.resolve(selectedAlert.id);
      if (response.success) {
        showSuccess('Alert resolved successfully');
        setAlerts(prev =>
          prev.map(alert =>
            alert.id === selectedAlert.id
              ? { ...alert, status: AlertStatus.RESOLVED, resolvedDate: new Date().toISOString() }
              : alert
          )
        );
        setIsResolveModalOpen(false);
        setSelectedAlert(null);
      } else {
        showError('Failed to resolve alert');
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
      showError('Error resolving alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismissConfirm = async () => {
    if (!selectedAlert) return;

    setIsSubmitting(true);
    try {
      const response = await alertApi.dismiss(selectedAlert.id);
      if (response.success) {
        showSuccess('Alert dismissed successfully');
        setAlerts(prev =>
          prev.map(alert =>
            alert.id === selectedAlert.id
              ? { ...alert, status: AlertStatus.DISMISSED }
              : alert
          )
        );
        setIsDismissModalOpen(false);
        setSelectedAlert(null);
      } else {
        showError('Failed to dismiss alert');
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
      showError('Error dismissing alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  const actions = (row: StockAlert) => (
    <div className="flex space-x-2">
      {row.status === AlertStatus.ACTIVE && (
        <>
          <button
            onClick={() => handleResolve(row)}
            className="text-green-600 hover:text-green-900 p-1"
            title="Mark as Resolved"
          >
            <CheckCircleIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDismiss(row)}
            className="text-gray-600 hover:text-gray-900 p-1"
            title="Dismiss Alert"
          >
            <XCircleIcon className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Stock Alerts</h1>
        <p className="text-gray-600 mt-2">Monitor low stock and out-of-stock alerts</p>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-red-600">
                {alerts.filter(a => a.priority === AlertPriority.CRITICAL).length}
              </div>
              <div className="text-sm text-red-700">Critical Alerts</div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {alerts.filter(a => a.priority === AlertPriority.HIGH).length}
              </div>
              <div className="text-sm text-orange-700">High Priority</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {activeAlerts.length}
              </div>
              <div className="text-sm text-yellow-700">Active Alerts</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-600">
                {resolvedAlerts.length}
              </div>
              <div className="text-sm text-green-700">Resolved</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircleIcon className="w-8 h-8 text-gray-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {dismissedAlerts.length}
              </div>
              <div className="text-sm text-gray-700">Dismissed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Alerts</h2>
        <DataTable
          data={activeAlerts}
          columns={columns}
          loading={loading}
          emptyMessage="No active alerts"
          actions={actions}
          moduleName="Active Stock Alerts"
          pagination={true}
          pageSize={5}
          showPageSizeSelector={false}
          striped={true}
          hover={true}
          size="md"
        />
      </div>

      {/* Resolved Alerts */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Resolved Alerts</h2>
        <DataTable
          data={resolvedAlerts}
          columns={columns}
          loading={loading}
          emptyMessage="No resolved alerts"
          moduleName="Resolved Stock Alerts"
          pagination={true}
          pageSize={5}
          showPageSizeSelector={false}
          striped={true}
          hover={true}
          size="md"
        />
      </div>

      {/* Dismissed Alerts */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Dismissed Alerts</h2>
        <DataTable
          data={dismissedAlerts}
          columns={columns}
          loading={loading}
          emptyMessage="No dismissed alerts"
          moduleName="Dismissed Stock Alerts"
          pagination={true}
          pageSize={5}
          showPageSizeSelector={false}
          striped={true}
          hover={true}
          size="md"
        />
      </div>

      {/* Resolve Confirmation Modal */}
      <ConfirmModal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Resolve Alert"
        message={`Mark the alert for "${selectedAlert?.itemName}" as resolved? This indicates the stock issue has been addressed.`}
        onConfirm={handleResolveConfirm}
        isDeleting={isSubmitting}
        confirmLabel="Mark as Resolved"
        variant="info"
      />

      {/* Dismiss Confirmation Modal */}
      <ConfirmModal
        isOpen={isDismissModalOpen}
        onClose={() => setIsDismissModalOpen(false)}
        title="Dismiss Alert"
        message={`Dismiss the alert for "${selectedAlert?.itemName}"? This will hide the alert but the stock issue may still exist.`}
        onConfirm={handleDismissConfirm}
        isDeleting={isSubmitting}
        confirmLabel="Dismiss Alert"
        variant="warning"
      />
    </div>
  );
}
