export const TREND_VISUAL_MODES = {
  LINE: "line",
  BAR: "bar",
} as const;

export type TrendVisualMode = (typeof TREND_VISUAL_MODES)[keyof typeof TREND_VISUAL_MODES];
