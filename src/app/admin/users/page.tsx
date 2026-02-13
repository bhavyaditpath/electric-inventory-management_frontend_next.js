"use client";

import DataTable, { TableColumn } from "@/components/DataTable";
import { userApi } from "@/Services/user.api";
import { PencilIcon, TrashIcon } from "@heroicons/react/16/solid";
import { ArrowPathIcon, UsersIcon } from "@heroicons/react/24/outline";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import InputField from "@/components/InputField";
import { UserRole } from "@/types/enums";
import { showSuccess, showError } from "@/Services/toast.service";
import { User, PaginatedResponse } from "@/types/api-types";

export default function UserPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [branches, setBranches] = useState<string[]>([]);
    const [formData, setFormData] = useState({ username: '', password: '', role: UserRole.BRANCH, branchName: '' });
    const [errors, setErrors] = useState({ username: '', password: '', branchName: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    // Sorting state
    const [sortBy, setSortBy] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const loadBranches = useCallback(async () => {
        if (branches.length > 0) return;
        const response = await userApi.getAllBranches();
        if (response.success) {
            setBranches(response.data as string[]);
        }
    }, [branches]);

    const loadUsers = useCallback(async (page: number = currentPage, pageSizeValue: number = pageSize, search: string = debouncedSearchTerm, sortByValue: string = sortBy, sortOrderValue: string = sortOrder) => {
        setLoading(true);
        try {
            const response = await userApi.getAll({
                page,
                pageSize: pageSizeValue,
                search: search.trim() || undefined,
                sortBy: sortByValue || undefined,
                sortOrder: (sortOrderValue as 'asc' | 'desc') || undefined
            });
            if (response.success) {
                const data = response.data;
                const paginatedData = data as PaginatedResponse<User>;
                setUsers(paginatedData.items);
                setTotalRecords(paginatedData.total);
            } else {
                throw new Error('API response indicates failure');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            setUsers([]);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    }, [pageSize, debouncedSearchTerm, sortBy, sortOrder]);

    const columns = useMemo<TableColumn<User>[]>(() => [
        {
            key: "username",
            header: "User Name",
            sortable: true,
            className: "font-medium text-gray-900"
        },
        {
            key: "role",
            header: "Role",
            render: (value: string | undefined) => value || "N/A"
        },
        {
            key: "branch",
            header: "Branch",
            render: (value: string | null) => value || "N/A"
        },
        // {
        //     key: "isRemoved",
        //     header: "Status",
        //     sortable: true,
        //     render: (value: boolean) => (
        //         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${!value
        //             ? 'bg-green-100 text-green-800'
        //             : 'bg-red-100 text-red-800'
        //             }`}>
        //             {!value ? 'Active' : 'Inactive'}
        //         </span>
        //     )
        // }
    ], []);
    const firstLoad = useRef(false);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (!firstLoad.current) {
            firstLoad.current = true;
            loadUsers(1, 10, '', '', '');
        }
    }, [loadUsers]);

    // Load users when debounced search term changes
    useEffect(() => {
        if (firstLoad.current) {
            loadUsers(1, pageSize, debouncedSearchTerm, sortBy, sortOrder);
        }
    }, [debouncedSearchTerm, pageSize, sortBy, sortOrder, loadUsers]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setCurrentPage(1); // Reset to first page when searching
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
        loadUsers(page, pageSize, searchTerm, sortBy, sortOrder);
    }, [pageSize, searchTerm, sortBy, sortOrder, loadUsers]);

    const handlePageSizeChange = useCallback((newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(1); // Reset to first page
        loadUsers(1, newPageSize, searchTerm, sortBy, sortOrder);
    }, [searchTerm, sortBy, sortOrder, loadUsers]);

    const handleSort = useCallback((sortByValue: string, sortOrderValue: 'asc' | 'desc') => {
        setSortBy(sortByValue);
        setSortOrder(sortOrderValue);
        setCurrentPage(1); // Reset to first page when sorting
        loadUsers(1, pageSize, searchTerm, sortByValue, sortOrderValue);
    }, [pageSize, searchTerm, loadUsers]);

    const handleCreateUser = useCallback(() => {
        setModalMode('create');
        setFormData({ username: '', password: '', role: UserRole.BRANCH, branchName: '' });
        setErrors({ username: '', password: '', branchName: '' });
        loadBranches();
        setShowModal(true);
    }, [])

    const handleEdit = useCallback((user: User) => {
        setModalMode('edit');
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '',
            role: user.role as UserRole,
            branchName: user.branch || '',
        });
        setErrors({ username: '', password: '', branchName: '' });
        loadBranches();
        setShowModal(true);
    }, []);

    const handleDelete = useCallback((user: User) => {
        setDeletingUser(user);
        setShowDeleteModal(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!deletingUser) return;
        setIsDeleting(true);
        try {
            const response = await userApi.delete(deletingUser.id);
            if (response.success) {
                showSuccess(response.message || "User deleted successfully");
                await loadUsers(currentPage, pageSize, searchTerm, sortBy, sortOrder);
                setShowDeleteModal(false);
                setDeletingUser(null);
            } else {
                showError(response.message || "Error deleting user");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            showError("Error deleting user");
        } finally {
            setIsDeleting(false);
        }
    }, [deletingUser, currentPage, pageSize, searchTerm, sortBy, sortOrder, loadUsers]);

    const validateForm = useCallback(() => {
        const newErrors = { username: '', password: '', branchName: '' };

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else {
            // Email validation REGEX
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(formData.username)) {
                newErrors.username = 'Username must be a valid email';
            }
        }

        if (modalMode === 'create' && !formData.password.trim()) {
            newErrors.password = 'Password is required';
        }

        if (!formData.branchName.trim()) {
            newErrors.branchName = 'Branch is required';
        }

        setErrors(newErrors);
        return !newErrors.username && !newErrors.password && !newErrors.branchName;
    }, [formData, modalMode]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            let response;
            if (modalMode === 'create') {
                response = await userApi.create({
                    username: formData.username,
                    password: formData.password,
                    role: formData.role,
                    branchName: formData.branchName
                });
            } else if (modalMode === 'edit' && editingUser) {
                response = await userApi.update(editingUser.id, {
                    username: formData.username,
                    password: formData.password || undefined,
                    role: formData.role,
                    branchName: formData.branchName
                });
            }

            if (response && response.success) {
                showSuccess(response.message || `User ${modalMode === 'create' ? 'created' : 'updated'} successfully`);
                setShowModal(false);
                setEditingUser(null);
                await loadUsers(currentPage, pageSize, searchTerm, sortBy, sortOrder);
            } else {
                showError(response?.message || `Error ${modalMode === 'create' ? 'creating' : 'updating'} user`);
            }
        } catch (error) {
            console.error(`Error ${modalMode === 'create' ? 'creating' : 'updating'} user:`, error);
            showError(`Error ${modalMode === 'create' ? 'creating' : 'updating'} user`);
        } finally {
            setIsSubmitting(false);
        }
    }, [modalMode, editingUser, formData, validateForm, currentPage, pageSize, searchTerm, loadUsers, branches]);

    const actions = useCallback(
        (user: User) => (
            <div className="flex items-center space-x-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(user);
                    }}
                    className="text-yellow-600 hover:text-yellow-900 p-1 cursor-pointer"
                >
                    <PencilIcon className="w-4 h-4" />
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(user);
                    }}
                    className="text-red-600 hover:text-red-900 p-1 cursor-pointer"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        ),
        []
    );

    return (
        <div className="p-6 bg-gray-50">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage all users in the system</p>
                    </div>
                    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                        <button
                            onClick={() =>
                                loadUsers(currentPage, pageSize, searchTerm, sortBy, sortOrder)
                            }
                            className="inline-flex items-center justify-center px-3 py-2 sm:px-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                        >
                            <ArrowPathIcon className="w-4 h-4 mr-1 sm:mr-2 text-gray-600" />
                            <span className="text-gray-700">Refresh</span>
                        </button>
                        <button
                            onClick={handleCreateUser}
                            className="inline-flex items-center justify-center px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors text-sm sm:text-base"
                        >
                            <UsersIcon className="w-4 h-4 mr-1 sm:mr-2" />
                            <span className="hidden xs:inline">Add New User</span>
                            <span className="xs:hidden">Add User</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <UsersIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by username..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white text-gray-900"
                    />
                </div>
            </div>
            {/* bg-white rounded-lg shadow */}
            <div className="p-0">
                <DataTable
                    data={users}
                    columns={columns}
                    loading={loading}
                    emptyMessage="No users found"
                    actions={actions}
                    moduleName="Users Management"
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

            {/* User Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={modalMode === 'create' ? 'Create New User' : 'Edit User'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <InputField
                        label="Username *"
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        error={errors.username}
                        name="username"
                    />

                    {modalMode === 'create' && (
                        <InputField
                            label="Password *"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            error={errors.password}
                            name="password"
                        />
                    )}

                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                            Role <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="role"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 [color-scheme:light]"
                        >
                            <option value={UserRole.ADMIN}>Admin</option>
                            <option value={UserRole.BRANCH}>Branch</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="branchName" className="block text-sm font-medium text-gray-700 mb-1">
                            Branch <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="branchName"
                            value={formData.branchName}
                            onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 [color-scheme:light] ${errors.branchName ? 'border-red-500' : 'border-gray-300'}`}
                        >
                            <option value="" disabled hidden>
                                Select Branch
                            </option>
                            {branches.map(branch => (
                                <option key={branch} value={branch}>{branch}</option>
                            ))}
                        </select>
                        {errors.branchName && <p className="text-red-500 text-xs mt-1">{errors.branchName}</p>}
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
                                modalMode === 'create' ? 'Create User' : 'Update User'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete User"
                message={`Are you sure you want to delete "${deletingUser?.username}"? This action cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
                variant="danger"
            />
        </div>
    )
}
