"use client";

import { useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";

interface FlagRow {
  id: string;
  featureKey: string;
  isEnabled: boolean;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await hrApi.platform.featureFlags();
        setFlags(res.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <StandardPageLayout
      title="Feature Flags"
      subtitle="Review feature availability and tenant-facing toggles."
      eyebrow="Administration / Feature Controls"
      icon="settings"
    >
      {/* KPI summary cards */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card"><p className="erp-kpi-label">Total Flags</p><p className="erp-kpi-value">{flags.length}</p><p className="erp-kpi-meta">All feature toggles</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Enabled</p><p className="erp-kpi-value erp-kpi-value-success">{flags.filter(f => f.isEnabled).length}</p><p className="erp-kpi-meta">Active features</p></div>
        <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Disabled</p><p className="erp-kpi-value">{flags.filter(f => !f.isEnabled).length}</p><p className="erp-kpi-meta">Inactive toggles</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Enable Rate</p><p className="erp-kpi-value">{flags.length > 0 ? Math.round((flags.filter(f => f.isEnabled).length / flags.length) * 100) : 0}%</p><p className="erp-kpi-meta">Features turned on</p></div>
      </div>
      <div className="erp-panel">
        <div className="erp-table-toolbar">
          <div>
            <div className="erp-table-title">Feature toggle matrix</div>
            <div className="erp-table-subtitle">Track module switches and release controls in a compact operator-friendly grid.</div>
          </div>
          <span className="erp-toolbar-badge">{loading ? "Loading..." : `${flags.length} flags`}</span>
        </div>
        <div className="erp-table-wrap rounded-none border-0 shadow-none">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Key</th>
                <th className="erp-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((f) => (
                <tr key={f.id} className="erp-tr">
                  <td className="erp-td">
                    <div className="erp-row-title">{f.featureKey}</div>
                    <div className="erp-row-meta">Tenant-facing capability flag</div>
                  </td>
                  <td className="erp-td">
                    <span className={f.isEnabled ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
                      {f.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && flags.length === 0 && (
                <tr>
                  <td colSpan={2} className="erp-td py-8 text-center text-slate-500">No feature flags found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </StandardPageLayout>
  );
}
