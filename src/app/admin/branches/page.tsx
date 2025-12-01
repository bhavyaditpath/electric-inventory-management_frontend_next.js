"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import DataTable, { TableColumn } from "../../../components/DataTable";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { branchApi } from "@/Services/branch.api";
import Modal from "../../../components/Modal";
import ConfirmModal from "../../../components/ConfirmModal";
import { showSuccess, showError } from "@/Services/toast.service";

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

  const loadBranches = useCallback(async () => {
    setLoading(true);
    try {
      const response = await branchApi.getAll();
      if (response.success && Array.isArray(response.data)) {
        setBranches(response.data as Branch[]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredBranches = useMemo(() => {
    return branches.filter(branch =>
      branch.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [branches, searchTerm]);

  useEffect(() => {
    loadBranches();
  }, []);


  const handleEdit = useCallback((branch: Branch) => {
    setModalMode('edit');
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
    });
    setErrors({ name: '', phone: ''});
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
        await loadBranches();
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
  }, [deletingBranch, loadBranches]);

  const validateForm = useCallback(() => {
    const newErrors = { name: '', phone: ''};

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
        await loadBranches();
      } else {
        showError(response?.message || `Error ${modalMode === 'create' ? 'creating' : 'updating'} branch`);
      }
    } catch (error) {
      console.error(`Error ${modalMode === 'create' ? 'creating' : 'updating'} branch:`, error);
      showError(`Error ${modalMode === 'create' ? 'creating' : 'updating'} branch`);
    } finally {
      setIsSubmitting(false);
    }
  }, [modalMode, editingBranch, formData, validateForm, loadBranches]);

  const handleCreateBranch = useCallback(() => {
    setModalMode('create');
    setFormData({ name: '', address: '', phone: ''});
    setErrors({ name: '', phone: ''});
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
  ), [handleEdit, handleDelete]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Branches Management</h1>
            <p className="text-gray-600 mt-2">Manage all branches in the system</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 mt-4 md:mt-0">
            <input
              type="text"
              placeholder="Search by branch name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-500 rounded-md focus:outline-none text-gray-900"
            />
            <button
              onClick={handleCreateBranch}
              className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Add New Branch
            </button>
          </div>
        </div>
      </div>
        {/* bg-white rounded-lg shadow */}
      <div className="">
        <div className="p-0">
          <DataTable
            data={filteredBranches}
            columns={columns}
            loading={loading}
            emptyMessage="No branches found"
            actions={actions}
            moduleName="Branches Management"
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