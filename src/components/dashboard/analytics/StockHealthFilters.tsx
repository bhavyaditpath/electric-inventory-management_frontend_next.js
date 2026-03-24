"use client";

import { BranchOption } from "@/types/dashboard.types";

interface StockHealthFiltersProps {
  isAdmin: boolean;
  searchInput: string;
  selectedBranchId: number | "all";
  branchOptions: BranchOption[];
  onSearchChange: (value: string) => void;
  onBranchChange: (value: number | "all") => void;
}

export default function StockHealthFilters({
  isAdmin,
  searchInput,
  selectedBranchId,
  branchOptions,
  onSearchChange,
  onBranchChange,
}: StockHealthFiltersProps) {
  return (
    <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-[var(--theme-text-muted)]">Search Product</span>
          <input
            value={searchInput}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search stock items..."
            className="px-3 py-2 rounded-md border border-[var(--theme-border)] bg-[var(--theme-bg)]"
          />
        </label>

        {isAdmin && (
          <label className="flex flex-col gap-2">
            <span className="text-sm text-[var(--theme-text-muted)]">Branch</span>
            <select
              value={selectedBranchId}
              onChange={(event) => onBranchChange(event.target.value === "all" ? "all" : Number(event.target.value))}
              className="px-3 py-2 rounded-md border border-[var(--theme-border)] bg-[var(--theme-bg)]"
            >
              <option value="all">All Branches</option>
              {branchOptions.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}
