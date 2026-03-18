"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import dayjs from "dayjs";
import { Bar, Line } from "react-chartjs-2";
import { getCommonChartBaseOptions } from "@/constants/charts/chart-options.constants";
import { TREND_VISUAL_MODES, TrendVisualMode } from "@/constants/charts/trend-visual-mode.constants";
import { SalesPurchaseTrendResponse } from "@/types/dashboard.types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

interface SalesPurchaseTrendChartProps {
  data: SalesPurchaseTrendResponse;
  visualMode: TrendVisualMode;
  onVisualModeChange: (mode: TrendVisualMode) => void;
}

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

export default function SalesPurchaseTrendChart({ data, visualMode, onVisualModeChange }: SalesPurchaseTrendChartProps) {
  const labels = data.labels.map((label) => {
    const parsed = dayjs(label);
    return parsed.isValid() ? parsed.format("DD MMM") : label;
  });

  const purchase = data.datasets.find((dataset) => dataset.key === "purchaseValue");
  const sales = data.datasets.find((dataset) => dataset.key === "salesValue");

  const datasetBase = [
    {
      label: purchase?.label || "Purchase Value",
      data: purchase?.data || [],
      borderColor: "#d97706",
      backgroundColor: "rgba(217,119,6,0.25)",
      fill: true,
      tension: 0.3,
    },
    {
      label: sales?.label || "Sales Value",
      data: sales?.data || [],
      borderColor: "#2563eb",
      backgroundColor: "rgba(37,99,235,0.25)",
      fill: true,
      tension: 0.3,
    },
  ];

  const lineData: ChartData<"line"> = { labels, datasets: datasetBase };
  const barData: ChartData<"bar"> = {
    labels,
    datasets: datasetBase.map((dataset) => ({
      ...dataset,
      fill: false,
      borderWidth: 0,
      borderRadius: 6,
      backgroundColor: dataset.label.includes("Purchase") ? "rgba(217,119,6,0.75)" : "rgba(37,99,235,0.75)",
    })),
  };

  const base = getCommonChartBaseOptions<"line" | "bar">();
  const options: ChartOptions<"line" | "bar"> = {
    ...base,
    plugins: {
      ...base.plugins,
      tooltip: {
        ...(base.plugins?.tooltip || {}),
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatINR(Number(context.raw || 0))}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { autoSkip: true, maxRotation: 0 },
      },
      y: {
        ticks: {
          callback: (value) => new Intl.NumberFormat("en-IN", { notation: "compact" }).format(Number(value)),
        },
      },
    },
  };

  return (
    <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 className="text-lg font-semibold">Sales vs Purchase Trend</h3>
        <div className="inline-flex rounded-lg border border-[var(--theme-border)] overflow-hidden">
          <button
            onClick={() => onVisualModeChange(TREND_VISUAL_MODES.LINE)}
            className={`px-3 py-1.5 text-sm ${visualMode === TREND_VISUAL_MODES.LINE ? "bg-blue-600 text-white" : "bg-[var(--theme-bg)]"}`}
          >
            Line
          </button>
          <button
            onClick={() => onVisualModeChange(TREND_VISUAL_MODES.BAR)}
            className={`px-3 py-1.5 text-sm ${visualMode === TREND_VISUAL_MODES.BAR ? "bg-blue-600 text-white" : "bg-[var(--theme-bg)]"}`}
          >
            Bar
          </button>
        </div>
      </div>
      <div className="h-[340px]">
        {visualMode === TREND_VISUAL_MODES.LINE ? (
          <Line data={lineData} options={options as ChartOptions<"line">} />
        ) : (
          <Bar data={barData} options={options as ChartOptions<"bar">} />
        )}
      </div>
    </div>
  );
}
