"use client";

import { useState, useEffect } from "react";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpDrawerFooter } from "@/components/workspace/page-kit";
import {
  erpFormInputClassName,
  erpFormLabelClassName,
} from "@/components/workspace/styles";
import { Switch } from "@/components/ui/switch";
import { orgApi } from "@/services/modules/org";
import { POLICY_CATEGORIES, type PolicyCategory, type PolicyUiSchemaCategory } from "../types/policy-matrix.types";
import type { PolicyMasterFormValues } from "../schemas/policy-master.schema";

interface PolicyMasterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  onSave: (data: PolicyMasterFormValues) => Promise<boolean>;
  categories?: PolicyUiSchemaCategory[];
}

export function PolicyMasterDrawer({
  open,
  onOpenChange,
  saving,
  onSave,
  categories,
}: PolicyMasterDrawerProps) {
  const availableCategories = categories && categories.length > 0
    ? categories.filter((c) => c.visible !== false && c.editable !== false)
    : POLICY_CATEGORIES;

  const [companyId, setCompanyId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [companiesList, setCompaniesList] = useState<Array<{ id: string; name: string }>>([]);
  const [projectsList, setProjectsList] = useState<Array<{ id: string; name: string }>>([]);

  const [code, setCode] = useState("");
  const [category, setCategory] = useState<PolicyCategory>(availableCategories[0]?.code || "HR_CORE");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isMandatoryAcknowledgment, setIsMandatoryAcknowledgment] = useState(false);
  const [isSystemCritical, setIsSystemCritical] = useState(false);
  const [priority, setPriority] = useState(10);
  const [status, setStatus] = useState<"Active" | "Draft" | "Archived">("Active");

  useEffect(() => {
    if (!open) return;
    orgApi.company.getAll(1, 100)
      .then((res: any) => {
        const comps = res?.data?.items || res?.data?.companies || [];
        setCompaniesList(comps.map((c: any) => ({ id: c.id, name: c.name })));
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    orgApi.project.getAll(companyId || undefined)
      .then((res: any) => {
        const projs = res?.data?.items || res?.data?.projects || [];
        setProjectsList(projs.map((p: any) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
  }, [open, companyId]);

  const handleSubmit = async () => {
    const payload: PolicyMasterFormValues = {
      code: code.trim().toUpperCase(),
      category,
      name: name.trim(),
      description: description.trim(),
      companyId: companyId || undefined,
      projectId: projectId || undefined,
      isMandatoryAcknowledgment,
      isSystemCritical,
      priority: Number(priority),
      status,
    };

    const ok = await onSave(payload);
    if (ok) {
      setCode("");
      setName("");
      setDescription("");
      setCompanyId("");
      setProjectId("");
      onOpenChange(false);
    }
  };

  return (
    <SideDrawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="Create Enterprise Policy Master"
      subtitle="Define a canonical policy definition in the central registry"
      width="lg"
      footer={
        <ErpDrawerFooter
          onCancel={() => onOpenChange(false)}
          saveLabel={saving ? "Registering in DB..." : "Create Policy Master"}
          onSave={handleSubmit}
          saving={saving}
        />
      }
    >
      <div className="space-y-4">
        {/* Scope Hierarchy (Tenant -> Company -> Project) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
          <div>
            <label className={erpFormLabelClassName}>Applicable Company (Optional)</label>
            <select
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                setProjectId("");
              }}
              className={erpFormInputClassName}
            >
              <option value="">All Companies (Tenant Baseline)</option>
              {companiesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={erpFormLabelClassName}>Applicable Project / Site (Optional)</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={erpFormInputClassName}
            >
              <option value="">All Projects (Company Baseline)</option>
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={erpFormLabelClassName}>Policy Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PolicyCategory)}
              className={erpFormInputClassName}
            >
              {availableCategories.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={erpFormLabelClassName}>Unique Policy Code *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. ATT_LATE_COMING_V2"
              className={`${erpFormInputClassName} font-mono`}
            />
          </div>
        </div>

        <div>
          <label className={erpFormLabelClassName}>Policy Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hospital Emergency Duty & On-Call Policy"
            className={erpFormInputClassName}
          />
        </div>

        <div>
          <label className={erpFormLabelClassName}>Policy Description & Scope *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of applicability, business rules, and legal constraints"
            rows={3}
            className={erpFormInputClassName}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={erpFormLabelClassName}>Execution Priority</label>
            <input
              type="number"
              min={1}
              max={100}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className={erpFormInputClassName}
            />
            <p className="mt-1 text-[11px] text-slate-400">Lower number = higher resolution precedence</p>
          </div>
          <div>
            <label className={erpFormLabelClassName}>Initial Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "Active" | "Draft" | "Archived")}
              className={erpFormInputClassName}
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-900">Mandatory Employee Acknowledgment</p>
              <p className="text-[11px] text-slate-500">
                Staff must read and digitally sign on ESS portal (Legal Compliance requirement)
              </p>
            </div>
            <Switch
              checked={isMandatoryAcknowledgment}
              onCheckedChange={setIsMandatoryAcknowledgment}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            <div>
              <p className="text-xs font-semibold text-slate-900">System Critical Policy</p>
              <p className="text-[11px] text-slate-500">
                Statutory wage, taxation, or PoSH policy required by labour legislation
              </p>
            </div>
            <Switch
              checked={isSystemCritical}
              onCheckedChange={setIsSystemCritical}
            />
          </div>
        </div>
      </div>
    </SideDrawer>
  );
}
