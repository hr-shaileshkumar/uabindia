export type ApiListResponse<T> = {
  items?: T[];
  data?: T[];
  total?: number;
  page?: number;
  limit?: number;
};

export type DashboardStat = {
  label: string;
  value: string;
  change?: string;
  tone?: "default" | "positive" | "warning" | "critical";
};

export type DashboardTrendPoint = {
  name: string;
  value: number;
  secondary?: number;
};

export type DashboardPayload = {
  stats: DashboardStat[];
  trend: DashboardTrendPoint[];
  widgets: Array<{ title: string; description: string }>;
  source: "api" | "fallback";
};
