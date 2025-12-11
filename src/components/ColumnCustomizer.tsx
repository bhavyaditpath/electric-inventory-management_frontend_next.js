"use client";

import { useState, useEffect } from "react";
import { TableColumn } from "./DataTable";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { XMarkIcon, Bars3Icon } from "@heroicons/react/24/outline";

interface CustomizableColumn<T> {
  key: T | string;
  header: string;
  isChecked: boolean;
  isHidden?: boolean;
}

interface ColumnCustomizerProps<T> {
  visible: boolean;
  onClose: () => void;
  columns: TableColumn<T>[];
  onApply: (updatedColumns: TableColumn<T>[]) => void;
  omitColumns?: string[];
}

export default function ColumnCustomizer<T>({
  visible,
  onClose,
  columns,
  onApply,
  omitColumns = []
}: ColumnCustomizerProps<T>) {
  const [totalColumns, setTotalColumns] = useState<CustomizableColumn<T>[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<CustomizableColumn<T>[]>([]);

  useEffect(() => {
    if (visible) {
      // Initialize columns when dialog becomes visible
      // Use the current order from columns, but get visibility from className
      const initialTotalColumns: CustomizableColumn<T>[] = columns
        .filter(col => !omitColumns.includes(col.key as string))
        .map(col => ({
          key: col.key,
          header: col.header,
          isChecked: !col.className?.includes('hidden'),
          isHidden: col.className?.includes('hidden')
        }));

      // Preserve the current order from the table by sorting selected columns
      // according to their position in the original columns array
      const initialSelectedColumns = initialTotalColumns
        .filter(col => col.isChecked)
        .sort((a, b) => {
          const aIndex = columns.findIndex(col => col.key === a.key);
          const bIndex = columns.findIndex(col => col.key === b.key);
          return aIndex - bIndex;
        });

      setTotalColumns(initialTotalColumns);
      setSelectedColumns(initialSelectedColumns);
    }
  }, [visible, columns, omitColumns]);

  const handleColumnSelectionChange = (columnKey: string, isChecked: boolean) => {
    const updatedTotalColumns = totalColumns.map(col =>
      col.key === columnKey ? { ...col, isChecked } : col
    );

    const updatedSelectedColumns = isChecked
      ? [...selectedColumns, updatedTotalColumns.find(col => col.key === columnKey)!]
      : selectedColumns.filter(col => col.key !== columnKey);

    setTotalColumns(updatedTotalColumns);
    setSelectedColumns(updatedSelectedColumns);
  };

  const removeAllColumns = () => {
    const updatedTotalColumns = totalColumns.map(col => ({
      ...col,
      isChecked: false
    }));
    setTotalColumns(updatedTotalColumns);
    setSelectedColumns([]);
  };

  const removeColumn = (columnKey: string) => {
    const updatedTotalColumns = totalColumns.map(col =>
      col.key === columnKey ? { ...col, isChecked: false } : col
    );

    const updatedSelectedColumns = selectedColumns.filter(col => col.key !== columnKey);

    setTotalColumns(updatedTotalColumns);
    setSelectedColumns(updatedSelectedColumns);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(selectedColumns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedColumns(items);
  };

  const handleApply = () => {
    if (selectedColumns.length === 0) {
      alert("At least one column should be selected.");
      return;
    }

    // Create updated columns based on selection and order
    const updatedColumns = columns.map(col => {
      const customizableCol = totalColumns.find(c => c.key === col.key);

      if (customizableCol) {
        // If column is selected, show it and maintain order
        if (customizableCol.isChecked) {
          return {
            ...col,
            className: col.className?.replace('hidden', '') || ''
          };
        } else {
          // If column is not selected, hide it
          return {
            ...col,
            className: (col.className || '') + ' hidden'
          };
        }
      }

      // If column is in omitColumns, always show it
      if (omitColumns.includes(col.key as string)) {
        return {
          ...col,
          className: col.className?.replace('hidden', '') || ''
        };
      }

      return col;
    });

    // Reorder columns based on selectedColumns order (including omitted columns)
    const omittedColumns = updatedColumns.filter(col => omitColumns.includes(col.key as string));

    // Get selected columns in their drag-and-drop order
    const selectedColumnsInOrder = selectedColumns
      .map(selectedCol => updatedColumns.find(col => col.key === selectedCol.key))
      .filter(Boolean) as TableColumn<T>[];

    const hiddenColumns = updatedColumns.filter(col =>
      !selectedColumns.map(sc => sc.key).includes(col.key) &&
      !omitColumns.includes(col.key as string)
    );

    // Build the final ordered array: omitted columns first, then selected columns in drag-and-drop order, then hidden columns
    const reorderedColumns = [
      ...omittedColumns,
      ...selectedColumnsInOrder,
      ...hiddenColumns
    ];

    onApply(reorderedColumns);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/25 backdrop-blur-sm transition-all duration-300 ease-out z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative z-50 w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-300 ease-out">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
            <h3 className="text-xl font-semibold text-gray-900 leading-6">
              Choose which columns you see
            </h3>
            <button
              onClick={onClose}
              className="group rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              aria-label="Close modal"
            >
              <XMarkIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* All columns section */}
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <div className="mb-2 text-sm font-medium text-gray-700">All columns</div>
                <div className="space-y-2">
                  {totalColumns.map((column) => (
                    <div key={String(column.key)} className="flex items-center py-1">
                      <input
                        type="checkbox"
                        id={String(column.key)}
                        checked={column.isChecked}
                        onChange={(e) => handleColumnSelectionChange(String(column.key), e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={String(column.key)} className="ml-2 text-sm text-gray-700">
                        {column.header}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected columns section */}
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={removeAllColumns}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Remove all columns
                  </button>
                </div>

                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Selected columns ({selectedColumns.length})
                    </span>
                  </div>

                  {selectedColumns.length === 0 ? (
                    <div className="text-sm text-gray-500">No columns selected.</div>
                  ) : (
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="selectedColumns">
                        {(provided: any) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-2"
                          >
                            {selectedColumns.map((column, index) => (
                              <Draggable
                                key={String(column.key)}
                                draggableId={String(column.key)}
                                index={index}
                              >
                                {(provided: any) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded group"
                                  >
                                    <div className="flex items-center flex-1">
                                      <Bars3Icon className="w-4 h-4 text-gray-400 mr-2 cursor-move" />
                                      <span className="text-sm text-gray-700">{column.header}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeColumn(String(column.key))}
                                      className="text-gray-400 hover:text-gray-600"
                                    >
                                      <XMarkIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}