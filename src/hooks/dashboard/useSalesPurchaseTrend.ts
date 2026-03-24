"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dashboardApi } from "@/Services/dashboard.api";
import { SalesPurchaseTrendQueryParams, SalesPurchaseTrendResponse, TrendPeriod } from "@/types/dashboard.types";
import { useBranchOptions } from "./useBranchOptions";

const DEFAULT_PERIOD: TrendPeriod = "month";

const EMPTY_TREND: SalesPurchaseTrendResponse = {
  period: DEFAULT_PERIOD,
  filters: {},
  labels: [],
  datasets: [],
  totals: {
    totalPurchaseValue: 0,
    totalSalesValue: 0,
  },
};

function unwrapApiData<T>(response: unknown): T {
  if (typeof response === "object" && response !== null && "data" in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export function useSalesPurchaseTrend() {
  const { isAdmin, branchOptions } = useBranchOptions();
  const requestIdRef = useRef(0);

  const [period, setPeriod] = useState<TrendPeriod>(DEFAULT_PERIOD);
  const [productNameInput, setProductNameInput] = useState("");
  const [debouncedProductName, setDebouncedProductName] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<number | "all">("all");

  const [data, setData] = useState<SalesPurchaseTrendResponse>(EMPTY_TREND);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedProductName(productNameInput.trim()), 450);
    return () => window.clearTimeout(timer);
  }, [productNameInput]);

  const queryParams = useMemo<SalesPurchaseTrendQueryParams>(() => {
    const params: SalesPurchaseTrendQueryParams = { period };
    if (debouncedProductName) params.productName = debouncedProductName;
    if (isAdmin && selectedBranchId !== "all") params.branchId = selectedBranchId;
    return params;
  }, [period, debouncedProductName, isAdmin, selectedBranchId]);

  const fetchTrend = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const response = await dashboardApi.getSalesVsPurchaseTrend(queryParams);
      if (currentRequestId !== requestIdRef.current) return;
      const payload = unwrapApiData<SalesPurchaseTrendResponse>(response);
      setData({ ...EMPTY_TREND, ...payload });
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return;
      console.error("Failed to fetch sales vs purchase trend:", err);
      setError("Failed to load trend data.");
      setData(EMPTY_TREND);
    } finally {
      if (currentRequestId === requestIdRef.current) setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  const hasData = data.labels.length > 0 && data.datasets.some((dataset) => dataset.data.length > 0);

  return {
    isAdmin,
    branchOptions,
    period,
    setPeriod,
    productNameInput,
    setProductNameInput,
    selectedBranchId,
    setSelectedBranchId,
    data,
    loading,
    error,
    hasData,
    refetch: fetchTrend,
  };
}
