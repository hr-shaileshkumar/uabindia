"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Flag, ToggleLeft, ToggleRight, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { platformApi } from "@/services/modules";
import { AdministrationGlobalPageShell, type KpiMetricItem } from "@/components/administration/AdministrationGlobalPageShell";
import { ErpDrawerFooter } from "@/components/workspace/page-kit";
import { Switch } from "@/components/ui/switch";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";

type FlagRow = {
  id: string;
  featureKey: string;
  description?: string;
  isEnabled: boolean;
};

const FLAG_CATEGORIES = [
  { prefix: "ENABLE_", label: "Feature Enable", tone: "success" },
  { prefix: "DISABLE_", label: "Feature Disable", tone: "danger" },
  { prefix: "BETA_", label: "Beta Feature", tone: "warning" },
  { prefix: "ADMIN_", label: "Admin Only", tone: "info" },
];

function getFlagCategory(key: string) {
  const match = FLAG_CATEGORIES.find((c) => key.startsWith(c.prefix));
  return match ?? { prefix: "", label: "General", tone: "neutral" };
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newEnabled, setNewEnabled] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await platformApi.admin.featureFlags();
      const data = res.data as { flags?: FlagRow[] } | FlagRow[];
      setFlags(Array.isArray(data) ? data : (data?.flags ?? []));
    } catch {
      setFlags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return flags.filter((f) => {
      const matchesSearch = !q || f.featureKey.toLowerCase().includes(q) || (f.description ?? "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "enabled" && f.isEnabled) ||
        (statusFilter === "disabled" && !f.isEnabled);
      return matchesSearch && matchesStatus;
    });
  }, [flags, search, statusFilter]);

  const persist = async (key: string, enabled: boolean) => {
    await platformApi.admin.upsertFeatureFlag({ featureKey: key, isEnabled: enabled });
  };

  const handleToggle = async (flag: FlagRow) => {
    setTogglingKey(flag.featureKey);
    try {
      await persist(flag.featureKey, !flag.isEnabled);
      notifySuccess(`${flag.featureKey} ${flag.isEnabled ? "disabled" : "enabled"}.`);
      await load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to toggle flag."));
    } finally {
      setTogglingKey(null);
    }
  };

  const handleCreate = async () => {
    const key = newKey.trim().toUpperCase().replace(/\s+/g, "_");
    if (!key) { notifyError("Feature key is required."); return; }
    try {
      setSaving(true);
      await persist(key, newEnabled);
      notifySuccess(`Flag ${key} created.`);
      setDrawerOpen(false);
      setNewKey(""); setNewDescription(""); setNewEnabled(true);
      await load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create flag."));
    } finally {
      setSaving(false);
    }
  };

  const kpis: KpiMetricItem[] = [
    { label: "Total Flags", value: flags.length, tone: "info", icon: <Flag className="h-3.5 w-3.5" />, subtext: "Feature toggles" },
    { label: "Enabled", value: flags.filter((f) => f.isEnabled).length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Live features" },
    { label: "Disabled", value: flags.filter((f) => !f.isEnabled).length, tone: "warning", icon: <AlertTriangle className="h-3.5 w-3.5" />, subtext: "Turned off" },
    { label: "Beta Flags", value: flags.filter((f) => f.featureKey.startsWith("BETA_")).length, tone: "neutral", icon: <Zap className="h-3.5 w-3.5" />, subtext: "Preview features" },
  ];

  return (
    <AdministrationGlobalPageShell
      title="Feature Flags & Toggles"
      subtitle="Control feature rollout, A/B testing, and tenant-level capability switches without code deployments."
      categoryTag="Platform Configuration"
      icon="sliders"
      kpiMetrics={kpis}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search flag key or description…"
      filterOptions={[
        {
          key: "status", label: "All Flags", value: statusFilter, onChange: setStatusFilter,
          options: [{ label: "All Flags", value: "all" }, { label: "Enabled Only", value: "enabled" }, { label: "Disabled Only", value: "disabled" }],
        },
      ]}
      onClearFilters={() => { setSearch(""); setStatusFilter("all"); }}
      primaryActionLabel="New Flag"
      onPrimaryAction={() => setDrawerOpen(true)}
      onRefresh={() => void load()}
      isLoading={loading}
      listKey="platform-feature-flags"
      listRows={filtered}
      getRowId={(row) => row.id}
      emptyMessage="No feature flags found. Create a flag to control feature availability."
      listColumns={[
        { key: "featureKey", label: "Feature Key", dataType: "string" },
        { key: "category", label: "Category" },
        { key: "description", label: "Description", dataType: "string" },
        { key: "toggle", label: "Enabled" },
        { key: "actions", label: "Quick Toggle", locked: true },
      ]}
      renderListRow={(flag) => {
        const cat = getFlagCategory(flag.featureKey);
        return (
          <>
            <td className="erp-td">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Flag className="h-3.5 w-3.5" />
                </div>
                <span className="font-mono text-xs font-semibold text-slate-900">{flag.featureKey}</span>
              </div>
            </td>
            <td className="erp-td">
              <span className={`erp-chip ${
                cat.tone === "success" ? "erp-chip-success" :
                cat.tone === "danger" ? "erp-chip-danger" :
                cat.tone === "warning" ? "erp-chip-warning" :
                cat.tone === "info" ? "erp-chip-info" : "erp-chip-neutral"
              }`}>{cat.label}</span>
            </td>
            <td className="erp-td text-xs text-slate-500">{flag.description || "—"}</td>
            <td className="erp-td">
              <Switch
                checked={flag.isEnabled}
                disabled={togglingKey === flag.featureKey}
                onCheckedChange={() => void handleToggle(flag)}
              />
            </td>
            <td className="erp-td">
              <button
                type="button"
                onClick={() => void handleToggle(flag)}
                disabled={togglingKey === flag.featureKey}
                className={`inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                  flag.isEnabled
                    ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                }`}
              >
                {flag.isEnabled ? <ToggleLeft className="h-3.5 w-3.5" /> : <ToggleRight className="h-3.5 w-3.5" />}
                {flag.isEnabled ? "Disable" : "Enable"}
              </button>
            </td>
          </>
        );
      }}
      isInspectorOpen={drawerOpen}
      onInspectorClose={() => setDrawerOpen(false)}
      inspectorTitle="Create Feature Flag"
      inspectorSubTitle="Define a new feature toggle key"
      inspectorContent={
        <div className="space-y-4">
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Flag Definition</h3>
            <div className="erp-form-grid">
              <div className="erp-field md:col-span-2">
                <label className="erp-label">Feature Key *</label>
                <input
                  className="erp-input font-mono"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="ENABLE_ADVANCED_REPORTS"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Use UPPERCASE_SNAKE_CASE. Prefix: ENABLE_, DISABLE_, BETA_, ADMIN_
                </p>
              </div>
              <div className="erp-field md:col-span-2">
                <label className="erp-label">Description</label>
                <input
                  className="erp-input"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of what this flag controls"
                />
              </div>
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Initial State</h3>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
              <Switch checked={newEnabled} onCheckedChange={setNewEnabled} />
              <div>
                <p className="text-xs font-semibold text-slate-900">{newEnabled ? "Enabled on creation" : "Disabled on creation"}</p>
                <p className="text-xs text-slate-500">You can toggle this at any time after creation</p>
              </div>
            </label>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-800 mb-1">? Deployment Impact</p>
            <p className="text-xs text-amber-700">Feature flags take effect immediately for all tenant users. Test changes in staging before enabling globally.</p>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <ErpDrawerFooter
              onCancel={() => setDrawerOpen(false)}
              onSave={() => void handleCreate()}
              saving={saving}
              saveLabel="Create Flag"
            />
          </div>
        </div>
      }
    />
  );
}
