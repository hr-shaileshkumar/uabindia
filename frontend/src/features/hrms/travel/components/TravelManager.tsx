"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import {
  ErpCreateButton,
  ErpDrawerFooter,
  ErpRefreshButton,
  ErpRowActions,
  ErpSearchFilter,
} from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { SideDrawer } from "@/components/ui/side-drawer";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { mapTravelRequest, travelRequestsQueryKey, useTravelRequests } from "@/features/hrms/hooks/useTravelRequests";
import { travelApi } from "@/services/modules/travel";
import { hrmsApi, orgApi } from "@/services/modules";
import {
  type TravelRow,
  type TravelFormState,
} from "../types/travel.types";
import { useTravelPolicy } from "../hooks/useTravelPolicy";
import { TravelPolicyDrawer } from "./TravelPolicyDrawer";
import { ShieldCheck, Hotel, Utensils, Car, SlidersHorizontal, Building2, Briefcase } from "lucide-react";

const emptyForm = (): TravelFormState => ({
  employeeId: "",
  employeeName: "",
  destination: "",
  purpose: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  estimatedAmount: "",
});

export default function TravelManager() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useTravelRequests(1, 50);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewRow, setViewRow] = useState<TravelRow | null>(null);
  const [form, setForm] = useState<TravelFormState>(emptyForm());
  const [employees, setEmployees] = useState<{ id: string; fullName: string; companyId?: string; projectId?: string }[]>([]);

  // Multi-Scope filtering state
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [companiesList, setCompaniesList] = useState<{ id: string; name: string }[]>([]);
  const [projectsList, setProjectsList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    orgApi.company.getAll(1, 100)
      .then((res: any) => {
        const comps = res?.data?.items || res?.data?.companies || [];
        setCompaniesList(comps.map((c: any) => ({ id: c.id, name: c.name })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    orgApi.project.getAll(companyFilter || undefined)
      .then((res: any) => {
        const projs = res?.data?.items || res?.data?.projects || [];
        setProjectsList(projs.map((p: any) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
  }, [companyFilter]);

  const policyHook = useTravelPolicy(companyFilter || undefined, projectFilter || undefined);
  const [policyDrawerOpen, setPolicyDrawerOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => travelApi.requests.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: travelRequestsQueryKey(1, 50) });
    },
  });

  useEffect(() => {
    hrmsApi.hrms.employees.list(1, 200).then((res: any) => {
      const raw = res?.data?.employees || res?.data?.items || res?.data || [];
      const list = Array.isArray(raw) ? raw : [];
      setEmployees(
        list.map((e: any) => ({
          id: String(e.id),
          fullName: String(
            e.fullName ?? (`${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.employeeCode || e.id)
          ),
          companyId: e.companyId,
          projectId: e.projectId,
        }))
      );
    }).catch(() => {});
  }, []);

  const openCreate = async () => {
    setForm(emptyForm());
    setDrawerOpen(true);
  };

  const requests = useMemo(() => (data?.data ?? []).map(mapTravelRequest), [data?.data]);
  const filtered = useMemo(
    () =>
      requests.filter((row) => {
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          row.destination.toLowerCase().includes(q) ||
          row.employee.toLowerCase().includes(q) ||
          row.number.toLowerCase().includes(q);
        const matchesStatus = statusFilter === "all" || row.status.toLowerCase() === statusFilter.toLowerCase();
        if (!matchesSearch || !matchesStatus) return false;
        if (companyFilter || projectFilter) {
          const emp = employees.find((e) => String(e.id) === String((row as any).employeeId) || e.fullName === row.employee);
          if (companyFilter && emp?.companyId && emp.companyId !== companyFilter) return false;
          if (projectFilter && emp?.projectId && emp.projectId !== projectFilter) return false;
        }
        return true;
      }),
    [requests, search, statusFilter, companyFilter, projectFilter, employees]
  );

  const handleCreate = async () => {
    if (!form.destination.trim() || !form.purpose.trim() || !form.startDate || !form.endDate) {
      notifyError("Destination, purpose, and travel dates are required.");
      return;
    }
    try {
      const selected = employees.find((e) => e.id === form.employeeId);
      await createMutation.mutateAsync({
        employeeId: form.employeeId || undefined,
        employeeName: selected?.fullName || form.employeeName.trim() || "Self",
        destination: form.destination.trim(),
        purpose: form.purpose.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        estimatedAmount: Number(form.estimatedAmount) || 0,
        currencyCode: "INR",
        status: "Submitted",
      });
      notifySuccess("Travel request created.");
      setDrawerOpen(false);
      setForm(emptyForm());
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create travel request."));
    }
  };

  const list = useErpListView({
    listKey: "hrms-travel",
    rows: filtered,
    columns: [
      { key: "number", label: "Request" },
      { key: "employee", label: "Employee" },
      { key: "destination", label: "Destination" },
      { key: "period", label: "Period" },
      { key: "amount", label: "Estimate" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions", className: "text-right", locked: true },
    ],
    getRowId: (row) => row.id,
    loading: isLoading,
    emptyMessage: "No travel requests yet.",
    onCreate: () => void openCreate(),
    createLabel: "New request",
    onRefresh: () => void refetch(),
    extraFilters: (
      <div className="flex flex-wrap items-end gap-3">
        <ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter destination, employee, or request…" />
        <div className="min-w-44">
          <label className="erp-label">Company Scope</label>
          <select
            className="erp-input"
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value);
              setProjectFilter("");
            }}
          >
            <option value="">All Companies (Tenant Scope)</option>
            {companiesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-44">
          <label className="erp-label">Project / Site Scope</label>
          <select
            className="erp-input"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="">All Projects / Sites</option>
            {projectsList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-36">
          <label className="erp-label">Status</label>
          <select className="erp-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
    ),
    renderRow: (row) => (
      <tr key={row.id} className="erp-tr">
        <td className="erp-td">
          <div className="erp-row-title">{row.number}</div>
          <div className="text-xs text-slate-500">{row.purpose}</div>
        </td>
        <td className="erp-td text-xs">{row.employee}</td>
        <td className="erp-td text-xs">{row.destination}</td>
        <td className="erp-td text-xs text-slate-500">{row.period}</td>
        <td className="erp-td text-xs">{row.amount}</td>
        <td className="erp-td">
          <span className="erp-chip">{row.status}</span>
        </td>
        <td className="erp-td">
          <ErpRowActions onView={{ label: "View", onClick: () => setViewRow(row) }} />
        </td>
      </tr>
    ),
  });

  return (
    <StandardPageLayout
      title="Travel Management"
      subtitle="Submit, review, and track domestic and international travel requests, advances, and bookings."
      eyebrow="HRMS / Travel"
      icon="plane"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Requests", value: data?.total ?? requests.length, tone: "info" },
            { label: "Submitted", value: requests.filter((r) => r.status === "Submitted").length, tone: "warning" },
            { label: "Approved", value: requests.filter((r) => r.status === "Approved").length, tone: "positive" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void refetch()} loading={isLoading} />
          {list.headerTools}
          <button
            type="button"
            onClick={() => setPolicyDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>Travel Policies</span>
            {policyHook.activePolicy && (
              <span className="ml-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                Live
              </span>
            )}
          </button>
          <ErpCreateButton label="New request" onClick={() => void openCreate()} />
        </>
      }
      filters={list.filterBar}
    >
      {isError ? <div className="erp-alert-error">{getApiErrorMessage(error, "Failed to load travel requests.")}</div> : null}

      {/* Live Backend Travel Policy Governance Banner */}
      {policyHook.activePolicy ? (
        <div className="mb-4 rounded-xl border border-blue-100 bg-linear-to-r from-blue-50/70 via-indigo-50/40 to-slate-50/70 p-3.5 shadow-xs dark:border-slate-800 dark:from-slate-900/60 dark:via-blue-950/20 dark:to-slate-900/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs dark:bg-blue-500">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{policyHook.activePolicy.name}</span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Active Enterprise Policy
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Hotel className="h-3.5 w-3.5 text-indigo-500" />
                    Lodging: <strong>₹{policyHook.activePolicy.maxDailyLodgingAllowance.toLocaleString("en-IN")}/day</strong>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Utensils className="h-3.5 w-3.5 text-amber-500" />
                    Meals: <strong>₹{policyHook.activePolicy.maxDailyMealsAllowance.toLocaleString("en-IN")}/day</strong>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Car className="h-3.5 w-3.5 text-emerald-500" />
                    Mileage: <strong>₹{policyHook.activePolicy.mileageRatePerKmCar}/km (Car)</strong> · <strong>₹{policyHook.activePolicy.mileageRatePerKmBike}/km (Bike)</strong>
                  </span>
                  <span>
                    Advance threshold: <strong>₹{policyHook.activePolicy.approvalThresholdAmount.toLocaleString("en-IN")}</strong>
                  </span>
                  <span>
                    Claim window: <strong>{policyHook.activePolicy.expenseSubmissionWindowDays}d</strong>
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPolicyDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
              <span>Configure Policy</span>
            </button>
          </div>
        </div>
      ) : null}

      <CrudCard>{list.table}</CrudCard>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New travel request"
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => void handleCreate()}
            saving={createMutation.isPending}
            saveLabel="Submit"
          />
        }
      >
        <div className="erp-form-grid">
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Employee</label>
            <select
              className="erp-input"
              value={form.employeeId}
              onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
            >
              <option value="">Self / not linked</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Destination *</label>
            <input
              className="erp-input"
              value={form.destination}
              onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
            />
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Purpose *</label>
            <textarea
              className="erp-input min-h-20"
              value={form.purpose}
              onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Start date *</label>
            <input
              type="date"
              className="erp-input"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">End date *</label>
            <input
              type="date"
              className="erp-input"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Estimated amount (₹)</label>
            <input
              type="number"
              min={0}
              className="erp-input"
              value={form.estimatedAmount}
              onChange={(e) => setForm((f) => ({ ...f, estimatedAmount: e.target.value }))}
            />
          </div>
        </div>
      </SideDrawer>

      <SideDrawer
        open={Boolean(viewRow)}
        onClose={() => setViewRow(null)}
        title={viewRow?.number || "Travel request"}
        footer={
          <button type="button" className="erp-action-btn erp-action-btn-secondary" onClick={() => setViewRow(null)}>
            Close
          </button>
        }
      >
        {viewRow ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-medium">Employee:</span> {viewRow.employee}
            </p>
            <p>
              <span className="font-medium">Destination:</span> {viewRow.destination}
            </p>
            <p>
              <span className="font-medium">Period:</span> {viewRow.period}
            </p>
            <p>
              <span className="font-medium">Estimate:</span> {viewRow.amount}
            </p>
            <p>
              <span className="font-medium">Status:</span> {viewRow.status}
            </p>
            <p className="text-slate-500">{viewRow.purpose}</p>
          </div>
        ) : null}
      </SideDrawer>

      <TravelPolicyDrawer
        open={policyDrawerOpen}
        onOpenChange={setPolicyDrawerOpen}
        policies={policyHook.policies}
        activePolicy={policyHook.activePolicy}
        saving={policyHook.saving}
        onSave={async (input, id) =>
          id ? policyHook.updatePolicy(id, input) : policyHook.createPolicy(input)
        }
        onSetDefault={policyHook.setDefaultPolicy}
      />
    </StandardPageLayout>
  );
}
