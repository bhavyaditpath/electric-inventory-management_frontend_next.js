export const CHART_VIEW_MODES = {
  SPLIT: "split",
  COMBINED: "combined",
} as const;

export type ChartViewMode = (typeof CHART_VIEW_MODES)[keyof typeof CHART_VIEW_MODES];
