"use client";

import React from "react";

type CSVButtonProps = {
  data: { metricName: string; value: number }[];
  filename: string;
  label?: string;
};

export default function CSVDownloadButton({ data, filename, label = "Download CSV" }: CSVButtonProps) {
  const downloadCSV = () => {
    const headers = ["Metric", "Count"];
    const rows = data.map((d) => [d.metricName, d.value]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={downloadCSV}
      className="btn btn-outline text-sm"
    >
      {label}
    </button>
  );
}
