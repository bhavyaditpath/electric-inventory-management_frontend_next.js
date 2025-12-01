"use client";

import DataTable, { TableColumn } from "@/components/DataTable";
import { userApi } from "@/Services/user.api";
import { branchApi } from "@/Services/branch.api";
import { PencilIcon, TrashIcon } from "@heroicons/react/16/solid";
import { useEffect, useState, useCallback, useMemo } from "react";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import { UserRole } from "@/types/enums";
import { showSuccess, showError } from "@/Services/toast.service";

interface User {
    id: number;
    username: string;
    password: string | null;
    role: string;
    branchId: number;
    branch: string | null;
    createdAt: number | null;
    isRemoved: boolean;
}

export default function UserPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
    const [formData, setFormData] = useState({ username: '', password: '', role: UserRole.BRANCH, branchId: 0 });
    const [errors, setErrors] = useState({ username: '', password: '', branchId: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadBranches = useCallback(async () => {
        const response = await branchApi.getAll();
        if (response.success && Array.isArray(response.data)) {
            setBranches(response.data as { id: number; name: string }[]);
        }
    }, []);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        const response = await userApi.getAll();
        console.log(response)
        let UserData: User[] = [];
        if (Array.isArray(response.data)) {
            UserData = response.data as User[];
        }
        setUsers(UserData);
        setLoading(false);
    }, []);

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
    ], [branches]);

    useEffect(() => {
        loadUsers();
        loadBranches();
    }, []);

    const handleCreateUser = useCallback(() => {
        setModalMode('create');
        setFormData({ username: '', password: '', role: UserRole.BRANCH, branchId: 0 });
        setErrors({ username: '', password: '', branchId: '' });
        setShowModal(true);
    }, [])

    const handleEdit = useCallback((user: User) => {
        setModalMode('edit');
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '',
            role: user.role as UserRole,
            branchId: user.branchId,
        });
        setErrors({ username: '', password: '', branchId: '' });
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
                console.log(response)
                showSuccess(response.message || "User deleted successfully");
                await loadUsers();
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
    }, [deletingUser, loadUsers]);

    const validateForm = useCallback(() => {
        const newErrors = { username: '', password: '', branchId: '' };

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        }

        if (modalMode === 'create' && !formData.password.trim()) {
            newErrors.password = 'Password is required';
        }

        if (formData.branchId === 0) {
            newErrors.branchId = 'Branch is required';
        }

        setErrors(newErrors);
        return !newErrors.username && !newErrors.password && !newErrors.branchId;
    }, [formData, modalMode]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const branchName = branches.find(b => b.id === formData.branchId)?.name;
        if (!branchName) {
            showError('Invalid branch selected');
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
                    branchName
                });
            } else if (modalMode === 'edit' && editingUser) {
                response = await userApi.update(editingUser.id, {
                    username: formData.username,
                    password: formData.password || undefined,
                    role: formData.role,
                    branchName
                });
            }

            if (response && response.success) {
                console.log(response)
                showSuccess(response.message || `User ${modalMode === 'create' ? 'created' : 'updated'} successfully`);
                setShowModal(false);
                setEditingUser(null);
                await loadUsers();
            } else {
                console.log('Showing error toast for response:', response);
                showError(response?.message || `Error ${modalMode === 'create' ? 'creating' : 'updating'} user`);
            }
        } catch (error) {
            console.error(`Error ${modalMode === 'create' ? 'creating' : 'updating'} user:`, error);
            showError(`Error ${modalMode === 'create' ? 'creating' : 'updating'} user`);
        } finally {
            setIsSubmitting(false);
        }
    }, [modalMode, editingUser, formData, validateForm, loadUsers, branches]);

    const actions = useCallback((user: User, index: number) => (
        <div className="flex items-center space-x-2">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(user);
                }}
                className="text-yellow-600 hover:text-yellow-900 p-1 cursor-pointer"
                title="Edit User"
            >
                <PencilIcon className="w-4 h-4" />
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(user);
                }}
                className="text-red-600 hover:text-red-900 p-1 cursor-pointer"
                title="Delete User"
            >
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
    ), [handleEdit, handleDelete]);

    return (
        <div className="p-6">
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-600 mt-2">Manage all Users in the system</p>
                    </div>
                    <button
                        onClick={handleCreateUser}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                        Add New User
                    </button>
                </div>
            </div>
            {/* bg-white rounded-lg shadow */}
            <div className="">
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
                        pageSize={10}
                        showPageSizeSelector={true}
                        pageSizeOptions={[5, 10, 25, 50]}
                    />
                </div>
            </div>

            {/* User Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={modalMode === 'create' ? 'Create New User' : 'Edit User'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1">
                        <label htmlFor="username" className="block text-sm font-semibold text-gray-800">
                            Username <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
                            placeholder="Enter username"
                        />
                        {errors.username && <p className="text-sm text-red-600 mt-1">{errors.username}</p>}
                    </div>

                    {modalMode === 'create' && (
                        <div className="space-y-1">
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-800">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
                                placeholder="Enter password"
                            />
                            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label htmlFor="role" className="block text-sm font-semibold text-gray-800">
                            Role <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="role"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900"
                        >
                            <option value={UserRole.ADMIN}>Admin</option>
                            <option value={UserRole.BRANCH}>Branch</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="branchid" className="block text-sm font-semibold text-gray-800">
                            Branch <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="branchId"
                            value={formData.branchId}
                            onChange={(e) => setFormData({ ...formData, branchId: Number(e.target.value) })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900"
                        >
                            <option value={0}>Select Branch</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>
                        {errors.branchId && <p className="text-sm text-red-600 mt-1">{errors.branchId}</p>}
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