export const CHART_TYPES = {
  LINE: "line",
  BAR: "bar",
  DOUGHNUT: "doughnut",
  PIE: "pie",
  POLAR_AREA: "polarArea",
  RADAR: "radar",
  BUBBLE: "bubble",
  SCATTER: "scatter",
} as const;

export type SupportedChartType = (typeof CHART_TYPES)[keyof typeof CHART_TYPES];
