"use client";

import { ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import SalesPurchaseTotals from "@/components/dashboard/analytics/SalesPurchaseTotals";
import SalesPurchaseTrendChart from "@/components/dashboard/analytics/SalesPurchaseTrendChart";
import SalesPurchaseTrendFilters from "@/components/dashboard/analytics/SalesPurchaseTrendFilters";
import StockHealthDonut from "@/components/dashboard/analytics/StockHealthDonut";
import StockHealthFilters from "@/components/dashboard/analytics/StockHealthFilters";
import StockHealthSummary from "@/components/dashboard/analytics/StockHealthSummary";
import { TREND_VISUAL_MODES, TrendVisualMode } from "@/constants/charts/trend-visual-mode.constants";
import { useSalesPurchaseTrend } from "@/hooks/dashboard/useSalesPurchaseTrend";
import { useStockHealthDistribution } from "@/hooks/dashboard/useStockHealthDistribution";

export default function AnalyticsPageContent() {
  const [trendVisualMode, setTrendVisualMode] = useState<TrendVisualMode>(TREND_VISUAL_MODES.LINE);

  const salesTrend = useSalesPurchaseTrend();
  const stockHealth = useStockHealthDistribution();

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Analytics</h1>
          <p className="text-[var(--theme-text-muted)] mt-1">Sales, purchases, and stock health overview.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={salesTrend.refetch}
            className="inline-flex items-center px-3 py-2 rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)]"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" /> Trend
          </button>
          <button
            onClick={stockHealth.refetch}
            className="inline-flex items-center px-3 py-2 rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)]"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" /> Stock
          </button>
        </div>
      </div>

      <section className="space-y-4">
        <SalesPurchaseTrendFilters
          isAdmin={salesTrend.isAdmin}
          period={salesTrend.period}
          productNameInput={salesTrend.productNameInput}
          selectedBranchId={salesTrend.selectedBranchId}
          branchOptions={salesTrend.branchOptions}
          onPeriodChange={salesTrend.setPeriod}
          onProductNameChange={salesTrend.setProductNameInput}
          onBranchChange={salesTrend.setSelectedBranchId}
        />

        <SalesPurchaseTotals
          totalPurchaseValue={salesTrend.data.totals.totalPurchaseValue}
          totalSalesValue={salesTrend.data.totals.totalSalesValue}
        />

        {salesTrend.loading && <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 text-center">Loading sales trend...</div>}
        {!salesTrend.loading && salesTrend.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
            <div className="font-medium flex items-center gap-2"><ExclamationTriangleIcon className="w-5 h-5" /> {salesTrend.error}</div>
          </div>
        )}
        {!salesTrend.loading && !salesTrend.error && !salesTrend.hasData && (
          <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 text-center text-[var(--theme-text-muted)]">No sales/purchase trend data found.</div>
        )}
        {!salesTrend.loading && !salesTrend.error && salesTrend.hasData && (
          <SalesPurchaseTrendChart
            data={salesTrend.data}
            visualMode={trendVisualMode}
            onVisualModeChange={setTrendVisualMode}
          />
        )}
      </section>

      <section className="space-y-4">
        <StockHealthFilters
          isAdmin={stockHealth.isAdmin}
          searchInput={stockHealth.searchInput}
          selectedBranchId={stockHealth.selectedBranchId}
          branchOptions={stockHealth.branchOptions}
          onSearchChange={stockHealth.setSearchInput}
          onBranchChange={stockHealth.setSelectedBranchId}
        />

        <StockHealthSummary
          low={stockHealth.data.counts.low}
          warning={stockHealth.data.counts.warning}
          good={stockHealth.data.counts.good}
          totalProducts={stockHealth.data.totalProducts}
        />

        {stockHealth.loading && <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 text-center">Loading stock health...</div>}
        {!stockHealth.loading && stockHealth.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
            <div className="font-medium flex items-center gap-2"><ExclamationTriangleIcon className="w-5 h-5" /> {stockHealth.error}</div>
          </div>
        )}
        {!stockHealth.loading && !stockHealth.error && !stockHealth.hasData && (
          <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 text-center text-[var(--theme-text-muted)]">No stock health data found.</div>
        )}
        {!stockHealth.loading && !stockHealth.error && stockHealth.hasData && (
          <StockHealthDonut data={stockHealth.data} />
        )}
      </section>
    </div>
  );
}
