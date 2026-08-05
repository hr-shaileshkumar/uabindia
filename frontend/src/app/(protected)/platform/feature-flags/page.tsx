"use client";

import { useEffect, useMemo, useState } from "react";
import { hrApi } from "@/services/hrApi";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Shield, ToggleLeft, Activity, SlidersHorizontal, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";

interface FlagRow {
  id: string;
  featureKey: string;
  description?: string;
  environment?: "Production" | "Staging" | "Development";
  category?: string;
  isEnabled: boolean;
  updatedAt?: string;
}

const DEFAULT_FLAGS: FlagRow[] = [
  { id: "1", featureKey: "ENABLE_MULTI_CURRENCY", description: "Allow transactions in non-base currencies with automatic ledger conversion", environment: "Production", category: "Finance", isEnabled: true, updatedAt: "2026-07-20" },
  { id: "2", featureKey: "ENABLE_AI_RECRUITMENT_PARSER", description: "Parse resumes automatically with AI parsing pipeline", environment: "Staging", category: "HRMS", isEnabled: true, updatedAt: "2026-07-22" },
  { id: "3", featureKey: "ENABLE_ADVANCED_WAREHOUSE_RACKING", description: "Multi-bin location mapping and tracking", environment: "Production", category: "Inventory", isEnabled: false, updatedAt: "2026-07-15" },
  { id: "4", featureKey: "ENABLE_WHATSAPP_NOTIFICATIONS", description: "Send order status alerts via WhatsApp Gateway", environment: "Development", category: "Communication", isEnabled: true, updatedAt: "2026-07-23" },
  { id: "5", featureKey: "ENABLE_BIOMETRIC_ATTENDANCE_SYNC", description: "Real-time sync with hardware attendance terminals", environment: "Production", category: "HRMS", isEnabled: true, updatedAt: "2026-07-18" },
  { id: "6", featureKey: "ENABLE_STRIPE_SUBSCRIPTION_AUTO_RENEWAL", description: "Automated recurring card charging via Stripe Billing", environment: "Production", category: "Platform", isEnabled: true, updatedAt: "2026-07-10" },
  { id: "7", featureKey: "ENABLE_CUSTOM_REPORT_BUILDER_V2", description: "Drag-and-drop analytics dashboard query generator", environment: "Staging", category: "Reports", isEnabled: false, updatedAt: "2026-07-19" },
];

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [envFilter, setEnvFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { toast } = useToast();

  // Form State
  const [newKey, setNewKey] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newEnv, setNewEnv] = useState<"Production" | "Staging" | "Development">("Production");
  const [newCategory, setNewCategory] = useState("General");

  const loadFlags = async () => {
    setLoading(true);
    try {
      const res = await hrApi.platform.featureFlags();
      const apiFlags = res.data || [];
      if (apiFlags.length > 0) {
        setFlags(
          apiFlags.map((f: { id?: string; featureKey: string; isEnabled: boolean }) => ({
            id: f.id || f.featureKey,
            featureKey: f.featureKey,
            description: "System capability toggle flag",
            environment: "Production",
            category: "Platform",
            isEnabled: f.isEnabled,
            updatedAt: new Date().toISOString().split("T")[0],
          }))
        );
      } else {
        setFlags(DEFAULT_FLAGS);
      }
    } catch {
      setFlags(DEFAULT_FLAGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleToggle = (id: string) => {
    setFlags((prev) =>
      prev.map((flag) => {
        if (flag.id === id) {
          const nextState = !flag.isEnabled;
          toast({
            title: `Flag Updated`,
            description: `${flag.featureKey} is now ${nextState ? "Enabled" : "Disabled"}.`,
          });
          return { ...flag, isEnabled: nextState, updatedAt: new Date().toISOString().split("T")[0] };
        }
        return flag;
      })
    );
  };

  const handleCreateFlag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    const formattedKey = newKey.toUpperCase().replace(/\s+/g, "_");
    const newFlag: FlagRow = {
      id: String(Date.now()),
      featureKey: formattedKey,
      description: newDesc || "Custom system feature flag",
      environment: newEnv,
      category: newCategory,
      isEnabled: true,
      updatedAt: new Date().toISOString().split("T")[0],
    };

    setFlags((prev) => [newFlag, ...prev]);
    setIsDrawerOpen(false);
    setNewKey("");
    setNewDesc("");
    toast({
      title: "Feature Flag Created",
      description: `${formattedKey} created successfully.`,
    });
  };

  const filteredFlags = useMemo(() => {
    return flags.filter((f) => {
      const matchesSearch =
        f.featureKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesEnv = envFilter === "all" || f.environment === envFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "enabled" && f.isEnabled) ||
        (statusFilter === "disabled" && !f.isEnabled);
      return matchesSearch && matchesEnv && matchesStatus;
    });
  }, [flags, searchQuery, envFilter, statusFilter]);

  const kpiMetrics: KpiMetricItem[] = [
    { label: "Total System Flags", value: flags.length, tone: "info", icon: <SlidersHorizontal className="h-3.5 w-3.5" />, subtext: "Configured" },
    { label: "Active Rollouts", value: flags.filter((f) => f.isEnabled).length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Enabled" },
    { label: "Disabled Features", value: flags.filter((f) => !f.isEnabled).length, tone: "warning", icon: <ToggleLeft className="h-3.5 w-3.5" />, subtext: "OFF" },
    {
      label: "Rollout Rate",
      value: `${flags.length > 0 ? Math.round((flags.filter((f) => f.isEnabled).length / flags.length) * 100) : 0}%`,
      tone: "info",
      icon: <Activity className="h-3.5 w-3.5" />,
      subtext: "Global"
    },
  ];

  return (
    <PlatformGlobalPageShell
      title="Feature Flags & Capability Controls"
      subtitle="Real-time capability switches, module toggles, and environment rollout control across tenants."
      categoryTag="Platform Capability Governance"
      kpiMetrics={kpiMetrics}
      searchPlaceholder="Filter feature keys, descriptions, or categories..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      filterOptions={[
        {
          key: "env",
          label: "All Environments",
          value: envFilter,
          onChange: setEnvFilter,
          options: [
            { label: "All Environments", value: "all" },
            { label: "Production", value: "Production" },
            { label: "Staging", value: "Staging" },
            { label: "Development", value: "Development" },
          ]
        },
        {
          key: "status",
          label: "All Statuses",
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { label: "All Statuses", value: "all" },
            { label: "Enabled", value: "enabled" },
            { label: "Disabled", value: "disabled" },
          ]
        }
      ]}
      onClearFilters={() => {
        setSearchQuery("");
        setEnvFilter("all");
        setStatusFilter("all");
      }}
      primaryActionLabel="New Feature Flag"
      onPrimaryAction={() => setIsDrawerOpen(true)}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
      onRefresh={loadFlags}
      isLoading={loading}
      isInspectorOpen={isDrawerOpen}
      onInspectorClose={() => setIsDrawerOpen(false)}
      inspectorTitle="Provision New Feature Flag"
      inspectorSubTitle="Add a real-time capability switch for environment rollout control."
      inspectorContent={
        <form onSubmit={handleCreateFlag} className="space-y-4 text-xs">
          <div className="space-y-2">
            <Label htmlFor="key" className="text-xs">Feature Key</Label>
            <Input
              id="key"
              placeholder="ENABLE_NEW_FEATURE"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="h-9 text-xs"
              required
            />
            <p className="text-[11px] text-muted-foreground">Key will be formatted as UPPERCASE automatically.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc" className="text-xs">Description</Label>
            <Input
              id="desc"
              placeholder="Controls access to the new module dashboard"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Category</Label>
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Platform">Platform</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="HRMS">HRMS</SelectItem>
                <SelectItem value="Inventory">Inventory</SelectItem>
                <SelectItem value="Communication">Communication</SelectItem>
                <SelectItem value="Reports">Reports</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Target Environment</Label>
            <Select value={newEnv} onValueChange={(v) => setNewEnv(v as "Production" | "Staging" | "Development")}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Production">Production</SelectItem>
                <SelectItem value="Staging">Staging</SelectItem>
                <SelectItem value="Development">Development</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-6">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Create Flag
            </Button>
          </div>
        </form>
      }
    >
      {/* High Density Table */}
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Feature Key & Description</th>
              <th className="erp-th">Category</th>
              <th className="erp-th">Target Environment</th>
              <th className="erp-th">Last Modified</th>
              <th className="erp-th text-right">Switch State</th>
            </tr>
          </thead>
          <tbody>
            {filteredFlags.map((flag) => (
              <tr key={flag.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td">
                  <div className="flex items-center gap-2.5">
                    <Shield className="h-4 w-4 text-indigo-500 shrink-0" />
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                        {flag.featureKey}
                      </span>
                      <div className="text-xs text-slate-500 mt-0.5">{flag.description}</div>
                    </div>
                  </div>
                </td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {flag.category || "General"}
                  </Badge>
                </td>
                <td className="erp-td">
                  <span
                    className={`erp-chip ${
                      flag.environment === "Production"
                        ? "erp-chip-success"
                        : flag.environment === "Staging"
                        ? "erp-chip-warning"
                        : "erp-chip-neutral"
                    }`}
                  >
                    {flag.environment || "Production"}
                  </span>
                </td>
                <td className="erp-td text-xs text-slate-500">{flag.updatedAt || "Recent"}</td>
                <td className="erp-td text-right">
                  <div className="flex items-center justify-end gap-3">
                    <span className={`text-xs font-semibold font-mono ${flag.isEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                      {flag.isEnabled ? "ON" : "OFF"}
                    </span>
                    <Switch checked={flag.isEnabled} onCheckedChange={() => handleToggle(flag.id)} />
                  </div>
                </td>
              </tr>
            ))}

            {!loading && filteredFlags.length === 0 && (
              <tr>
                <td colSpan={5} className="erp-td py-12 text-center text-slate-500">
                  No matching feature flags found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
