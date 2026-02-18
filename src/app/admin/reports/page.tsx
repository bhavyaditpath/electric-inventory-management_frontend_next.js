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
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratingScheduled, setIsGeneratingScheduled] = useState(false);

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
    setIsGeneratingReport(true);
    try {
      const response = await reportsApi.generateReport(reportType);
      if (response) {
        showSuccess(response.message || 'Report generated successfully!');
      } else {
        showError('Failed to generate report');
      }
    } catch (error) {
      showError('Error generating report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleGenerateScheduled = async () => {
    setIsGeneratingScheduled(true);
    try {
      const response = await reportsApi.generateScheduledReports();
      if (response) {
        showSuccess(response.message || 'Scheduled reports generated successfully!');
      } else {
        showError('Failed to generate scheduled reports');
      }
    } catch (error) {
      showError('Error generating scheduled reports');
    } finally {
      setIsGeneratingScheduled(false);
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
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
        {/* <button
          onClick={() => handleDelete(preference)}
          className="text-red-600 hover:text-red-900 p-1 cursor-pointer"
          title="Delete Preference"
        >
          <TrashIcon className="w-4 h-4" />
        </button> */}
      </div>
    ),
    [handleEdit, handleDelete]
  );

  return (
    <div className="p-4 sm:p-6 bg-[var(--theme-bg)] text-[var(--theme-text)] min-h-screen">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--theme-text)]">Reports Management</h1>
            <p className="text-[var(--theme-text-muted)] mt-1 text-sm sm:text-base">View, generate and manage system reports and preferences</p>
          </div>
          {/* <div className="flex justify-center lg:justify-end">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-3 py-2 sm:px-4 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg hover:bg-[var(--theme-surface-muted)] transition-colors text-sm sm:text-base"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1 sm:mr-2 text-[var(--theme-text-muted)]" />
              <span className=" text-[var(--theme-text)]">Refresh</span>
            </button>
          </div> */}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)] shadow-sm">
          <nav className="flex flex-col sm:flex-row">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 sm:border-b-2 transition-colors flex-1 justify-center sm:justify-center ${activeTab === tab.key
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-muted)]'
                    }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="text-xs sm:text-sm">{tab.label}</span>
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
          <div className="bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)] shadow-sm">
            <div className="px-6 py-4 border-b border-[var(--theme-border)]">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--theme-text)]">Select Report Type</h2>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {Object.values(ReportType).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setReportType(type);
                      fetchReport(type);
                    }}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all hover:shadow-md ${reportType === type
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                        : 'border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text)] hover:border-[var(--theme-border-strong)] hover:bg-[var(--theme-surface-muted)]'
                      }`}
                  >
                    <div className="text-center">
                      <DocumentTextIcon className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3 text-[var(--theme-text-muted)]" />
                      <span className="font-semibold capitalize text-xs sm:text-sm">
                        {type.replace('-', ' ')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Report Display */}
          <div className="bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)] shadow-sm">
            {loading ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[var(--theme-text-muted)] font-medium text-sm sm:text-base">Loading report...</p>
              </div>
            ) : reportData ? (
              <div className="p-4 sm:p-6">
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4 sm:mb-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                      <ChartBarIcon className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-[var(--theme-text)]">
                        {reportType.charAt(0).toUpperCase() + reportType.slice(1).replace('-', ' ')} Report
                      </h2>
                      <p className="text-xs sm:text-sm text-[var(--theme-text-muted)]">Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex justify-start sm:justify-end">
                    <button
                      onClick={() => fetchReport(reportType)}
                      className="inline-flex items-center px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                    >
                      <ArrowPathIcon className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="">Refresh</span>
                    </button>
                  </div>
                </div>
                <ReportDataRenderer data={reportData} />
              </div>
            ) : (
              <div className="p-8 sm:p-12 text-center">
                <DocumentTextIcon className="w-12 h-12 sm:w-16 sm:h-16 text-[var(--theme-text-muted)] mx-auto mb-4" />
                <p className="text-[var(--theme-text-muted)] font-medium text-base sm:text-lg">Select a report type to view data</p>
                <p className="text-[var(--theme-text-muted)] text-xs sm:text-sm mt-1">Choose from the available report types above</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Generate Specific Report */}
          <div className="bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)] shadow-sm">
            <div className="px-4 sm:px-6 py-4 border-b border-[var(--theme-border)]">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <ChartBarIcon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-[var(--theme-text)]">Generate Specific Report</h2>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--theme-text)] mb-3">
                    Report Type
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                    className="w-full px-4 py-3 border border-[var(--theme-border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-[var(--theme-surface)] text-[var(--theme-text)]"
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
                   disabled={isGeneratingReport}
                  className={`w-full py-3.5 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${isGeneratingReport 
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-2 focus:ring-blue-200 shadow-lg hover:shadow-xl'
                    }`}
                >
                  {isGeneratingReport  ? (
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
          <div className="bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)] shadow-sm">
            <div className="px-4 sm:px-6 py-4 border-b border-[var(--theme-border)]">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <CogIcon className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-[var(--theme-text)]">Generate Scheduled Reports</h2>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <p className="text-[var(--theme-text-muted)] mb-6 leading-relaxed">
                Generate all reports that are scheduled based on user preferences. This will process all active report preferences and deliver them according to their configured settings.
              </p>
              <button
                onClick={handleGenerateScheduled}
                disabled={isGeneratingScheduled}
                className={`w-full py-3.5 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${isGeneratingScheduled
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 active:bg-green-800 focus:ring-2 focus:ring-green-200 shadow-lg hover:shadow-xl'
                  }`}
              >
                {isGeneratingScheduled ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3 inline-block"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <CogIcon className="w-5 h-5 mr-2 inline-block" />
                    Generate All Preference Reports
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)] p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--theme-text-muted)]">Total Preferences</p>
                  <p className="text-2xl sm:text-3xl font-bold text-[var(--theme-text)]">{preferences.length}</p>
                  <p className="text-xs sm:text-sm text-[var(--theme-text-muted)] mt-1">Configured reports</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center ml-3">
                  <DocumentTextIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)] p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--theme-text-muted)]">Active Preferences</p>
                  <p className="text-2xl sm:text-3xl font-bold text-[var(--theme-text)]">
                    {preferences.filter((p: any) => p.isActive).length}
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--theme-text-muted)] mt-1">Currently active</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center ml-3">
                  <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)] p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--theme-text-muted)]">Email Delivery</p>
                  <p className="text-2xl sm:text-3xl font-bold text-[var(--theme-text)]">
                    {preferences.filter((p: any) => p.deliveryMethod === DeliveryMethod.EMAIL).length}
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--theme-text-muted)] mt-1">Email preferences</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center ml-3">
                  <CogIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Table */}
          <div>
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <CogIcon className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-[var(--theme-text)]">Report Preferences</h2>
                <p className="text-xs sm:text-sm text-[var(--theme-text-muted)]">Manage automated report delivery preferences</p>
              </div>
            </div>

            <div className="bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)] shadow-sm">
              <div className="px-4 sm:px-6 py-4 border-b border-[var(--theme-border)]">
                <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-base sm:text-lg font-semibold text-[var(--theme-text)]">All Preferences</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-[var(--theme-surface-muted)] text-[var(--theme-text)] rounded-full">
                      {preferences.length} total
                    </span>
                  </div>
                  <div className="flex justify-start sm:justify-end">
                    <button
                      onClick={() => {
                        setEditingPreference(null);
                        resetForm();
                        setShowPreferenceModal(true);
                      }}
                      className="inline-flex items-center px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                    >
                      <CogIcon className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="">Add Preference</span>
                      <span className="xs:hidden">Add</span>
                    </button>
                  </div>
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
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="reportType" className="block text-sm font-semibold text-[var(--theme-text)] mb-2">
              Report Type <span className="text-red-500">*</span>
            </label>
            <select
              id="reportType"
              value={formData.reportType}
              onChange={(e) => setFormData({ ...formData, reportType: e.target.value as ReportType })}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-[var(--theme-border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-[var(--theme-surface)] text-[var(--theme-text)] text-sm sm:text-base"
            >
              {Object.values(ReportType).map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')} Report
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="deliveryMethod" className="block text-sm font-semibold text-[var(--theme-text)] mb-2">
              Delivery Method <span className="text-red-500">*</span>
            </label>
            <select
              id="deliveryMethod"
              value={formData.deliveryMethod}
              onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value as DeliveryMethod })}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-[var(--theme-border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-[var(--theme-surface)] text-[var(--theme-text)] text-sm sm:text-base"
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
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-[var(--theme-border)] rounded"
            />
            <label htmlFor="isActive" className="ml-3 block text-sm text-[var(--theme-text)] font-medium">
              Active
            </label>
          </div>

          <div className="flex flex-col space-y-3 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-[var(--theme-border)] bg-[var(--theme-surface-muted)] -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-4 rounded-b-xl">
            <button
              type="button"
              onClick={() => {
                setShowPreferenceModal(false);
                setEditingPreference(null);
                resetForm();
              }}
              disabled={isSubmitting}
              className="px-4 py-2 sm:px-6 sm:py-2.5 text-sm font-medium text-[var(--theme-text)] bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg hover:bg-[var(--theme-surface-muted)] focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 sm:px-6 sm:py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer order-1 sm:order-2"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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

