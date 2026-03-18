"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Chart, Line } from "react-chartjs-2";
import { CHART_VIEW_MODES, ChartViewMode } from "@/constants/charts/chart-view-mode.constants";
import { CHART_TYPES } from "@/constants/charts/chart-types.constants";
import { PURCHASE_TREND_OPTION_KEYS } from "@/constants/charts/purchase-trend.constants";
import { PurchaseTrendChartModel } from "@/models/charts/purchase-trend/purchase-trend-chart.model";
import { ChartOptionListModel } from "@/models/charts/common/chart-option-list.model";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
);

interface PurchaseTrendChartProps {
  chartModel: PurchaseTrendChartModel;
  chartMode: ChartViewMode;
  onChartModeChange: (mode: ChartViewMode) => void;
  onToggleDatasetOption: (optionKey: string) => void;
}

const renderDatasetOption = (
  option: ChartOptionListModel,
  onToggleDatasetOption: (optionKey: string) => void,
) => (
  <button
    key={option.key}
    onClick={() => onToggleDatasetOption(option.key)}
    className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-sm ${
      option.selected
        ? "border-transparent bg-[var(--theme-surface-muted)] text-[var(--theme-text)]"
        : "border-[var(--theme-border)] text-[var(--theme-text-muted)]"
    }`}
  >
    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: option.color }} />
    {option.label}
  </button>
);

export default function PurchaseTrendChart({
  chartModel,
  chartMode,
  onChartModeChange,
  onToggleDatasetOption,
}: PurchaseTrendChartProps) {
  const baseOptions = chartModel.getBaseOptions();
  const combinedOptions = chartModel.getCombinedOptions();
  const selectedKeys = chartModel.getSelectedOptionKeys();
  const showQuantity = selectedKeys.includes(PURCHASE_TREND_OPTION_KEYS.QUANTITY);
  const showValue = selectedKeys.includes(PURCHASE_TREND_OPTION_KEYS.VALUE);

  return (
    <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-[var(--theme-text)]">Purchase Trend</h2>
        <div className="inline-flex rounded-lg border border-[var(--theme-border)] overflow-hidden">
          <button
            onClick={() => onChartModeChange(CHART_VIEW_MODES.SPLIT)}
            className={`px-3 py-1.5 text-sm ${chartMode === CHART_VIEW_MODES.SPLIT ? "bg-blue-600 text-white" : "bg-[var(--theme-bg)] text-[var(--theme-text)]"}`}
          >
            Split View
          </button>
          <button
            onClick={() => onChartModeChange(CHART_VIEW_MODES.COMBINED)}
            className={`px-3 py-1.5 text-sm ${chartMode === CHART_VIEW_MODES.COMBINED ? "bg-blue-600 text-white" : "bg-[var(--theme-bg)] text-[var(--theme-text)]"}`}
          >
            Combined
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {chartModel.chartOptionsList.map((option) =>
          renderDatasetOption(option, onToggleDatasetOption),
        )}
      </div>

      {chartMode === CHART_VIEW_MODES.COMBINED ? (
        <div className="h-[340px]">
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${chartModel.minWidth}px` }} className="h-[340px]">
              <Chart type={CHART_TYPES.BAR} data={chartModel.getCombinedData()} options={combinedOptions} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {showQuantity && (
            <div className="overflow-x-auto">
              <div style={{ minWidth: `${chartModel.minWidth}px` }} className="h-[300px]">
                <Line data={chartModel.getQuantityLineData()} options={baseOptions} />
              </div>
            </div>
          )}
          {showValue && (
            <div className="overflow-x-auto">
              <div style={{ minWidth: `${chartModel.minWidth}px` }} className="h-[300px]">
                <Bar data={chartModel.getValueBarData()} options={baseOptions} />
              </div>
            </div>
          )}
          {!showQuantity && !showValue && (
            <div className="xl:col-span-2 h-[220px] rounded-lg border border-dashed border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-muted)]">
              Select at least one dataset to render the chart.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
