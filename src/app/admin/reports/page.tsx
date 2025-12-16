"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import DataTable, { TableColumn } from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import ReportDataRenderer from '@/components/ReportDataRenderer';
import { showSuccess, showError } from '@/Services/toast.service';
import { reportsApi, ReportType, DeliveryMethod } from '@/Services/reports.api';
import { PencilIcon, TrashIcon, DocumentTextIcon, CogIcon, ChartBarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ReportPreference {
  id: number;
  reportType: ReportType;
  deliveryMethod?: DeliveryMethod;
  isActive?: boolean;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('view');
  const [reportType, setReportType] = useState(ReportType.DAILY);
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<ReportPreference[]>([]);
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [editingPreference, setEditingPreference] = useState<ReportPreference | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPreference, setDeletingPreference] = useState<ReportPreference | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    reportType: ReportType.DAILY,
    deliveryMethod: DeliveryMethod.EMAIL,
    isActive: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const tabs = [
    { key: 'view', label: 'View Reports', icon: DocumentTextIcon },
    { key: 'generate', label: 'Generate Reports', icon: ChartBarIcon },
    { key: 'preferences', label: 'Preferences', icon: CogIcon },
  ];

  const firstLoad = useRef(false);

  useEffect(() => {
    if (!firstLoad.current) {
      firstLoad.current = true;
      if (activeTab === 'preferences') {
        fetchPreferences();
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'preferences') {
      fetchPreferences();
    }
  }, [activeTab]);

  const fetchReport = async (type: ReportType) => {
    setLoading(true);
    try {
      let response;
      switch (type) {
        case ReportType.DAILY:
          response = await reportsApi.getDailyReport();
          break;
        case ReportType.WEEKLY:
          response = await reportsApi.getWeeklyReport();
          break;
        case ReportType.MONTHLY:
          response = await reportsApi.getMonthlyReport();
          break;
        // case ReportType.HALF_YEARLY:
        //   response = await reportsApi.getHalfYearlyReport();
        //   break;
        case ReportType.YEARLY:
          response = await reportsApi.getYearlyReport();
          break;
        default:
          return;
      }
      if (response) {
        setReportData(response as unknown as Record<string, unknown>);
        showSuccess('Report loaded successfully');
      } else {
        showError(response || 'Failed to load report');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      showError('Error loading report');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await reportsApi.getUserPreferences();
      console.log(response)
      if (response) {
        setPreferences(Array.isArray(response) ? response : []);
      } else {
        showError(response || 'Failed to load preferences');
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      showError('Error loading preferences');
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const response = await reportsApi.generateReport(reportType);
      if (response) {
        showSuccess(response.message || 'Report generated successfully!');
      } else {
        showError('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      showError('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateScheduled = async () => {
    setLoading(true);
    try {
      const response = await reportsApi.generateScheduledReports();
      if (response) {
        showSuccess(response.message ||  'Scheduled reports generated successfully!');
      } else {
        showError('Failed to generate scheduled reports');
      }
    } catch (error) {
      console.error('Error generating scheduled reports:', error);
      showError('Error generating scheduled reports');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePreference = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const response = await reportsApi.createPreference(formData);
      if (response.success) {
        showSuccess(response.message || 'Preference created successfully');
        fetchPreferences();
        setShowPreferenceModal(false);
        resetForm();
      } else {
        showError(response.message || 'Failed to create preference');
      }
    } catch (error) {
      showError('Error creating preference');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  const handleUpdatePreference = useCallback(async () => {
    if (!editingPreference) return;
    setIsSubmitting(true);
    try {
      const response = await reportsApi.updatePreference(editingPreference.id, formData);
      if (response.success) {
        showSuccess(response.message || 'Preference updated successfully');
        fetchPreferences();
        setEditingPreference(null);
        resetForm();
      } else {
        showError(response.message || 'Failed to update preference');
      }
    } catch (error) {
      showError('Error updating preference');
    } finally {
      setIsSubmitting(false);
    }
  }, [editingPreference, formData]);

  const handleDeletePreference = useCallback(async () => {
    if (!deletingPreference) return;
    setIsDeleting(true);
    try {
      const response = await reportsApi.removePreference(deletingPreference.id);
      if (response.success) {
        showSuccess(response.message || 'Preference deleted successfully');
        fetchPreferences();
        setShowDeleteModal(false);
        setDeletingPreference(null);
      } else {
        showError(response.message || 'Failed to delete preference');
      }
    } catch (error) {
      console.error('Error deleting preference:', error);
      showError('Error deleting preference');
    } finally {
      setIsDeleting(false);
    }
  }, [deletingPreference]);

  const resetForm = () => {
    setFormData({
      reportType: ReportType.DAILY,
      deliveryMethod: DeliveryMethod.EMAIL,
      isActive: true
    });
    setErrors({});
  };

  const handleEdit = useCallback((preference: ReportPreference) => {
    setEditingPreference(preference);
    setFormData({
      reportType: preference.reportType,
      deliveryMethod: preference.deliveryMethod || DeliveryMethod.EMAIL,
      isActive: preference.isActive ?? true
    });
    setErrors({});
  }, []);

  const handleDelete = useCallback((preference: ReportPreference) => {
    setDeletingPreference(preference);
    setShowDeleteModal(true);
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    // Add validation logic if needed
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingPreference) {
      await handleUpdatePreference();
    } else {
      await handleCreatePreference();
    }
  }, [editingPreference, validateForm, handleUpdatePreference, handleCreatePreference]);

  const columns = useMemo<TableColumn<ReportPreference>[]>(() => [
    {
      key: "reportType",
      header: "Report Type",
      sortable: true,
      render: (value: ReportType) => (
        <span className="capitalize font-medium">
          {value.replace('-', ' ')} Report
        </span>
      )
    },
    {
      key: "deliveryMethod",
      header: "Delivery Method",
      sortable: true,
      render: (value?: DeliveryMethod) => value || 'Not set'
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      render: (value?: boolean) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ], []);

  const actions = useCallback(
    (preference: ReportPreference) => (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleEdit(preference)}
          className="text-yellow-600 hover:text-yellow-900 p-1 cursor-pointer"
          title="Edit Preference"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDelete(preference)}
          className="text-red-600 hover:text-red-900 p-1 cursor-pointer"
          title="Delete Preference"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    ),
    [handleEdit, handleDelete]
  );

  return (
    <div className="p-6 bg-gray-50 ">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports Management</h1>
            <p className="text-gray-600 mt-1">View, generate and manage system reports and preferences</p>
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

      {/* Main Tabs */}
      <div className="mb-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors flex-1 justify-center ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'view' && (
        <div className="space-y-8">
          {/* Report Type Selection */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Select Report Type</h2>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.values(ReportType).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setReportType(type);
                      fetchReport(type);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                      reportType === type
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <DocumentTextIcon className="w-8 h-8 mx-auto mb-3 text-gray-600" />
                      <span className="font-semibold capitalize text-sm">
                        {type.replace('-', ' ')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Report Display */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading report...</p>
              </div>
            ) : reportData ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <ChartBarIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {reportType.charAt(0).toUpperCase() + reportType.slice(1).replace('-', ' ')} Report
                      </h2>
                      <p className="text-sm text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => fetchReport(reportType)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Refresh
                  </button>
                </div>
                <ReportDataRenderer data={reportData} />
              </div>
            ) : (
              <div className="p-12 text-center">
                <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium text-lg">Select a report type to view data</p>
                <p className="text-gray-500 text-sm mt-1">Choose from the available report types above</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generate Specific Report */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <ChartBarIcon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Generate Specific Report</h2>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Report Type
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white text-gray-900"
                  >
                    {Object.values(ReportType).map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')} Report
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleGenerateReport}
                  disabled={loading}
                  className={`w-full py-3.5 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-2 focus:ring-blue-200 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3 inline-block"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <ChartBarIcon className="w-5 h-5 mr-2 inline-block" />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Generate Scheduled Reports */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <CogIcon className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Generate Scheduled Reports</h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6 leading-relaxed">
                Generate all reports that are scheduled based on user preferences. This will process all active report preferences and deliver them according to their configured settings.
              </p>
              <button
                onClick={handleGenerateScheduled}
                disabled={loading}
                className={`w-full py-3.5 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 active:bg-green-800 focus:ring-2 focus:ring-green-200 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3 inline-block"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <CogIcon className="w-5 h-5 mr-2 inline-block" />
                    Generate All Scheduled Reports
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Preferences</p>
                  <p className="text-3xl font-bold text-gray-900">{preferences.length}</p>
                  <p className="text-sm text-gray-500 mt-1">Configured reports</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Preferences</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {preferences.filter((p: any) => p.isActive).length}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Currently active</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Email Delivery</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {preferences.filter((p: any) => p.deliveryMethod === DeliveryMethod.EMAIL).length}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Email preferences</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CogIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Table */}
          <div>
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                <CogIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Report Preferences</h2>
                <p className="text-sm text-gray-600">Manage automated report delivery preferences</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-gray-900">All Preferences</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      {preferences.length} total
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingPreference(null);
                      resetForm();
                      setShowPreferenceModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <CogIcon className="w-4 h-4 mr-2" />
                    Add Preference
                  </button>
                </div>
              </div>
              <DataTable
                data={preferences}
                columns={columns}
                loading={loading}
                emptyMessage="No preferences found"
                moduleName="Report Preferences"
                actions={actions}
                striped={true}
                hover={true}
                size="md"
                pagination={true}
                pageSize={10}
                showPageSizeSelector={true}
                pageSizeOptions={[5, 10, 25, 50]}
              />
            </div>
          </div>
        </div>
      )}

      {/* Preference Modal */}
      <Modal
        isOpen={showPreferenceModal || !!editingPreference}
        onClose={() => {
          setShowPreferenceModal(false);
          setEditingPreference(null);
          resetForm();
        }}
        title={editingPreference ? 'Edit Report Preference' : 'Create Report Preference'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="reportType" className="block text-sm font-semibold text-gray-700 mb-2">
              Report Type <span className="text-red-500">*</span>
            </label>
            <select
              id="reportType"
              value={formData.reportType}
              onChange={(e) => setFormData({ ...formData, reportType: e.target.value as ReportType })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white text-gray-900"
            >
              {Object.values(ReportType).map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')} Report
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="deliveryMethod" className="block text-sm font-semibold text-gray-700 mb-2">
              Delivery Method <span className="text-red-500">*</span>
            </label>
            <select
              id="deliveryMethod"
              value={formData.deliveryMethod}
              onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value as DeliveryMethod })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white text-gray-900"
            >
              <option value={DeliveryMethod.EMAIL}>Email</option>
              <option value={DeliveryMethod.LOCAL_FILE}>Local File</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              id="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-3 block text-sm text-gray-900 font-medium">
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
            <button
              type="button"
              onClick={() => {
                setShowPreferenceModal(false);
                setEditingPreference(null);
                resetForm();
              }}
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {editingPreference ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                editingPreference ? 'Update Preference' : 'Create Preference'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Report Preference"
        message={`Are you sure you want to delete the "${deletingPreference?.reportType}" preference? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeletePreference}
        isDeleting={isDeleting}
        variant="danger"
      />
    </div>
  );
}
