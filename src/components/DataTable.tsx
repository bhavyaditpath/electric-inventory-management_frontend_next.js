"use client";

import { useState, useMemo } from "react";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export interface TableColumn<T> {
  key: T | string;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  striped?: boolean;
  hover?: boolean;
  bordered?: boolean;
  size?: "sm" | "md" | "lg";
  actions?: (row: T, index: number) => React.ReactNode;
  onRowClick?: (row: T, index: number) => void;
  moduleName?: string; // To identify which module is using the table
  pagination?: boolean;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  totalItems?: number; // For server-side pagination
  serverSide?: boolean; // Enable server-side pagination mode
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void; // Server-side sorting callback
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = "No data available",
  className = "",
  striped = true,
  hover = true,
  bordered = true,
  size = "md",
  actions,
  onRowClick,
  moduleName,
  pagination = false,
  pageSize: initialPageSize = 10,
  currentPage: initialCurrentPage = 1,
  onPageChange,
  onPageSizeChange,
  totalItems: totalItemsProp,
  serverSide = false,
  onSort,
  showPageSizeSelector = false,
  pageSizeOptions = [5, 10, 25, 50],
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(initialCurrentPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const sortedData = useMemo(() => {
    // Only apply client-side sorting if not using server-side sorting
    if (!sortColumn || serverSide || !onSort) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection, serverSide, onSort]);

  // Pagination logic - supports both client-side and server-side
  const totalItems = serverSide && totalItemsProp !== undefined ? totalItemsProp : sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = pagination ? (serverSide ? sortedData : sortedData.slice(startIndex, endIndex)) : sortedData;

  // Reset to first page when data changes or page size changes
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      handlePageChange(1);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    onPageChange?.(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page
    onPageSizeChange?.(newPageSize);
  };

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }

    // Call server-side sorting callback if provided
    if (onSort && serverSide) {
      const newDirection = sortColumn === columnKey ? (sortDirection === "asc" ? "desc" : "asc") : "asc";
      onSort(columnKey, newDirection);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-sm";
      case "lg":
        return "text-lg";
      default:
        return "text-base";
    }
  };

  const getCellPadding = () => {
    switch (size) {
      case "sm":
        return "px-3 py-2";
      case "lg":
        return "px-6 py-4";
      default:
        return "px-4 py-3";
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          <div className="h-4 bg-gray-200 rounded w-3/6"></div>
        </div>
      </div>
    );
  }

  // Mobile Card Component
  const MobileCard = ({ row, index }: { row: T; index: number }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          {columns.slice(0, 2).map((column, colIndex) => {
            const value = row[column.key as keyof T];
            const renderedValue = column.render
              ? column.render(value, row, index)
              : String(value || "");

            return (
              <div key={colIndex} className="mb-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {column.header}
                </div>
                <div className="text-sm text-gray-900 mt-1">
                  {renderedValue}
                </div>
              </div>
            );
          })}
        </div>
        {actions && (
          <div className="ml-4">
            {actions(row, index)}
          </div>
        )}
      </div>

      {/* Additional columns in a grid */}
      {columns.length > 2 && (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
          {columns.slice(2).map((column, colIndex) => {
            const value = row[column.key as keyof T];
            const renderedValue = column.render
              ? column.render(value, row, index)
              : String(value || "");

            return (
              <div key={colIndex + 2} className="text-xs">
                <div className="font-medium text-gray-500 uppercase tracking-wider">
                  {column.header}
                </div>
                <div className="text-sm text-gray-900 mt-1">
                  {renderedValue}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Pagination component
  const PaginationControls = () => {
    if (!pagination) return null;

    const getVisiblePages = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        {/* Page size selector and info */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {showPageSizeSelector && (
            <div className="flex items-center space-x-2">
              <label htmlFor="pageSize" className="text-sm text-gray-700">
                Show:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border border-gray-900 text-gray-900 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[80px] cursor-pointer"
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          )}

          {/* Pagination info */}
          <div className="text-sm text-gray-900 text-center sm:text-left">
            Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
          </div>
        </div>

        {/* Page navigation */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm border border-gray-900 text-gray-900 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] cursor-pointer"
          >
            Previous
          </button>

          {/* Mobile: Show fewer pages */}
          <div className="hidden sm:flex items-center space-x-1 text-gray-900">
            {getVisiblePages().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && handlePageChange(page)}
                disabled={page === '...'}
                className={`px-3 py-2 text-sm border rounded min-w-[40px] ${page === currentPage
                    ? 'bg-blue-600 text-white border-blue-600'
                    : page === '...'
                      ? 'border-gray-300 cursor-default'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {page}
              </button>
            ))}
          </div>

          {/* Mobile: Simple current page indicator */}
          <div className="sm:hidden flex items-center space-x-2">
            <span className="text-sm text-gray-900">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm border border-gray-900 text-gray-900 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className={`min-w-full divide-y divide-gray-200 ${getSizeClasses()}`}>
          {/* Table Header */}
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${getCellPadding()
                    } ${column.className || ""}`}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key as string)}
                      className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none"
                    >
                      <span>{column.header}</span>
                      {sortColumn === column.key && (
                        sortDirection === "asc" ? (
                          <ChevronUpIcon className="w-4 h-4" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4" />
                        )
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {actions && (
                <th className={`text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${getCellPadding()}`}>
                  Actions
                </th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className={`text-center text-gray-500 ${getCellPadding()} py-8`}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const actualIndex = pagination ? startIndex + rowIndex : rowIndex;
                return (
                  <tr
                    key={actualIndex}
                    className={`
                      ${striped && rowIndex % 2 === 1 ? "bg-gray-50" : ""}
                      ${hover ? "hover:bg-gray-100" : ""}
                      ${onRowClick ? "cursor-pointer" : ""}
                      ${bordered ? "border-b border-gray-200" : ""}
                    `}
                    onClick={() => onRowClick?.(row, actualIndex)}
                  >
                    {columns.map((column, colIndex) => {
                      const value = row[column.key as keyof T];
                      const renderedValue = column.render
                        ? column.render(value, row, actualIndex)
                        : String(value || "");

                      return (
                        <td
                          key={colIndex}
                          className={`${getCellPadding()} whitespace-nowrap text-gray-900 ${column.className || ""}`}
                        >
                          {renderedValue}
                        </td>
                      );
                    })}
                    {actions && (
                      <td className={`${getCellPadding()} whitespace-nowrap text-right`}>
                        {actions(row, actualIndex)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {paginatedData.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-y-auto max-h-screen scrollbar-hide">
            {paginatedData.map((row, rowIndex) => {
              const actualIndex = pagination ? startIndex + rowIndex : rowIndex;
              return (
                <MobileCard
                  key={actualIndex}
                  row={row}
                  index={actualIndex}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <PaginationControls />

      {/* Module Info (for debugging/development) */}
      {moduleName && process.env.NODE_ENV === "development" && (
        <div className="text-xs text-gray-400 mt-2 px-2">
          Table rendered by: {moduleName}
        </div>
      )}
    </div>
  );
}