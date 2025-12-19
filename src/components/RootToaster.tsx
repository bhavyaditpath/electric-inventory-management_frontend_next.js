"use client";

import { Toaster } from "react-hot-toast";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";

export function RootToaster() {
  return (
    <Toaster
      position="top-right"
      containerStyle={{ zIndex: 99999 }}
      toastOptions={{
        duration: 2000,
        style: {
          background: "#ffffff",
          color: "#111827", // gray-900
          borderRadius: "12px",
          padding: "14px 16px",
          fontSize: "14px",
          fontWeight: 500,
          fontFamily: "Inter, system-ui, sans-serif",
          boxShadow:
            "0 6px 18px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        },

        success: {
          icon: <CheckCircleIcon className="w-6 h-6 text-green-600" />,
          style: {
            borderLeft: "4px solid #16a34a",
          },
        },

        error: {
          duration: 2000,
          icon: <XCircleIcon className="w-6 h-6 text-red-600" />,
          style: {
            borderLeft: "4px solid #dc2626",
          },
        },

        loading: {
          icon: <InformationCircleIcon className="w-6 h-6 text-blue-600" />,
          style: {
            borderLeft: "4px solid #2563eb",
          },
        },

        custom: {
          icon: (
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
          ),
          style: {
            borderLeft: "4px solid #f59e0b",
          },
        },
      }}
    />
  );
}
