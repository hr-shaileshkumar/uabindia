"use client";

import type { ReactNode } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { erpStatusBadgeTone } from "@/components/erp/erpStyles";

export interface HeaderStatItem {
  label: string;
  value: number | string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}

export interface UniversalPageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: string;
  stats?: HeaderStatItem[];
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  extraMeta?: ReactNode;
}

/** Thin wrapper over `StandardPageLayout`. Title + meta + actions only — no third shell. */
export function UniversalPageHeader({
  title,
  icon,
  stats = [],
  actions,
  extraMeta,
}: UniversalPageHeaderProps) {
  const toneMap = {
    neutral: erpStatusBadgeTone.neutral,
    success: erpStatusBadgeTone.success,
    warning: erpStatusBadgeTone.warning,
    danger: erpStatusBadgeTone.danger,
    info: erpStatusBadgeTone.info,
  } as const;

  const meta =
    stats.length > 0 || extraMeta ? (
      <>
        {stats.map((stat, i) => (
          <span key={`${stat.label}-${i}`} className={toneMap[stat.tone ?? "neutral"]}>
            <span className="opacity-70">{stat.label}</span>
            <span className="font-semibold">{stat.value}</span>
          </span>
        ))}
        {extraMeta}
      </>
    ) : undefined;

  return <StandardPageLayout title={title} icon={icon} meta={meta} actions={actions} />;
}
