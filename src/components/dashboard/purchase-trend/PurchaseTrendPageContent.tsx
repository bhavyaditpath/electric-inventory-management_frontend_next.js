"use client";

import { ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import PurchaseTrendChart from "@/components/dashboard/purchase-trend/PurchaseTrendChart";
import { CHART_VIEW_MODES, ChartViewMode } from "@/constants/charts/chart-view-mode.constants";
import PurchaseTrendFilters from "@/components/dashboard/purchase-trend/PurchaseTrendFilters";
import PurchaseTrendKpis from "@/components/dashboard/purchase-trend/PurchaseTrendKpis";
import { usePurchaseTrend } from "@/hooks/usePurchaseTrend";

export default function PurchaseTrendPageContent() {
  const {
    isAdmin,
    loading,
    error,
    hasData,
    period,
    setPeriod,
    productNameInput,
    setProductNameInput,
    selectedBranchId,
    setSelectedBranchId,
    branchOptions,
    trendData,
    chartModel,
    toggleDatasetOption,
    refetch,
  } = usePurchaseTrend();

  const [chartMode, setChartMode] = useState<ChartViewMode>(CHART_VIEW_MODES.SPLIT);

  return (
    <div className="p-4 md:p-6 bg-[var(--theme-bg)] text-[var(--theme-text)] min-h-screen space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Purchase Trend</h1>
          <p className="text-[var(--theme-text-muted)] mt-1">Track purchase quantity and value over time.</p>
        </div>
        <button
          onClick={refetch}
          className="inline-flex items-center px-3 py-2 rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-muted)] transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      <PurchaseTrendFilters
        isAdmin={isAdmin}
        period={period}
        productNameInput={productNameInput}
        selectedBranchId={selectedBranchId}
        branchOptions={branchOptions}
        onPeriodChange={setPeriod}
        onProductNameChange={setProductNameInput}
        onBranchChange={setSelectedBranchId}
      />

      <PurchaseTrendKpis totals={trendData.totals} />

      {loading && (
        <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg p-8 text-center text-[var(--theme-text-muted)]">
          Loading purchase trend...
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-2 text-red-700 font-medium">
            <ExclamationTriangleIcon className="w-5 h-5" />
            Failed to load chart
          </div>
          <p className="text-red-700 mt-2">{error}</p>
        </div>
      )}

      {!loading && !error && !hasData && (
        <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg p-8 text-center text-[var(--theme-text-muted)]">
          No purchase trend data found for the selected filters.
        </div>
      )}

      {!loading && !error && hasData && (
        <PurchaseTrendChart
          chartModel={chartModel}
          chartMode={chartMode}
          onChartModeChange={setChartMode}
          onToggleDatasetOption={toggleDatasetOption}
        />
      )}
    </div>
  );
}
