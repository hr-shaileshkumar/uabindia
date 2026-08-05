"use client";

import { useEffect, useMemo, useState } from "react";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, RefreshCw, Shield, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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
  { id: "1", featureKey: "ENABLE_MULTI_CURRENCY", description: "Allow transactions in non-base currencies", environment: "Production", category: "Finance", isEnabled: true, updatedAt: "2026-07-20" },
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

  return (
    <StandardPageLayout
      title="Feature Flags"
      subtitle="Control real-time system capabilities, module switches, and rollout toggles across environments."
      eyebrow="Platform / Governance"
      icon="settings"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadFlags} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setIsDrawerOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Flag
          </Button>
        </div>
      }
      meta={
        <ErpHeaderSummary
          items={[
            { label: "Total Flags", value: flags.length },
            { label: "Enabled", value: flags.filter((f) => f.isEnabled).length, tone: "success" },
            { label: "Disabled", value: flags.filter((f) => !f.isEnabled).length, tone: "warning" },
            {
              label: "Rollout Rate",
              value: `${flags.length > 0 ? Math.round((flags.filter((f) => f.isEnabled).length / flags.length) * 100) : 0}%`,
              tone: "info",
            },
          ]}
        />
      }
    >
      <div className="erp-panel space-y-4">
        {/* Filters Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-lg">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter feature keys or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters:</span>
            </div>

            <Select value={envFilter} onValueChange={setEnvFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs bg-background">
                <SelectValue placeholder="Environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Environments</SelectItem>
                <SelectItem value="Production">Production</SelectItem>
                <SelectItem value="Staging">Staging</SelectItem>
                <SelectItem value="Development">Development</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] h-9 text-xs bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="erp-table-wrap rounded-none border-0 shadow-none">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Feature Key & Description</th>
                <th className="erp-th">Category</th>
                <th className="erp-th">Environment</th>
                <th className="erp-th">Updated</th>
                <th className="erp-th text-right">State</th>
              </tr>
            </thead>
            <tbody>
              {filteredFlags.map((flag) => (
                <tr key={flag.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50">
                  <td className="erp-td">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-indigo-500 shrink-0" />
                      <div>
                        <span className="font-mono font-semibold text-sm text-slate-900 dark:text-slate-100">
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
                      <span className={`text-xs font-medium ${flag.isEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
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
      </div>

      {/* New Flag Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Create Feature Flag</SheetTitle>
            <SheetDescription>Add a new system capability switch for release control.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreateFlag} className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="key">Feature Key</Label>
              <Input
                id="key"
                placeholder="ENABLE_NEW_FEATURE"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">Key will be converted to uppercase automatically.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Input
                id="desc"
                placeholder="Controls access to the new module dashboard"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger>
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
              <Label>Target Environment</Label>
              <Select value={newEnv} onValueChange={(v) => setNewEnv(v as "Production" | "Staging" | "Development")}>
                <SelectTrigger>
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
              <Button type="button" variant="outline" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Create Flag
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </StandardPageLayout>
  );
}
