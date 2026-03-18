"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { branchApi } from "@/Services/branch.api";
import { dashboardApi } from "@/Services/dashboard.api";
import { useAuth } from "@/contexts/AuthContext";
import { PURCHASE_TREND_OPTION_KEYS } from "@/constants/charts/purchase-trend.constants";
import { PurchaseTrendChartModel } from "@/models/charts/purchase-trend/purchase-trend-chart.model";
import { Branch } from "@/types/api-types";
import { UserRole } from "@/types/enums";
import {
  BranchOption,
  PurchaseTrendQueryParams,
  PurchaseTrendResponse,
  TrendPeriod,
} from "@/types/dashboard.types";

const DEFAULT_PERIOD: TrendPeriod = "month";

const EMPTY_TREND: PurchaseTrendResponse = {
  period: DEFAULT_PERIOD,
  filters: {},
  labels: [],
  datasets: [],
  totals: {
    totalQuantity: 0,
    totalValue: 0,
  },
};

function unwrapApiData<T>(response: unknown): T {
  if (
    typeof response === "object" &&
    response !== null &&
    "data" in response
  ) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export function usePurchaseTrend() {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [period, setPeriod] = useState<TrendPeriod>(DEFAULT_PERIOD);
  const [productNameInput, setProductNameInput] = useState("");
  const [debouncedProductName, setDebouncedProductName] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<number | "all">("all");

  const [trendData, setTrendData] = useState<PurchaseTrendResponse>(EMPTY_TREND);
  const [chartModel, setChartModel] = useState<PurchaseTrendChartModel>(
    () =>
      new PurchaseTrendChartModel(EMPTY_TREND).generate(EMPTY_TREND, [
        PURCHASE_TREND_OPTION_KEYS.QUANTITY,
        PURCHASE_TREND_OPTION_KEYS.VALUE,
      ]),
  );
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedProductName(productNameInput.trim());
    }, 450);

    return () => window.clearTimeout(timer);
  }, [productNameInput]);

  useEffect(() => {
    const fetchBranches = async () => {
      if (!isAdmin) {
        setBranchOptions([]);
        return;
      }

      try {
        const response = await branchApi.getAllWithoutPagination();
        const payload = unwrapApiData<Branch[]>(response);
        const items: Branch[] = Array.isArray(payload) ? payload : [];

        const mapped = items
          .filter((item) => typeof item.id === "number")
          .map((item) => ({ id: item.id, name: item.name }));

        setBranchOptions(mapped);
      } catch {
        setBranchOptions([]);
      }
    };

    fetchBranches();
  }, [isAdmin]);

  const queryParams = useMemo<PurchaseTrendQueryParams>(() => {
    const params: PurchaseTrendQueryParams = { period };

    if (debouncedProductName) {
      params.productName = debouncedProductName;
    }

    if (isAdmin && selectedBranchId !== "all") {
      params.branchId = selectedBranchId;
    }

    return params;
  }, [period, debouncedProductName, isAdmin, selectedBranchId]);

  const fetchTrend = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardApi.getPurchaseTrend(queryParams);
      const payload = unwrapApiData<PurchaseTrendResponse>(response);
      const mergedData = { ...EMPTY_TREND, ...payload };
      setTrendData(mergedData);
      setChartModel((prevModel) =>
        new PurchaseTrendChartModel(mergedData).generate(
          mergedData,
          prevModel.getSelectedOptionKeys(),
        ),
      );
    } catch (err) {
      console.error("Failed to fetch purchase trend:", err);
      setError("Failed to load purchase trend data. Please try again.");
      setTrendData(EMPTY_TREND);
      setChartModel((prevModel) =>
        new PurchaseTrendChartModel(EMPTY_TREND).generate(
          EMPTY_TREND,
          prevModel.getSelectedOptionKeys(),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  const hasData = trendData.labels.length > 0 && trendData.datasets.some((dataset) => dataset.data.length > 0);

  return {
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
    toggleDatasetOption: (optionKey: string) => {
      setChartModel((prevModel) => {
        const nextModel = new PurchaseTrendChartModel(prevModel.responseData).generate(
          prevModel.responseData,
          prevModel.getSelectedOptionKeys(),
        );
        nextModel.toggleOption(optionKey);
        return nextModel;
      });
    },
    refetch: fetchTrend,
  };
}
