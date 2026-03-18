import { ChartOptions } from "chart.js";
import { SupportedChartType } from "./chart-types.constants";

export function getCommonChartBaseOptions<TType extends SupportedChartType>(): ChartOptions<TType> {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  return options as ChartOptions<TType>;
}
