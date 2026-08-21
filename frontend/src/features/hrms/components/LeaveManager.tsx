"use client";

import { useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import {
  erpButtonClassName,
  erpPanelClassName,
  erpSectionClassName,
  erpStatusBadgeTone,
  erpTableThClassName,
  erpTableTdClassName,
  erpTableWrapClassName,
} from "@/components/erp/erpStyles";
import { hrmsApi } from "@/services/modules";

type TabKey = "policies" | "balances" | "requests" | "approvals" | "holidays" | "allocations" | "types";

const leaveApi = hrmsApi.hrms.leave;

export default function LeaveManager() {
  const [activeTab, setActiveTab] = useState<TabKey>("requests");
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingApprovals = useMemo(
    () => approvals.filter((record) => (record.status || "").toLowerCase() === "pending"),
    [approvals]
  );
  const approvedRequests = useMemo(
    () => requests.filter((record) => (record.status || "").toLowerCase() === "approved").length,
    [requests]
  );
  const leaveBalanceTotal = useMemo(
    () => balances.reduce((sum, record) => sum + Number(record.balance || record.remaining || 0), 0),
    [balances]
  );
  const currentYear = new Date().getFullYear();

  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await leaveApi.list(1, 50);
      setRequests(res.data?.requests ?? res.data ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load leave requests");
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchApprovals = async () => {
    try {
      setLoadingApprovals(true);
      const res = await leaveApi.approvals.list("Pending");
      setApprovals(res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load leave approvals");
    } finally {
      setLoadingApprovals(false);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoadingTypes(true);
        setLoadingPolicies(true);
        setLoadingRequests(true);
        setLoadingApprovals(true);
        setLoadingBalances(true);
        setLoadingHolidays(true);
        setLoadingAllocations(true);

        const [
          typesRes,
          policiesRes,
          requestsRes,
          approvalsRes,
          balancesRes,
          holidaysRes,
          allocationsRes,
        ] = await Promise.all([
          leaveApi.types.list(),
          leaveApi.policies.list(),
          leaveApi.list(1, 50),
          leaveApi.approvals.list("Pending"),
          leaveApi.balances.list(),
          leaveApi.holidays.list(currentYear),
          leaveApi.allocations.list({ year: currentYear }),
        ]);

        setLeaveTypes(typesRes.data || []);
        setPolicies(policiesRes.data || []);
        setRequests(requestsRes.data?.requests ?? requestsRes.data ?? []);
        setApprovals(approvalsRes.data || []);
        setBalances(balancesRes.data || []);
        setHolidays(holidaysRes.data || []);
        setAllocations(allocationsRes.data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load leave data");
      } finally {
        setLoadingTypes(false);
        setLoadingPolicies(false);
        setLoadingRequests(false);
        setLoadingApprovals(false);
        setLoadingBalances(false);
        setLoadingHolidays(false);
        setLoadingAllocations(false);
      }
    };

    void loadAll();
  }, [currentYear]);

  useEffect(() => {
    setError(null);
  }, [activeTab]);

  const handleApproveRequest = async (id: string) => {
    setError(null);
    try {
      await leaveApi.approveLeave(id);
      await fetchApprovals();
      await fetchRequests();
    } catch (err: any) {
      setError(err.message || "Failed to approve leave request");
    }
  };

  const handleRejectRequest = async (id: string) => {
    setError(null);
    try {
      await leaveApi.rejectLeave(id);
      await fetchApprovals();
      await fetchRequests();
    } catch (err: any) {
      setError(err.message || "Failed to reject leave request");
    }
  };

  const tabs: TabKey[] = ["requests", "approvals", "balances", "policies", "types", "holidays", "allocations"];

  return (
    <StandardPageLayout
      title="Leave Management"
      subtitle="Policies, requests, approvals, balances, and holiday allocations in one HR operations workspace."
      eyebrow="HRMS / Time Off"
      icon="calendar"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Requests", value: requests.length },
            { label: "Pending", value: pendingApprovals.length, tone: "warning" },
            { label: "Approved", value: approvedRequests, tone: "info" },
            { label: "Balance", value: leaveBalanceTotal, tone: "positive" },
          ]}
        />
      }
    >
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-700">{error}</p>
        </div>
      )}

      <div className={`${erpPanelClassName} p-4`}>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? "erp-tab-trigger erp-tab-trigger-active" : "erp-tab-trigger"}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "requests" && (
        <section className={erpSectionClassName}>
          <div className="mb-3">
            <h2 className="font-semibold text-slate-950">Leave Requests</h2>
            <p className="mt-1 text-sm text-slate-500">Use this as the daily operator queue for submitted time-off requests.</p>
          </div>
          {loadingRequests ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="text-sm text-slate-500">No requests found.</div>
          ) : (
            <div className={erpTableWrapClassName}>
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className={erpTableThClassName}>Employee</th>
                    <th className={erpTableThClassName}>From</th>
                    <th className={erpTableThClassName}>To</th>
                    <th className={erpTableThClassName}>Days</th>
                    <th className={erpTableThClassName}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td className={erpTableTdClassName}>{req.employeeName || req.employeeId}</td>
                      <td className={erpTableTdClassName}>{req.fromDate}</td>
                      <td className={erpTableTdClassName}>{req.toDate}</td>
                      <td className={erpTableTdClassName}>{req.days}</td>
                      <td className={erpTableTdClassName}>
                        <span className={erpStatusBadgeTone.info}>{req.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === "approvals" && (
        <section className={erpSectionClassName}>
          <div className="mb-3">
            <h2 className="font-semibold text-slate-950">Pending Approvals</h2>
            <p className="mt-1 text-sm text-slate-500">Managers should only need context and decision controls from this queue.</p>
          </div>
          {loadingApprovals ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : pendingApprovals.length === 0 ? (
            <div className="text-sm text-slate-500">No approvals pending.</div>
          ) : (
            <div className="space-y-3">
              {pendingApprovals.map((req) => (
                <div key={req.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
                  <div>
                    <div className="font-medium text-slate-900">{req.employeeName || req.employeeId}</div>
                    <div className="text-xs text-slate-500">
                      {req.fromDate} to {req.toDate} ({req.days} days)
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`${erpButtonClassName.primary} h-8 px-3 text-xs`}
                      onClick={() => void handleApproveRequest(req.id)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className={`${erpButtonClassName.danger} h-8 px-3 text-xs`}
                      onClick={() => void handleRejectRequest(req.id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "balances" && (
        <section className={erpSectionClassName}>
          <h2 className="mb-3 font-semibold text-slate-950">Leave Balances</h2>
          {loadingBalances ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : balances.length === 0 ? (
            <div className="text-sm text-slate-500">No leave balances available.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {balances.map((balance, index) => (
                <div key={balance.id || index} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {balance.leaveTypeName || balance.leaveType || "Leave balance"}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    {Number(balance.balance || balance.remaining || 0)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Allocated {Number(balance.allocated || 0)} | Used {Number(balance.used || 0)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "policies" && (
        <section className={erpSectionClassName}>
          <h2 className="mb-3 font-semibold text-slate-950">Leave Policies</h2>
          {loadingPolicies ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : policies.length === 0 ? (
            <div className="text-sm text-slate-500">No leave policies configured.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {policies.map((policy, index) => (
                <div key={policy.id || index} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-slate-900">{policy.name || policy.policyName || "Leave policy"}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {policy.description || `${policy.leaveTypeName || "General"} policy setup`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "types" && (
        <section className={erpSectionClassName}>
          <h2 className="mb-3 font-semibold text-slate-950">Leave Types</h2>
          {loadingTypes ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : leaveTypes.length === 0 ? (
            <div className="text-sm text-slate-500">No leave types configured.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {leaveTypes.map((type, index) => (
                <div key={type.id || index} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="font-semibold text-slate-900">{type.name || type.leaveTypeName || "Leave type"}</p>
                  <p className="mt-1 text-sm text-slate-500">{type.description || "Configured leave category for employees."}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "holidays" && (
        <section className={erpSectionClassName}>
          <h2 className="mb-3 font-semibold text-slate-950">Holidays</h2>
          {loadingHolidays ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : holidays.length === 0 ? (
            <div className="text-sm text-slate-500">No holidays configured for {currentYear}.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {holidays.map((holiday, index) => (
                <div key={holiday.id || index} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-slate-900">{holiday.name || holiday.holidayName || "Holiday"}</p>
                  <p className="mt-1 text-sm text-slate-500">{holiday.date || holiday.holidayDate || "Date not provided"}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "allocations" && (
        <section className={erpSectionClassName}>
          <h2 className="mb-3 font-semibold text-slate-950">Allocations</h2>
          {loadingAllocations ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : allocations.length === 0 ? (
            <div className="text-sm text-slate-500">No annual allocations available.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {allocations.map((allocation, index) => (
                <div key={allocation.id || index} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="font-semibold text-slate-900">{allocation.employeeName || allocation.employeeId || "Allocation"}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {allocation.leaveTypeName || allocation.leaveType || "Leave type"} | {Number(allocation.allocated || 0)} allocated
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </StandardPageLayout>
  );
}
