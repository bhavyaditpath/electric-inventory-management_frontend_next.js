"use client";

import React, { useState, ReactNode } from "react";
import Modal from "./Modal";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
  size?: "sm" | "md" | "lg" | "xl";
  isSubmitting?: boolean;
}

export default function FormModal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  size = "md",
  isSubmitting = false,
}: FormModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      onClose();
      setFormData({});
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setFormData({});
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    });
  };

  const registerField = (name: string) => {
    return {
      name,
      value: formData[name] || "",
      onChange: handleInputChange,
    };
  };

  const setFieldValue = (name: string, value: any) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size={size}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {children}
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="btn btn-outline"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <span className="loading-spinner mr-2"></span>
                {submitLabel}...
              </span>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Form Field Components
interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "number" | "email" | "password" | "select" | "textarea";
  value?: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  options?: { value: any; label: string }[];
  step?: string;
  min?: string | number;
  max?: string | number;
  rows?: number;
}

export function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  error,
  options,
  step,
  min,
  max,
  rows = 4,
}: FormFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onChange?.(e);
  };

  const renderInput = () => {
    switch (type) {
      case "textarea":
        return (
          <textarea
            id={name}
            name={name}
            value={value || ""}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
            rows={rows}
            className="form-input"
          />
        );

      case "select":
        return (
          <select
            id={name}
            name={name}
            value={value || ""}
            onChange={handleChange}
            required={required}
            className="form-input"
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            id={name}
            name={name}
            type={type}
            value={value || ""}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
            step={step}
            min={min}
            max={max}
            className="form-input"
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {renderInput()}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}