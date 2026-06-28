import type { LucideIcon } from "lucide-react";

export type ERPRole = "super_admin" | "tenant_owner" | "company_admin" | "hr" | "manager" | "employee";
export type ERPGuardScope = "platform_owner" | "business_owner" | "business" | "ess";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  roles: ERPRole[];
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export type StatItem = {
  label: string;
  value: string;
  change?: string;
  tone?: "default" | "positive" | "warning" | "critical";
};

export type ChartPoint = {
  name: string;
  value: number;
  secondary?: number;
};

export type TableRow = Record<string, string | number>;

export type FilterOption = {
  label: string;
  value: string;
};

export type FilterDefinition = {
  key: string;
  label: string;
  options: FilterOption[];
};

export type ModuleWorkspace = {
  title: string;
  eyebrow: string;
  description: string;
  primaryAction: string;
  secondaryAction: string;
  stats: StatItem[];
  filters: FilterDefinition[];
  chart: ChartPoint[];
  chartTitle: string;
  recordsTitle: string;
  recordsDescription: string;
  records: TableRow[];
  focusAreas: Array<{ title: string; description: string }>;
  timeline: Array<{ title: string; owner: string; time: string; status: "done" | "active" | "queued" }>;
  audit: Array<{ actor: string; action: string; meta: string; time: string }>;
};
