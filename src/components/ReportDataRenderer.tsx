import React from "react";

interface ReportDataRendererProps {
  data: any;
  title?: string;
}

const ReportDataRenderer = ({ data, title }: ReportDataRendererProps) => {
  const isIsoDate = (value: string) =>
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);

  const formatKey = (k: string) =>
    k.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-[var(--theme-text-muted)] italic">0</span>;
    }

    if (typeof value === "number") {
      return <span className="text-blue-700 font-mono">{value.toLocaleString()}</span>;
    }

    if (typeof value === "string") {
      if (isIsoDate(value)) {
        return (
          <span className="text-purple-700 font-medium">
            {new Date(value).toLocaleString()}
          </span>
        );
      }
      return <span className="text-[var(--theme-text)] break-words">{value}</span>;
    }

    if (typeof value === "object") {
      return (
        <div className="border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] rounded-lg p-4 space-y-3 shadow-sm w-full">
          {Object.entries(value).map(([k, v]) => (
            <div
              key={k}
              className="flex flex-col sm:flex-row sm:items-start gap-2 w-full"
            >
              <div className="font-medium text-[var(--theme-text)] w-full sm:w-1/3 break-words">
                {formatKey(k)}
              </div>

              <div className="sm:w-2/3 pl-2 border-l border-[var(--theme-border)] break-words">
                {renderValue(v)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return <span>{String(value)}</span>;
  };

  return (
    <div className="space-y-5 w-full">
      {title && (
        <h3 className="text-xl font-semibold text-[var(--theme-text)] border-b border-[var(--theme-border)] pb-2 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
          {title}
        </h3>
      )}

      <div className="bg-[var(--theme-surface)] rounded-xl shadow p-0 w-full overflow-hidden border border-[var(--theme-border)]">
        {renderValue(data)}
      </div>
    </div>
  );
};

export default ReportDataRenderer;

