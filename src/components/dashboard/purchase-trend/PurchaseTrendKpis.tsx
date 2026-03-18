"use client";

import { PurchaseTrendTotals } from "@/types/dashboard.types";

interface PurchaseTrendKpisProps {
  totals: PurchaseTrendTotals;
}

const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value || 0);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);

export default function PurchaseTrendKpis({ totals }: PurchaseTrendKpisProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg p-4">
        <p className="text-sm text-[var(--theme-text-muted)]">Total Quantity</p>
        <p className="text-2xl font-semibold text-[var(--theme-text)] mt-1">{formatNumber(totals.totalQuantity)}</p>
      </div>
      <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg p-4">
        <p className="text-sm text-[var(--theme-text-muted)]">Total Purchase Value</p>
        <p className="text-2xl font-semibold text-[var(--theme-text)] mt-1">{formatCurrency(totals.totalValue)}</p>
      </div>
    </div>
  );
}
