import React from "react";

interface ReportDataRendererProps {
  data: any;
  title?: string;
}

const ReportDataRenderer: React.FC<ReportDataRendererProps> = ({ data, title }) => {
  const isIsoDate = (value: string) =>
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);

  const formatKey = (k: string) =>
    k.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }

    if (typeof value === "boolean") {
      return (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {value ? "Yes" : "No"}
        </span>
      );
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
      return <span className="text-gray-800 break-words">{value}</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-400 italic">Empty array</span>;
      }

      if (value.every((item) => typeof item === "object" && item !== null)) {
        const headers = Array.from(new Set(value.flatMap((obj) => Object.keys(obj))));

        return (
          <div className="overflow-x-auto border rounded-lg shadow-sm w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap"
                    >
                      {formatKey(header)}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {value.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {headers.map((header) => (
                      <td
                        key={header}
                        className="px-4 py-2 text-sm text-gray-800 break-words max-w-[250px]"
                      >
                        {renderValue(row[header])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      return (
        <ul className="list-disc list-inside mt-1 space-y-1 text-gray-700">
          {value.map((item, index) => (
            <li key={index} className="break-words">
              {renderValue(item)}
            </li>
          ))}
        </ul>
      );
    }

    if (typeof value === "object") {
      return (
        <div className="border border-gray-200 bg-gray-50 rounded-lg p-4 space-y-3 shadow-sm w-full">
          {Object.entries(value).map(([k, v]) => (
            <div
              key={k}
              className="flex flex-col sm:flex-row sm:items-start gap-2 w-full"
            >
              <div className="font-medium text-gray-700 w-full sm:w-1/3 break-words">
                {formatKey(k)}
              </div>

              <div className="sm:w-2/3 pl-2 border-l border-gray-300 break-words">
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
        <h3 className="text-xl font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
          {title}
        </h3>
      )}

      <div className="bg-white rounded-xl shadow p-0 w-full overflow-hidden">
        {renderValue(data)}
      </div>
    </div>
  );
};

export default ReportDataRenderer;
