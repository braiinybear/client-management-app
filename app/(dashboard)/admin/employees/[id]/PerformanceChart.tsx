"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
  Cell,
} from "recharts";


// Define matching color per status type
const STATUS_COLORS: Record<string, string> = {
  HOT: "#ef4444", // red
  PROSPECT: "#f59e0b", // amber
  FOLLOWUP: "#3b82f6", // blue
  COLD: "#6b7280", // gray
  SUCCESS: "#10b981", // green
  DEFAULT: "#a855f7", // fallback (purple)
};

type PerformanceMetric = {
  id: string;
  metricName: string;
  value: number;
};

interface Props {
  data: PerformanceMetric[];
}

export default function PerformanceChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
        barCategoryGap="20%"
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="metricName"
          tick={{ fontSize: 12 }}
          angle={-15}
          textAnchor="end"
        />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="value"
          name="Clients"
          // set dynamic fill based on metricName
          isAnimationActive={true}
        >
          <LabelList dataKey="value" position="top" />
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={STATUS_COLORS[entry.metricName.toUpperCase()] || STATUS_COLORS.DEFAULT}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
