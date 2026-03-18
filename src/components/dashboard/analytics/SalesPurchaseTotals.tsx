"use client";

interface SalesPurchaseTotalsProps {
  totalPurchaseValue: number;
  totalSalesValue: number;
}

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

export default function SalesPurchaseTotals({ totalPurchaseValue, totalSalesValue }: SalesPurchaseTotalsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg p-4">
        <p className="text-sm text-[var(--theme-text-muted)]">Total Purchase Value</p>
        <p className="text-xl md:text-2xl font-semibold mt-1">{formatINR(totalPurchaseValue)}</p>
      </div>
      <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg p-4">
        <p className="text-sm text-[var(--theme-text-muted)]">Total Sales Value</p>
        <p className="text-xl md:text-2xl font-semibold mt-1">{formatINR(totalSalesValue)}</p>
      </div>
    </div>
  );
}
