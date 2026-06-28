"use client";

import { useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";

type TabKey = "policies" | "balances" | "requests" | "approvals" | "holidays" | "allocations" | "types";

const leaveApi = hrApi.hrms.leave;

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
    () => approvals.filter((r) => (r.status || "").toLowerCase() === "pending"),
    [approvals]
  );

  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await leaveApi.list(1, 50);
      setRequests(res.data || []);
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
          leaveApi.holidays.list(new Date().getFullYear()),
          leaveApi.allocations.list({ year: new Date().getFullYear() }),
        ]);

        setLeaveTypes(typesRes.data || []);
        setPolicies(policiesRes.data || []);
        setRequests(requestsRes.data || []);
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
  }, []);

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

  return (
    <StandardPageLayout
      title="Leave Management"
      subtitle="Policies, requests, approvals, balances, and holiday allocations"
    >
      <div className="space-y-4 p-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="font-medium text-red-700">{error}</p>
          </div>
        )}

        {/* KPI summary cards */}
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Leave Requests</p><p className="erp-kpi-value">{requests.length}</p><p className="erp-kpi-meta">Total requests</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending Approvals</p><p className="erp-kpi-value">{pendingApprovals.length}</p><p className="erp-kpi-meta">Awaiting decision</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Leave Types</p><p className="erp-kpi-value">{leaveTypes.length}</p><p className="erp-kpi-meta">Configured types</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Policies</p><p className="erp-kpi-value erp-kpi-value-success">{policies.length}</p><p className="erp-kpi-meta">Active policies</p></div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["requests", "approvals", "balances", "policies", "types", "holidays", "allocations"] as TabKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`erp-tab-trigger ${
                activeTab === tab ? "erp-tab-trigger-active" : ""
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "requests" && (
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 font-semibold">Leave Requests</h2>
            {loadingRequests ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : requests.length === 0 ? (
              <div className="text-sm text-gray-500">No requests found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Employee</th>
                      <th className="px-3 py-2 text-left">From</th>
                      <th className="px-3 py-2 text-left">To</th>
                      <th className="px-3 py-2 text-left">Days</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {requests.map((req) => (
                      <tr key={req.id}>
                        <td className="px-3 py-2">{req.employeeName || req.employeeId}</td>
                        <td className="px-3 py-2">{req.fromDate}</td>
                        <td className="px-3 py-2">{req.toDate}</td>
                        <td className="px-3 py-2">{req.days}</td>
                        <td className="px-3 py-2">{req.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "approvals" && (
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 font-semibold">Pending Approvals</h2>
            {loadingApprovals ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : pendingApprovals.length === 0 ? (
              <div className="text-sm text-gray-500">No approvals pending.</div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((req) => (
                  <div key={req.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <div className="font-medium">{req.employeeName || req.employeeId}</div>
                      <div className="text-xs text-gray-500">
                        {req.fromDate} to {req.toDate} ({req.days} days)
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="erp-action-btn erp-action-btn-primary text-xs min-h-8! px-3!" onClick={() => void handleApproveRequest(req.id)}>
                        Approve
                      </button>
                      <button className="erp-action-btn erp-action-btn-danger text-xs min-h-8! px-3!" onClick={() => void handleRejectRequest(req.id)}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "balances" && (
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 font-semibold">Leave Balances</h2>
            {loadingBalances ? <div className="text-sm text-gray-500">Loading...</div> : <div className="text-sm text-gray-600">{balances.length} balance records</div>}
          </div>
        )}

        {activeTab === "policies" && (
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 font-semibold">Leave Policies</h2>
            {loadingPolicies ? <div className="text-sm text-gray-500">Loading...</div> : <div className="text-sm text-gray-600">{policies.length} policies</div>}
          </div>
        )}

        {activeTab === "types" && (
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 font-semibold">Leave Types</h2>
            {loadingTypes ? <div className="text-sm text-gray-500">Loading...</div> : <div className="text-sm text-gray-600">{leaveTypes.length} leave types</div>}
          </div>
        )}

        {activeTab === "holidays" && (
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 font-semibold">Holidays</h2>
            {loadingHolidays ? <div className="text-sm text-gray-500">Loading...</div> : <div className="text-sm text-gray-600">{holidays.length} holidays</div>}
          </div>
        )}

        {activeTab === "allocations" && (
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 font-semibold">Allocations</h2>
            {loadingAllocations ? <div className="text-sm text-gray-500">Loading...</div> : <div className="text-sm text-gray-600">{allocations.length} allocations</div>}
          </div>
        )}
      </div>
    </StandardPageLayout>
  );
}
