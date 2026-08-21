"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import {
  ErpCreateButton,
  ErpDrawerFooter,
  ErpEmptyState,
  ErpRefreshButton,
  ErpRowActions,
  ErpSearchFilter,
} from "@/components/erp/erp-page-kit";
import { SideDrawer } from "@/components/ui/side-drawer";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { mapTravelRequest, travelRequestsQueryKey, useTravelRequests } from "@/features/hrms/hooks/useTravelRequests";
import { travelApi } from "@/services/modules/travel";
import { hrmsApi } from "@/services/modules";

const emptyForm = () => ({
  employeeId: "",
  employeeName: "",
  destination: "",
  purpose: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  estimatedAmount: "",
});

export default function TravelPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useTravelRequests(1, 50);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewRow, setViewRow] = useState<ReturnType<typeof mapTravelRequest> | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [employees, setEmployees] = useState<{ id: string; fullName: string }[]>([]);

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => travelApi.requests.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: travelRequestsQueryKey(1, 50) });
    },
  });

  const openCreate = async () => {
    setForm(emptyForm());
    setDrawerOpen(true);
    try {
      const res = await hrmsApi.hrms.employees.list(1, 100);
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { data?: unknown })?.data)
          ? ((raw as { data: unknown[] }).data)
          : [];
      setEmployees(
        (list as Record<string, unknown>[]).map((e) => ({
          id: String(e.id),
          fullName: String(
            e.fullName ?? (`${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.employeeCode || e.id)
          ),
        }))
      );
    } catch {
      setEmployees([]);
    }
  };

  const requests = useMemo(() => (data?.data ?? []).map(mapTravelRequest), [data?.data]);
  const filtered = requests.filter((row) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      row.destination.toLowerCase().includes(q) ||
      row.employee.toLowerCase().includes(q) ||
      row.number.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || row.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

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

  return (
    <StandardPageLayout
      title="Travel"
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
          <ErpCreateButton label="New request" onClick={() => void openCreate()} />
        </>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter destination, employee, or request…" />
          <div className="min-w-40">
            <label className="erp-label">Status</label>
            <select className="erp-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      }
    >
      {isError ? <div className="erp-alert-error">{getApiErrorMessage(error, "Failed to load travel requests.")}</div> : null}

      <CrudCard>
        <div className="erp-table-wrap">
          <table className="erp-table table-auto">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Request</th>
                <th className="erp-th">Employee</th>
                <th className="erp-th">Destination</th>
                <th className="erp-th">Period</th>
                <th className="erp-th">Estimate</th>
                <th className="erp-th">Status</th>
                <th className="erp-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="erp-td py-8 text-center text-xs text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="erp-td">
                    <ErpEmptyState
                      message="No travel requests yet."
                      action={<ErpCreateButton label="New request" onClick={() => void openCreate()} />}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </CrudCard>

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
    </StandardPageLayout>
  );
}
