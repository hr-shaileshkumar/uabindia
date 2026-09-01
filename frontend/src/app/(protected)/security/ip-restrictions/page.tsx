"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ListCreateButton, ListSearchInput, ListStatusFilter } from "@/components/workspace/list-toolbar";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpFormLabelClassName,
} from "@/components/workspace/styles";
import { appApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type IpRule = {
  id: string;
  ipRange?: string;
  description?: string;
  action?: "ALLOW" | "BLOCK" | string;
  status?: string;
  createdAt?: string;
};

const emptyForm = () => ({ ipRange: "", description: "", action: "ALLOW" as "ALLOW" | "BLOCK" });

const asList = (raw: unknown): IpRule[] => {
  if (Array.isArray(raw)) return raw as IpRule[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as IpRule[];
  }
  return [];
};

export default function IpRestrictionsPage() {
  const [records, setRecords] = useState<IpRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await appApi.security.ipRules();
      setRecords(asList(res.data));
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load IP rules"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const matchesSearch =
        !q ||
        [r.ipRange, r.description, r.action].some((v) => (v || "").toLowerCase().includes(q));
      const matchesAction = actionFilter === "all" || (r.action || "").toUpperCase() === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [records, search, actionFilter]);

  const handleSave = async () => {
    if (!form.ipRange.trim()) {
      notifyError("IP address or CIDR range is required.");
      return;
    }
    try {
      setSaving(true);
      await appApi.security.createIpRule({
        ipRange: form.ipRange.trim(),
        description: form.description.trim() || undefined,
        action: form.action,
      });
      notifySuccess("IP rule created.");
      setDrawerOpen(false);
      setForm(emptyForm());
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create IP rule."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await appApi.security.deleteIpRule(id);
      notifySuccess("IP rule deleted.");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete IP rule."));
    }
  };

  return (
    <>
      <ModuleTablePage
        title="IP Whitelisting & Access Control"
        subtitle="Restrict system access to corporate IP subnets, CIDR ranges, and block untrusted networks."
        eyebrow="Security / Policies"
        icon="shield"
        toolbarTitle="Access rules"
        toolbarSubtitle="Allow or block IPv4 addresses and CIDR ranges for this tenant."
        loading={loading}
        error={error}
        onRetry={load}
        rows={filtered}
        countLabel={(count) => `${count} rules`}
        emptyMessage="No IP access rules configured."
        emptyAction={<ListCreateButton label="Add IP rule" onClick={() => setDrawerOpen(true)} />}
        actions={<ListCreateButton label="Add IP rule" onClick={() => setDrawerOpen(true)} />}
        filters={
          <>
            <ListSearchInput value={search} onChange={setSearch} placeholder="Search IP range or description…" />
            <ListStatusFilter
              value={actionFilter}
              onChange={setActionFilter}
              options={[
                { label: "All actions", value: "all" },
                { label: "Allow", value: "ALLOW" },
                { label: "Block", value: "BLOCK" },
              ]}
            />
          </>
        }
        headerStats={
          <CrudHeaderStats
            items={[
              { label: "Rules", value: records.length, helper: "entries" },
              { label: "Allow", value: records.filter((r) => r.action === "ALLOW").length, tone: "positive" },
              { label: "Block", value: records.filter((r) => r.action === "BLOCK").length, tone: "danger" },
            ]}
          />
        }
        columns={[
          { label: "IP / CIDR" },
          { label: "Action" },
          { label: "Description" },
          { label: "Added" },
          { label: "Actions", className: "text-right" },
        ]}
        renderRow={(rule) => (
          <tr key={rule.id} className="erp-tr">
            <td className="erp-td font-mono text-sm font-semibold text-slate-900">{rule.ipRange}</td>
            <td className="erp-td">
              <span className={rule.action === "ALLOW" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-danger"}>
                {rule.action}
              </span>
            </td>
            <td className="erp-td text-sm text-slate-600">{rule.description || "—"}</td>
            <td className="erp-td text-xs text-slate-500">
              {rule.createdAt ? new Date(rule.createdAt).toLocaleDateString("en-IN") : "—"}
            </td>
            <td className="erp-td text-right">
              <button
                type="button"
                className={`${erpButtonClassName.ghost} h-8 px-2 text-rose-600`}
                onClick={() => void handleDelete(rule.id)}
              >
                Delete
              </button>
            </td>
          </tr>
        )}
      />
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Create IP access rule"
        subtitle="Define IP address CIDR range and policy action"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className={erpButtonClassName.secondary} onClick={() => setDrawerOpen(false)}>
              Cancel
            </button>
            <button type="button" className={erpButtonClassName.primary} disabled={saving} onClick={() => void handleSave()}>
              {saving ? "Saving…" : "Save rule"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="ip" className={erpFormLabelClassName}>
              IP address or CIDR range *
            </label>
            <input
              id="ip"
              placeholder="e.g. 192.168.1.0/24"
              value={form.ipRange}
              onChange={(e) => setForm({ ...form, ipRange: e.target.value })}
              className={`${erpFormInputClassName} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="desc" className={erpFormLabelClassName}>
              Rule description
            </label>
            <input
              id="desc"
              placeholder="e.g. Corporate HQ gateway"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${erpFormInputClassName} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="action" className={erpFormLabelClassName}>
              Action
            </label>
            <select
              id="action"
              className={`${erpFormInputClassName} mt-1`}
              value={form.action}
              onChange={(e) => setForm({ ...form, action: e.target.value as "ALLOW" | "BLOCK" })}
            >
              <option value="ALLOW">ALLOW</option>
              <option value="BLOCK">BLOCK</option>
            </select>
          </div>
        </div>
      </SideDrawer>
    </>
  );
}
