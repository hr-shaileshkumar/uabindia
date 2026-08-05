"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface BarChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  label?: string;
  horizontal?: boolean;
}

const DEFAULT_COLOR = "#6366f1";

export function BarChart({ data, xKey, yKey, color = DEFAULT_COLOR, height = 220, label, horizontal = false }: BarChartProps) {
  const Chart = RechartsBarChart;

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <Chart data={data} layout="vertical" margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.08)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <YAxis dataKey={xKey} type="category" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={80} />
          <Tooltip contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey={yKey} fill={color} radius={[0, 4, 4, 0]} name={label ?? yKey} />
        </Chart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.08)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey={yKey} radius={[4, 4, 0, 0]} name={label ?? yKey}>
          {data.map((_, i) => <Cell key={i} fill={color} fillOpacity={0.85 + (i % 3) * 0.05} />)}
        </Bar>
      </Chart>
    </ResponsiveContainer>
  );
}
