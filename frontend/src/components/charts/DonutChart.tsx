"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DonutChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
}

const DEFAULT_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

export function DonutChart({ data, height = 220, innerRadius = 55, outerRadius = 85, showLegend = true }: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius} dataKey="value" paddingAngle={2}>
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={entry.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
        {showLegend && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />}
      </PieChart>
    </ResponsiveContainer>
  );
}
