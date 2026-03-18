"use client";

interface StockHealthSummaryProps {
  low: number;
  warning: number;
  good: number;
  totalProducts: number;
}

export default function StockHealthSummary({ low, warning, good, totalProducts }: StockHealthSummaryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg p-4">
        <p className="text-sm text-[var(--theme-text-muted)]">Low</p>
        <p className="text-2xl font-semibold text-red-600">{low}</p>
      </div>
      <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg p-4">
        <p className="text-sm text-[var(--theme-text-muted)]">Warning</p>
        <p className="text-2xl font-semibold text-amber-600">{warning}</p>
      </div>
      <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg p-4">
        <p className="text-sm text-[var(--theme-text-muted)]">Good</p>
        <p className="text-2xl font-semibold text-green-600">{good}</p>
      </div>
      <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg p-4">
        <p className="text-sm text-[var(--theme-text-muted)]">Total Products</p>
        <p className="text-2xl font-semibold">{totalProducts}</p>
      </div>
    </div>
  );
}
