"use client";

import { useState, useEffect } from "react";
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
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
  dismissed: "bg-[var(--theme-surface-muted)] text-[var(--theme-text)]",
};

export default function AdminAlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
      // Get alerts for the admin's branch
      const response = await alertApi.getByBranch(user.branchId, undefined, 1, 100);
      setAlerts((response as any).data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts data');
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
          <span className={`font-medium ${numValue === 0 ? "text-red-600" : numValue <= 5 ? "text-orange-600" : "text-[var(--theme-text)]"}`}>
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
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[value as keyof typeof priorityColors] || "bg-[var(--theme-surface-muted)] text-[var(--theme-text)]"}`}>
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
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value as keyof typeof statusColors] || "bg-[var(--theme-surface-muted)] text-[var(--theme-text)]"}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    // {
    //   key: "createdAt",
    //   header: "Created Date",
    //   sortable: true,
    //   render: (value: string) => new Date(value).toLocaleDateString(),
    // },
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
      if (response) {
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
      if (response) {
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
            className="text-green-600 hover:text-green-900 p-1 transition-colors"
            title="Mark as Resolved"
          >
            <CheckCircleIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDismiss(row)}
            className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] p-1 transition-colors"
            title="Dismiss Alert"
          >
            <XCircleIcon className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 bg-[var(--theme-bg)] text-[var(--theme-text)] min-h-screen">
        <div className="mb-6">
          <div className="h-8 bg-[var(--theme-surface-muted)] rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-[var(--theme-surface-muted)] rounded w-80 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)] p-6 animate-pulse">
              <div className="h-4 bg-[var(--theme-surface-muted)] rounded w-3/4 mb-3"></div>
              <div className="h-8 bg-[var(--theme-surface-muted)] rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-[var(--theme-surface-muted)] rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[var(--theme-bg)] text-[var(--theme-text)] min-h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--theme-text)]">Admin Alerts</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
            <p className="text-red-800 font-semibold">Error Loading Alerts</p>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchAlerts}
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
    <div className="p-6 bg-[var(--theme-bg)] text-[var(--theme-text)] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--theme-text)]">Admin Alerts</h1>
            <p className="text-[var(--theme-text-muted)] mt-1">Monitor stock alerts across all branches</p>
          </div>
          <button
            onClick={fetchAlerts}
            className="inline-flex items-center px-4 py-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg hover:bg-[var(--theme-surface-muted)] transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2 text-[var(--theme-text-muted)]" />
            <span className="text-[var(--theme-text)]">Refresh</span>
          </button>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Critical Alerts Card */}
        <div className="bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--theme-text-muted)]">Critical Alerts</p>
              <p className="text-3xl font-bold text-red-600">{alerts.filter(a => a.priority === AlertPriority.CRITICAL).length}</p>
              <p className="text-sm text-[var(--theme-text-muted)] mt-1">Immediate attention</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* High Priority Card */}
        <div className="bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--theme-text-muted)]">High Priority</p>
              <p className="text-3xl font-bold text-orange-600">{alerts.filter(a => a.priority === AlertPriority.HIGH).length}</p>
              <p className="text-sm text-[var(--theme-text-muted)] mt-1">Urgent action needed</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Active Alerts Card */}
        <div className="bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--theme-text-muted)]">Active Alerts</p>
              <p className="text-3xl font-bold text-yellow-600">{activeAlerts.length}</p>
              <p className="text-sm text-[var(--theme-text-muted)] mt-1">Currently active</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Resolved Alerts Card */}
        <div className="bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--theme-text-muted)]">Resolved</p>
              <p className="text-3xl font-bold text-green-600">{resolvedAlerts.length}</p>
              <p className="text-sm text-[var(--theme-text-muted)] mt-1">Issues addressed</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Alert Sections */}
      <div className="space-y-8">
        {/* Active Alerts */}
        <div>
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--theme-text)]">Active Alerts</h2>
              <p className="text-sm text-[var(--theme-text-muted)]">Alerts requiring immediate attention</p>
            </div>
          </div>

          <DataTable
            data={activeAlerts}
            columns={columns}
            loading={loading}
            emptyMessage="No active alerts"
            actions={actions}
            moduleName="Active Admin Alerts"
            pagination={true}
            pageSize={5}
            showPageSizeSelector={true}
            striped={true}
            hover={true}
            size="md"
          />
        </div>

        {/* Resolved Alerts */}
        <div>
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--theme-text)]">Resolved Alerts</h2>
              <p className="text-sm text-[var(--theme-text-muted)]">Alerts that have been addressed</p>
            </div>
          </div>

          <DataTable
            data={resolvedAlerts}
            columns={columns}
            loading={false}
            emptyMessage="No resolved alerts"
            moduleName="Resolved Admin Alerts"
            pagination={true}
            pageSize={5}
            showPageSizeSelector={true}
            striped={true}
            hover={true}
            size="md"
          />
        </div>

        {/* Dismissed Alerts */}
        <div>
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-[var(--theme-surface-muted)] rounded-lg flex items-center justify-center mr-4">
              <XCircleIcon className="w-6 h-6 text-[var(--theme-text-muted)]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--theme-text)]">Dismissed Alerts</h2>
              <p className="text-sm text-[var(--theme-text-muted)]">Alerts that have been dismissed</p>
            </div>
          </div>

          <DataTable
            data={dismissedAlerts}
            columns={columns}
            loading={false}
            emptyMessage="No dismissed alerts"
            moduleName="Dismissed Admin Alerts"
            pagination={true}
            pageSize={5}
            showPageSizeSelector={true}
            striped={true}
            hover={true}
            size="md"
          />
        </div>
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
