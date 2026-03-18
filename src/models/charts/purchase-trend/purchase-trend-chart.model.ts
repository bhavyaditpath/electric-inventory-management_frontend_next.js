import dayjs from "dayjs";
import { ChartData, ChartOptions } from "chart.js";
import { ChartViewMode } from "@/constants/charts/chart-view-mode.constants";
import { getCommonChartBaseOptions } from "@/constants/charts/chart-options.constants";
import {
  PURCHASE_TREND_COLORS,
  PURCHASE_TREND_OPTION_KEYS,
} from "@/constants/charts/purchase-trend.constants";
import { CHART_TYPES } from "@/constants/charts/chart-types.constants";
import { PurchaseTrendResponse } from "@/types/dashboard.types";
import { ChartBaseModel } from "../common/chart-base.model";
import { ChartOptionListModel } from "../common/chart-option-list.model";

export type PurchaseTrendChartMode = ChartViewMode;

export class PurchaseTrendChartModel extends ChartBaseModel {
  responseData: PurchaseTrendResponse;
  labels: string[] = [];
  chartOptionsList: ChartOptionListModel[] = [];
  minWidth = 800;

  constructor(responseData?: PurchaseTrendResponse) {
    super();
    this.responseData = responseData || {
      period: "month",
      filters: {},
      labels: [],
      datasets: [],
      totals: { totalQuantity: 0, totalValue: 0 },
    };
  }

  initOptionList(selectedOptions?: string[]): this {
    this.chartOptionsList = [
      new ChartOptionListModel(
        PURCHASE_TREND_OPTION_KEYS.QUANTITY,
        "Purchased Quantity",
        this.isOptionSelected(PURCHASE_TREND_OPTION_KEYS.QUANTITY, selectedOptions),
        PURCHASE_TREND_COLORS.quantity,
      ),
      new ChartOptionListModel(
        PURCHASE_TREND_OPTION_KEYS.VALUE,
        "Purchase Value",
        this.isOptionSelected(PURCHASE_TREND_OPTION_KEYS.VALUE, selectedOptions),
        PURCHASE_TREND_COLORS.value,
      ),
    ];

    return this;
  }

  generate(responseData: PurchaseTrendResponse, selectedOptions?: string[]): this {
    this.responseData = responseData;
    this.initOptionList(selectedOptions);
    this.generateLabels();
    this.setMinWidth();
    this.markAsValid();
    return this;
  }

  toggleOption(optionKey: string): this {
    this.chartOptionsList = this.chartOptionsList.map((option) =>
      option.key === optionKey ? new ChartOptionListModel(option.key, option.label, !option.selected, option.color) : option,
    );
    this.setMinWidth();
    return this;
  }

  getSelectedOptionKeys(): string[] {
    return this.chartOptionsList.filter((option) => option.selected).map((option) => option.key);
  }

  hasData(): boolean {
    return this.responseData.labels.length > 0 && this.responseData.datasets.some((dataset) => dataset.data.length > 0);
  }

  getQuantityLineData(): ChartData<typeof CHART_TYPES.LINE> {
    const quantityDataset = this.responseData.datasets.find((dataset) => dataset.key === PURCHASE_TREND_OPTION_KEYS.QUANTITY);
    return {
      labels: this.labels,
      datasets: quantityDataset
        ? [
            {
              label: quantityDataset.label,
              data: quantityDataset.data,
              borderColor: PURCHASE_TREND_COLORS.quantity,
              backgroundColor: this.addOpacityToColor(PURCHASE_TREND_COLORS.quantity, 0.2),
              tension: 0.25,
              fill: true,
              pointRadius: 3,
              pointHoverRadius: 4,
            },
          ]
        : [],
    };
  }

  getValueBarData(): ChartData<typeof CHART_TYPES.BAR> {
    const valueDataset = this.responseData.datasets.find((dataset) => dataset.key === PURCHASE_TREND_OPTION_KEYS.VALUE);
    return {
      labels: this.labels,
      datasets: valueDataset
        ? [
            {
              label: valueDataset.label,
              data: valueDataset.data,
              backgroundColor: this.addOpacityToColor(PURCHASE_TREND_COLORS.value, 0.7),
              borderRadius: 6,
            },
          ]
        : [],
    };
  }

  getCombinedData(): ChartData<typeof CHART_TYPES.BAR | typeof CHART_TYPES.LINE> {
    const selectedKeys = this.getSelectedOptionKeys();
    const quantityDataset = this.responseData.datasets.find((dataset) => dataset.key === PURCHASE_TREND_OPTION_KEYS.QUANTITY);
    const valueDataset = this.responseData.datasets.find((dataset) => dataset.key === PURCHASE_TREND_OPTION_KEYS.VALUE);

    return {
      labels: this.labels,
      datasets: [
        ...(quantityDataset && selectedKeys.includes(PURCHASE_TREND_OPTION_KEYS.QUANTITY)
          ? [
              {
                type: CHART_TYPES.LINE,
                yAxisID: "yQuantity",
                label: quantityDataset.label ,
                data: quantityDataset.data,
                borderColor: PURCHASE_TREND_COLORS.quantity,
                backgroundColor: this.addOpacityToColor(PURCHASE_TREND_COLORS.quantity, 0.2),
                tension: 0.25,
                fill: true,
              },
            ]
          : []),
        ...(valueDataset && selectedKeys.includes(PURCHASE_TREND_OPTION_KEYS.VALUE)
          ? [
              {
                type: CHART_TYPES.BAR,
                yAxisID: "yValue",
                label: valueDataset.label,
                data: valueDataset.data,
                backgroundColor: this.addOpacityToColor(PURCHASE_TREND_COLORS.value, 0.65),
                borderRadius: 6,
              },
            ]
          : []),
      ],
    };
  }

  getBaseOptions(): ChartOptions<typeof CHART_TYPES.LINE | typeof CHART_TYPES.BAR> {
    const base = getCommonChartBaseOptions<typeof CHART_TYPES.LINE | typeof CHART_TYPES.BAR>();

    return {
      ...base,
      plugins: {
        ...base.plugins,
        tooltip: {
          ...(base.plugins?.tooltip || {}),
          mode: "index",
          intersect: false,
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 0,
            autoSkip: true,
          },
        },
      },
    };
  }

  getCombinedOptions(): ChartOptions<typeof CHART_TYPES.BAR | typeof CHART_TYPES.LINE> {
    const base = this.getBaseOptions();
    return {
      ...base,
      scales: {
        ...base.scales,
        yQuantity: {
          type: "linear",
          position: "left",
          title: { display: true, text: "Quantity" },
        },
        yValue: {
          type: "linear",
          position: "right",
          grid: { drawOnChartArea: false },
          title: { display: true, text: "Value" },
        },
      },
    };
  }

  private isOptionSelected(optionKey: string, selectedOptions?: string[]): boolean {
    if (!selectedOptions || selectedOptions.length === 0) return true;
    return selectedOptions.includes(optionKey);
  }

  private generateLabels(): void {
    this.labels = this.responseData.labels.map((label) => {
      const parsed = dayjs(label);
      return parsed.isValid() ? parsed.format("DD MMM YYYY") : label;
    });
  }

  private setMinWidth(): void {
    const selectedCount = this.chartOptionsList.filter((option) => option.selected).length;
    const dataPoints = this.responseData.labels.length;
    const minPointWidth = selectedCount > 1 ? 54 : 42;
    this.minWidth = Math.max(dataPoints * minPointWidth, 800);
  }
}
