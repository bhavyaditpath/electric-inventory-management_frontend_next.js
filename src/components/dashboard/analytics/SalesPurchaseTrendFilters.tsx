"use client";

import { TrendPeriod, BranchOption } from "@/types/dashboard.types";

interface SalesPurchaseTrendFiltersProps {
  isAdmin: boolean;
  period: TrendPeriod;
  productNameInput: string;
  selectedBranchId: number | "all";
  branchOptions: BranchOption[];
  onPeriodChange: (value: TrendPeriod) => void;
  onProductNameChange: (value: string) => void;
  onBranchChange: (value: number | "all") => void;
}

export default function SalesPurchaseTrendFilters({
  isAdmin,
  period,
  productNameInput,
  selectedBranchId,
  branchOptions,
  onPeriodChange,
  onProductNameChange,
  onBranchChange,
}: SalesPurchaseTrendFiltersProps) {
  return (
    <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-[var(--theme-text-muted)]">Period</span>
          <select
            value={period}
            onChange={(event) => onPeriodChange(event.target.value as TrendPeriod)}
            className="px-3 py-2 rounded-md border border-[var(--theme-border)] bg-[var(--theme-bg)]"
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-[var(--theme-text-muted)]">Product Name</span>
          <input
            value={productNameInput}
            onChange={(event) => onProductNameChange(event.target.value)}
            placeholder="Search product..."
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
