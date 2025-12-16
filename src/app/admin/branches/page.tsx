"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import DataTable, { TableColumn } from "../../../components/DataTable";
import { PencilIcon, TrashIcon, ArrowPathIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline";
import { branchApi } from "@/Services/branch.api";
import Modal from "../../../components/Modal";
import ConfirmModal from "../../../components/ConfirmModal";
import { showSuccess, showError } from "@/Services/toast.service";
import { PaginatedResponse } from "@/types/api-types";

interface Branch {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: number | null;
  updatedBy: number | null;
  isRemoved: boolean;
}

const columns: TableColumn<Branch>[] = [
  {
    key: "name",
    header: "Branch Name",
    sortable: true,
    className: "font-medium text-gray-900"
  },
  {
    key: "address",
    header: "Address",
    sortable: false,
    render: (value: string | undefined) => (
      <div className="max-w-xs truncate" title={value || "N/A"}>
        {value || "N/A"}
      </div>
    )
  },
  {
    key: "phone",
    header: "Phone",
    sortable: false,
    render: (value: string | undefined) => value || "N/A"
  },
  {
    key: "createdAt",
    header: "Created",
    sortable: true,
    render: (value: string) => new Date(value).toLocaleDateString()
  },
  // {
  //   key: "isRemoved",
  //   header: "Status",
  //   sortable: true,
  //   render: (value: boolean) => (
  //     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
  //       !value
  //         ? 'bg-green-100 text-green-800'
  //         : 'bg-red-100 text-red-800'
  //     }`}>
  //       {!value ? 'Active' : 'Inactive'}
  //     </span>
  //   )
  // }
];

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '', phone: '' });
  const [errors, setErrors] = useState({ name: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Sorting state
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const loadBranches = useCallback(async (page: number = currentPage, pageSizeValue: number = pageSize, search: string = searchTerm, sortByValue: string = sortBy, sortOrderValue: string = sortOrder) => {
    setLoading(true);
    try {
      const response = await branchApi.getAll({
        page,
        pageSize: pageSizeValue,
        search: search.trim() || undefined,
        sortBy: sortByValue || undefined,
        sortOrder: (sortOrderValue as 'asc' | 'desc') || undefined
      });
      if (response.success) {
        const data = response.data;
        // Data is always paginated from server
        const paginatedData = data as PaginatedResponse<Branch>;
        setBranches(paginatedData.items);
        setTotalRecords(paginatedData.total);
      } else {
        throw new Error('API response indicates failure');
      }
    } catch (error) {
      console.error('Error loading branches:', error);
      setBranches([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortBy, sortOrder]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
    loadBranches(1, pageSize, value, sortBy, sortOrder);
  }, [pageSize, sortBy, sortOrder, loadBranches]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    loadBranches(page, pageSize, searchTerm, sortBy, sortOrder);
  }, [pageSize, searchTerm, sortBy, sortOrder, loadBranches]);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page
    loadBranches(1, newPageSize, searchTerm, sortBy, sortOrder);
  }, [searchTerm, sortBy, sortOrder, loadBranches]);

  const handleSort = useCallback((sortByValue: string, sortOrderValue: 'asc' | 'desc') => {
    setSortBy(sortByValue);
    setSortOrder(sortOrderValue);
    setCurrentPage(1); // Reset to first page when sorting
    loadBranches(1, pageSize, searchTerm, sortByValue, sortOrderValue);
  }, [pageSize, searchTerm, loadBranches]);

  const firstLoad = useRef(false);

  useEffect(() => {
    if (!firstLoad.current) {
      firstLoad.current = true;
      loadBranches(1, 10, '', '', '');
    }
  }, [loadBranches]);


  const handleEdit = useCallback((branch: Branch) => {
    setModalMode('edit');
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
    });
    setErrors({ name: '', phone: '' });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback((branch: Branch) => {
    setDeletingBranch(branch);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deletingBranch) return;
    setIsDeleting(true);
    try {
      const response = await branchApi.delete(deletingBranch.id);
      if (response.success) {
        showSuccess(response.message || "Branch deleted successfully");
        await loadBranches(currentPage, pageSize, searchTerm, sortBy, sortOrder);
        setShowDeleteModal(false);
        setDeletingBranch(null);
      } else {
        showError(response.message || "Error deleting branch");
      }
    } catch (error) {
      console.error("Error deleting branch:", error);
      showError("Error deleting branch");
    } finally {
      setIsDeleting(false);
    }
  }, [deletingBranch, currentPage, pageSize, searchTerm, sortBy, sortOrder, loadBranches]);

  const validateForm = useCallback(() => {
    const newErrors = { name: '', phone: '' };

    if (!formData.name.trim()) {
      newErrors.name = 'Branch name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return !newErrors.name && !newErrors.phone;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      let response;
      if (modalMode === 'create') {
        response = await branchApi.create({
          name: formData.name,
          address: formData.address,
          phone: formData.phone
        });
      } else if (modalMode === 'edit' && editingBranch) {
        response = await branchApi.update(editingBranch.id, {
          name: formData.name,
          address: formData.address,
          phone: formData.phone
        });
      }

      if (response && response.success) {
        showSuccess(response.message || `Branch ${modalMode === 'create' ? 'created' : 'updated'} successfully`);
        setShowModal(false);
        setEditingBranch(null);
        await loadBranches(currentPage, pageSize, searchTerm, sortBy, sortOrder);
      } else {
        showError(response?.message || `Error ${modalMode === 'create' ? 'creating' : 'updating'} branch`);
      }
    } catch (error) {
      console.error(`Error ${modalMode === 'create' ? 'creating' : 'updating'} branch:`, error);
      showError(`Error ${modalMode === 'create' ? 'creating' : 'updating'} branch`);
    } finally {
      setIsSubmitting(false);
    }
  }, [modalMode, editingBranch, formData, validateForm, currentPage, pageSize, searchTerm, sortBy, sortOrder, loadBranches]);

  const handleCreateBranch = useCallback(() => {
    setModalMode('create');
    setFormData({ name: '', address: '', phone: '' });
    setErrors({ name: '', phone: '' });
    setShowModal(true);
  }, []);

  const actions = useCallback((branch: Branch, index: number) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(branch);
        }}
        className="text-yellow-600 hover:text-yellow-900 p-1 cursor-pointer"
        title="Edit Branch"
      >
        <PencilIcon className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(branch);
        }}
        className="text-red-600 hover:text-red-900 p-1 cursor-pointer"
        title="Delete Branch"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  ), []);

  return (
    <div className="p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Branches Management</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage all branches in the system</p>
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-3 py-2 sm:px-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1 sm:mr-2 text-gray-600" />
              <span className="text-gray-700">Refresh</span>
            </button>
            <button
              onClick={handleCreateBranch}
              className="inline-flex items-center justify-center px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors text-sm sm:text-base"
            >
              <BuildingStorefrontIcon className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Add New Branch</span>
              <span className="xs:hidden">Add Branch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <BuildingStorefrontIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by branch name..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white text-gray-900"
          />
        </div>
      </div>
      {/* bg-white rounded-lg shadow */}
      <div className="">
        <div className="p-0">
          <DataTable
            data={branches}
            columns={columns}
            loading={loading}
            emptyMessage="No branches found"
            actions={actions}
            moduleName="Branches Management"
            striped={true}
            hover={true}
            size="md"
            pagination={true}
            serverSide={true}
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalRecords}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSort={handleSort}
            showPageSizeSelector={true}
            pageSizeOptions={[5, 10, 25, 50]}
          />
        </div>
      </div>

      {/* Branch Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalMode === 'create' ? 'Create New Branch' : 'Edit Branch'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label htmlFor="name" className="block text-sm font-semibold text-gray-800">
              Branch Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
              placeholder="Enter branch name"
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="address" className="block text-sm font-semibold text-gray-800">
              Address
            </label>
            <textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-500 resize-none"
              placeholder="Enter branch address"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-800">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
              placeholder="Enter phone number"
            />
            {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
            <button
              type="button"
              onClick={() => setShowModal(false)}
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
                  {modalMode === 'create' ? 'Creating...' : 'Updating...'}
                </span>
              ) : (
                modalMode === 'create' ? 'Create Branch' : 'Update Branch'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Branch"
        message={`Are you sure you want to delete "${deletingBranch?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        variant="danger"
      />
    </div>
  );
}