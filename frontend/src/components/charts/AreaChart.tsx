"use client";

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AreaChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  label?: string;
  gradient?: boolean;
}

export function AreaChart({ data, xKey, yKey, color = "#6366f1", height = 220, label, gradient = true }: AreaChartProps) {
  const gradientId = `area-gradient-${yKey}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          {gradient && (
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.18} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          )}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.08)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ fontWeight: 600 }}
        />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2}
          fill={gradient ? `url(#${gradientId})` : "none"}
          dot={false}
          name={label ?? yKey}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
