"use client";

import { useState, useCallback } from "react";

/**
 * Custom hook for managing column customization with persistence
 * @param initialColumns - The initial column definitions
 * @param storageKey - Unique key for localStorage persistence
 * @returns Object containing tableColumns state and handleColumnsChange function
 */
export function useColumnCustomization<T>(initialColumns: T[], storageKey: string) {
  // Function to serialize columns for storage
  const serializeColumns = (cols: any[]) => {
    return {
      columnOrder: cols.map(col => col.key),
      hiddenColumns: cols.filter(col => col.className?.includes('hidden')).map(col => col.key)
    };
  };

  // Function to deserialize columns from storage
  const deserializeColumns = (config: any) => {
    return config.columnOrder.map((key: string) => {
      const originalCol = initialColumns.find(col => (col as any).key === key);
      if (originalCol) {
        const colAny = originalCol as any;
        return {
          ...originalCol,
          className: config.hiddenColumns.includes(key) ? `${colAny.className || ''} hidden` : (colAny.className || '').replace('hidden', '')
        };
      }
      return originalCol;
    }).filter(Boolean);
  };

  const [tableColumns, setTableColumns] = useState(() => {
    // Try to load saved column configuration from localStorage
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem(storageKey);
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          return deserializeColumns(config);
        } catch (error) {
          console.error('Failed to parse saved column config:', error);
        }
      }
    }
    return initialColumns;
  });

  const handleColumnsChange = useCallback((updatedColumns: any[]) => {
    setTableColumns(updatedColumns);
    // Save column configuration to localStorage
    if (typeof window !== 'undefined') {
      const config = serializeColumns(updatedColumns);
      localStorage.setItem(storageKey, JSON.stringify(config));
    }
  }, [initialColumns, storageKey]);

  return {
    tableColumns,
    handleColumnsChange
  };
}