"use client";

import { ArcElement, Chart as ChartJS, ChartData, ChartOptions, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { getCommonChartBaseOptions } from "@/constants/charts/chart-options.constants";
import { StockHealthDistributionResponse } from "@/types/dashboard.types";

ChartJS.register(ArcElement, Tooltip, Legend);

interface StockHealthDonutProps {
  data: StockHealthDistributionResponse;
}

export default function StockHealthDonut({ data }: StockHealthDonutProps) {
  const values = data.datasets[0]?.data || [0, 0, 0];

  const chartData: ChartData<"doughnut"> = {
    labels: data.labels.length ? data.labels : ["Low", "Warning", "Good"],
    datasets: [
      {
        label: data.datasets[0]?.label || "Stock Health Distribution",
        data: values,
        backgroundColor: ["#dc2626", "#d97706", "#16a34a"],
        borderColor: ["#ffffff", "#ffffff", "#ffffff"],
        borderWidth: 2,
      },
    ],
  };

  const base = getCommonChartBaseOptions<"doughnut">();
  const options: ChartOptions<"doughnut"> = {
    ...base,
    cutout: "65%",
    plugins: {
      ...base.plugins,
      tooltip: {
        ...(base.plugins?.tooltip || {}),
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}`,
        },
      },
    },
  };

  return (
    <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3">Stock Health Distribution</h3>
      <div className="h-[320px]">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}
