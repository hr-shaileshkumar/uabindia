"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TenantStatus = "active" | "inactive" | "suspended" | "trial" | "archived";

interface TenantStatusBadgeProps {
  status: TenantStatus;
  className?: string;
}

export function TenantStatusBadge({ status, className }: TenantStatusBadgeProps) {
  const statusConfig: Record<TenantStatus, { label: string; class: string }> = {
    active: { label: "Active", class: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80 border-transparent shadow-none" },
    inactive: { label: "Inactive", class: "bg-slate-100 text-slate-800 hover:bg-slate-100/80 border-transparent shadow-none" },
    suspended: { label: "Suspended", class: "bg-red-100 text-red-800 hover:bg-red-100/80 border-transparent shadow-none" },
    trial: { label: "Trial", class: "bg-amber-100 text-amber-800 hover:bg-amber-100/80 border-transparent shadow-none" },
    archived: { label: "Archived", class: "bg-slate-200 text-slate-600 hover:bg-slate-200/80 border-transparent shadow-none" },
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge className={cn(config.class, className)}>
      {config.label}
    </Badge>
  );
}
