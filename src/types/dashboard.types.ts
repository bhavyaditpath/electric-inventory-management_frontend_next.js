export type TrendPeriod = "week" | "month" | "year";

export type PurchaseTrendDatasetKey = "quantity" | "value";

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
