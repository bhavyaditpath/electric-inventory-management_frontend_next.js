"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dashboardApi } from "@/Services/dashboard.api";
import { StockHealthDistributionQueryParams, StockHealthDistributionResponse } from "@/types/dashboard.types";
import { useBranchOptions } from "./useBranchOptions";

const EMPTY_DISTRIBUTION: StockHealthDistributionResponse = {
  filters: {},
  labels: [],
  datasets: [],
  counts: { low: 0, warning: 0, good: 0 },
  totalProducts: 0,
};

function unwrapApiData<T>(response: unknown): T {
  if (typeof response === "object" && response !== null && "data" in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export function useStockHealthDistribution() {
  const { isAdmin, branchOptions } = useBranchOptions();
  const requestIdRef = useRef(0);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<number | "all">("all");

  const [data, setData] = useState<StockHealthDistributionResponse>(EMPTY_DISTRIBUTION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 450);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const queryParams = useMemo<StockHealthDistributionQueryParams>(() => {
    const params: StockHealthDistributionQueryParams = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (isAdmin && selectedBranchId !== "all") params.branchId = selectedBranchId;
    return params;
  }, [debouncedSearch, isAdmin, selectedBranchId]);

  const fetchDistribution = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const response = await dashboardApi.getStockHealthDistribution(queryParams);
      if (currentRequestId !== requestIdRef.current) return;
      const payload = unwrapApiData<StockHealthDistributionResponse>(response);
      setData({ ...EMPTY_DISTRIBUTION, ...payload });
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return;
      console.error("Failed to fetch stock health:", err);
      setError("Failed to load stock health distribution.");
      setData(EMPTY_DISTRIBUTION);
    } finally {
      if (currentRequestId === requestIdRef.current) setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchDistribution();
  }, [fetchDistribution]);

  const hasData = data.datasets.some((dataset) => dataset.data.some((value) => value > 0));

  return {
    isAdmin,
    branchOptions,
    searchInput,
    setSearchInput,
    selectedBranchId,
    setSelectedBranchId,
    data,
    loading,
    error,
    hasData,
    refetch: fetchDistribution,
  };
}
