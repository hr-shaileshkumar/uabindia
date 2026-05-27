"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useUiSchema } from "@/context/UiSchemaContext";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { ROUTES } from "@/constants/routes";

export default function HrmsRootPage() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { loading: authLoading } = useAuth();
  const { navigation } = useUiSchema();

  useEffect(() => {
    const fetchDashboard = async () => {
      if (authLoading) return;
      try {
        setLoading(true);
        const res = await hrApi.dashboard.getStats();
        setStats(res.data || {});
      } catch (err) {
        notifyError(getApiErrorMessage(err, 'Failed to load HR dashboard.'), 'HRMS Dashboard');
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [authLoading]);

  const fallbackQuickLinks = [
    { href: ROUTES.EMPLOYEES, title: "Employee Master", description: "Profile records, lifecycle, and structure.", icon: "👥", meta: "People ops" },
    { href: ROUTES.ATTENDANCE, title: "Attendance", description: "Daily punches, presence, and workday tracking.", icon: "🕒", meta: "Time office" },
    { href: ROUTES.LEAVE, title: "Leave Management", description: "Policies, balances, requests, and approvals.", icon: "🏖️", meta: "Policy control" },
    { href: ROUTES.RECRUITMENT, title: "Recruitment", description: "Hiring pipeline, screening, and interview progress.", icon: "🎯", meta: "Talent acquisition" },
  ];

  const schemaQuickLinks = navigation.modules
    .find((module) => module.key === "hrms")
    ?.groups
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((group) =>
      group.items
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => ({
          href: item.path,
          title: item.name,
          description: `Navigate to ${item.name} workspace.`,
          icon: "👥",
          meta: group.label,
        }))
    )
    .slice(0, 4);

  const quickLinks = schemaQuickLinks && schemaQuickLinks.length > 0 ? schemaQuickLinks : fallbackQuickLinks;

  const primaryActionHref = quickLinks[0]?.href || ROUTES.EMPLOYEES;
  const secondaryActionHref = quickLinks[1]?.href || ROUTES.RECRUITMENT;

  if (loading) {
    return (
      <StandardPageLayout title="HRMS Command Center" subtitle="People operations, attendance, talent, and workforce planning.">
        <div className="erp-panel erp-loading">Loading HRMS dashboard...</div>
      </StandardPageLayout>
    );
  }

  if (error) {
    return (
      <StandardPageLayout title="HRMS Command Center" subtitle="People operations, attendance, talent, and workforce planning.">
        <div className="erp-alert-error">Failed to load HRMS dashboard.</div>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title="HRMS Command Center"
      subtitle="People operations, attendance, talent, and workforce planning in one enterprise workspace."
      actions={
        <>
          <Link href={primaryActionHref} className="erp-action-btn erp-action-btn-secondary">Employees</Link>
          <Link href={secondaryActionHref} className="erp-action-btn erp-action-btn-primary">Open Recruitment</Link>
        </>
      }
    >
      <div className="space-y-6">
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Employees</p><p className="erp-kpi-value">{stats.totalEmployees ?? 0}</p><p className="erp-kpi-meta">Current workforce strength</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Active Employees</p><p className="erp-kpi-value">{stats.activeEmployees ?? 0}</p><p className="erp-kpi-meta">Available for deployment</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">On Leave Today</p><p className={`erp-kpi-value ${stats.onLeaveToday > 0 ? "erp-kpi-value-danger" : ""}`}>{stats.onLeaveToday ?? 0}</p><p className="erp-kpi-meta">Planned workforce absence</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">New Joiners (MTD)</p><p className="erp-kpi-value erp-kpi-value-success">{stats.newJoinersMTD ?? 0}</p><p className="erp-kpi-meta">Growth in the current month</p></div>
        </div>

        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Exits (MTD)</p><p className={`erp-kpi-value ${stats.exitsMTD > 0 ? "erp-kpi-value-danger" : ""}`}>{stats.exitsMTD ?? 0}</p><p className="erp-kpi-meta">Attrition snapshot</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Open Positions</p><p className="erp-kpi-value">{stats.openPositions ?? 0}</p><p className="erp-kpi-meta">Hiring demand pipeline</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Present Today</p><p className="erp-kpi-value erp-kpi-value-success">{stats.presentToday ?? 0}</p><p className="erp-kpi-meta">Attendance in good standing</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Attendance % (MTD)</p><p className="erp-kpi-value">{stats.attendancePctMTD ?? 0}%</p><p className="erp-kpi-meta">Month-to-date punctuality</p></div>
        </div>

        <div className="erp-tile-grid">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="erp-tile">
              <span className="erp-tile-icon" aria-hidden>{link.icon}</span>
              <div className="erp-tile-title">{link.title}</div>
              <p className="erp-tile-desc">{link.description}</p>
              <div className="erp-tile-meta">{link.meta}</div>
            </Link>
          ))}
        </div>
      </div>
    </StandardPageLayout>
  );
}
