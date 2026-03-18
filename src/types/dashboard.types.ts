export type TrendPeriod = "week" | "month" | "year";

export type PurchaseTrendDatasetKey = "quantity" | "value";
export type SalesPurchaseTrendDatasetKey = "purchaseValue" | "salesValue";
export type StockHealthDatasetKey = "stockHealth";

export interface PurchaseTrendQueryParams {
  period?: TrendPeriod;
  productName?: string;
  branchId?: number;
}

export interface PurchaseTrendDataset {
  key: PurchaseTrendDatasetKey;
  label: string;
  data: number[];
}

export interface PurchaseTrendTotals {
  totalQuantity: number;
  totalValue: number;
}

export interface PurchaseTrendResponse {
  period: TrendPeriod;
  filters: {
    branchId?: number;
    productName?: string;
  };
  labels: string[];
  datasets: PurchaseTrendDataset[];
  totals: PurchaseTrendTotals;
}

export interface BranchOption {
  id: number;
  name: string;
}

export interface SalesPurchaseTrendQueryParams {
  period?: TrendPeriod;
  productName?: string;
  branchId?: number;
}

export interface SalesPurchaseTrendDataset {
  key: SalesPurchaseTrendDatasetKey;
  label: string;
  data: number[];
}

export interface SalesPurchaseTrendResponse {
  period: TrendPeriod;
  filters: {
    branchId?: number;
    productName?: string;
  };
  labels: string[];
  datasets: SalesPurchaseTrendDataset[];
  totals: {
    totalPurchaseValue: number;
    totalSalesValue: number;
  };
}

export interface StockHealthDistributionQueryParams {
  search?: string;
  branchId?: number;
}

export interface StockHealthDistributionResponse {
  filters: {
    branchId?: number;
    search?: string;
  };
  labels: string[];
  datasets: Array<{
    key: StockHealthDatasetKey;
    label: string;
    data: number[];
  }>;
  counts: {
    low: number;
    warning: number;
    good: number;
  };
  totalProducts: number;
}
