"use client";

import Modal from "./Modal";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmModal({  
  isOpen,
  onClose,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  isDeleting = false,
  variant = "danger",
}: ConfirmModalProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Delete operation failed:", error);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: "text-red-600",
          button: "bg-red-600 hover:bg-red-700 focus:ring-red-500 cursor-pointer",
        };
      case "warning":
        return {
          icon: "text-yellow-600",
          button: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 cursor-pointer",
        };
      case "info":
        return {
          icon: "text-blue-600",
          button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 cursor-pointer",
        };
      default:
        return {
          icon: "text-red-600",
          button: "bg-red-600 hover:bg-red-700 focus:ring-red-500 cursor-pointer",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className={`p-2 rounded-full ${variant === 'danger' ? 'bg-red-100' : variant === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
            <ExclamationTriangleIcon className={`h-6 w-6 ${styles.icon}`} />
          </div>
        </div>
        <div className="flex-1 pt-0.5">
          <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="btn btn-outline"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isDeleting}
          className={`btn ${variant === 'danger' ? 'btn-danger' : variant === 'warning' ? 'btn-warning' : 'btn-primary'}`}
        >
          {isDeleting ? (
            <span className="flex items-center">
              <span className="loading-spinner mr-2"></span>
              Deleting...
            </span>
          ) : (
            confirmLabel
          )}
        </button>
      </div>
    </Modal>
  );
}