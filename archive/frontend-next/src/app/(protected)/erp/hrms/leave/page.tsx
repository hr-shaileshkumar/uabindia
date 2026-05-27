"use client";

import { useEffect, useMemo, useState } from "react";
import { hrApi } from "@/lib/hrApi";

type TabKey = "policies" | "balances" | "requests" | "approvals" | "holidays" | "allocations" | "types";

export default function LeavePage() {
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

  const [leaveTypeForm, setLeaveTypeForm] = useState({
    code: "",
    name: "",
    description: "",
    isActive: true,
    displayOrder: 0,
  });

  const [policyForm, setPolicyForm] = useState({
    name: "",
    type: "",
    entitlementPerYear: "",
    carryForwardAllowed: false,
    maxCarryForward: "",
    allocationFrequency: "Yearly",
    enableProration: true,
    autoAllocate: false,
  });

  const [requestForm, setRequestForm] = useState({
    employeeId: "",
    leavePolicyId: "",
    fromDate: "",
    toDate: "",
    days: "",
    period: "FullDay",
    reason: "",
  });

  const pendingApprovals = useMemo(
    () => approvals.filter((r) => (r.status || "").toLowerCase() === "pending"),
    [approvals]
  );

  const fetchLeaveTypes = async () => {
    try {
      setLoadingTypes(true);
      const res = await hrApi.hrms.leave.types.list();
      setLeaveTypes(res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load leave types");
    } finally {
      setLoadingTypes(false);
    }
  };

  const fetchPolicies = async () => {
    try {
      setLoadingPolicies(true);
      const res = await hrApi.hrms.leave.policies.list();
      setPolicies(res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load leave policies");
    } finally {
      setLoadingPolicies(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await hrApi.hrms.leave.list(1, 50);
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
      const res = await hrApi.hrms.leave.approvals.list("Pending");
      setApprovals(res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load leave approvals");
    } finally {
      setLoadingApprovals(false);
    }
  };

  const fetchBalances = async () => {
    try {
      setLoadingBalances(true);
      const res = await hrApi.hrms.leave.balances.list();
      setBalances(res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load leave balances");
    } finally {
      setLoadingBalances(false);
    }
  };

  const fetchHolidays = async () => {
    try {
      setLoadingHolidays(true);
      const res = await hrApi.hrms.leave.holidays.list(new Date().getFullYear());
      setHolidays(res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load holidays");
    } finally {
      setLoadingHolidays(false);
    }
  };

  const fetchAllocations = async () => {
    try {
      setLoadingAllocations(true);
      const res = await hrApi.hrms.leave.allocations.list({ year: new Date().getFullYear() });
      setAllocations(res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load leave allocations");
    } finally {
      setLoadingAllocations(false);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
    fetchPolicies();
    fetchRequests();
    fetchApprovals();
    fetchBalances();
    fetchHolidays();
    fetchAllocations();
  }, []);

  useEffect(() => {
    setError(null);
  }, [activeTab]);

  const handleCreateLeaveType = async () => {
    setError(null);
    try {
      await hrApi.hrms.leave.types.create({
        code: leaveTypeForm.code,
        name: leaveTypeForm.name,
        description: leaveTypeForm.description,
        isActive: leaveTypeForm.isActive,
        displayOrder: leaveTypeForm.displayOrder,
      });
      setLeaveTypeForm({
        code: "",
        name: "",
        description: "",
        isActive: true,
        displayOrder: 0,
      });
      await fetchLeaveTypes();
    } catch (err: any) {
      setError(err.message || "Failed to create leave type");
    }
  };

  const handleCreatePolicy = async () => {
    setError(null);
    try {
      await hrApi.hrms.leave.policies.create({
        name: policyForm.name,
        type: policyForm.type,
        entitlementPerYear: Number(policyForm.entitlementPerYear || 0),
        carryForwardAllowed: policyForm.carryForwardAllowed,
        maxCarryForward: policyForm.maxCarryForward
          ? Number(policyForm.maxCarryForward)
          : null,
        allocationFrequency: policyForm.allocationFrequency,
        enableProration: policyForm.enableProration,
        autoAllocate: policyForm.autoAllocate,
      });
      setPolicyForm({
        name: "",
        type: "",
        entitlementPerYear: "",
        carryForwardAllowed: false,
        maxCarryForward: "",
        allocationFrequency: "Yearly",
        enableProration: true,
        autoAllocate: false,
      });
      await fetchPolicies();
    } catch (err: any) {
      setError(err.message || "Failed to create leave policy");
    }
  };

  const handleCreateRequest = async () => {
    setError(null);
    try {
      await hrApi.hrms.leave.requestLeave({
        employeeId: requestForm.employeeId,
        leavePolicyId: requestForm.leavePolicyId,
        fromDate: requestForm.fromDate,
        toDate: requestForm.toDate,
        days: Number(requestForm.days || 0),
        period: requestForm.period,
        reason: requestForm.reason,
      });
      setRequestForm({
        employeeId: "",
        leavePolicyId: "",
        fromDate: "",
        toDate: "",
        days: "",
        period: "FullDay",
        reason: "",
      });
      await fetchRequests();
    } catch (err: any) {
      setError(err.message || "Failed to create leave request");
    }
  };

  const handleApproveRequest = async (id: string) => {
    setError(null);
    try {
      await hrApi.hrms.leave.approveLeave(id);
      await fetchApprovals();
      await fetchRequests();
    } catch (err: any) {
      setError(err.message || "Failed to approve leave request");
    }
  };

  const handleRejectRequest = async (id: string) => {
    setError(null);
    try {
      await hrApi.hrms.leave.rejectLeave(id);
      await fetchApprovals();
      await fetchRequests();
    } catch (err: any) {
      setError(err.message || "Failed to reject leave request");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <p className="text-sm text-gray-600 mt-1">Policies, requests, approvals, and balances</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["requests", "approvals", "balances", "policies", "types", "holidays", "allocations"] as TabKey[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === tab ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "requests" && (
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Leave Requests</h2>
            <button
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
              onClick={handleCreateRequest}
            >
              Submit Request
            </button>
          </div>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Pending Approvals</h2>
          </div>
          {loadingApprovals ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : pendingApprovals.length === 0 ? (
            <div className="text-sm text-gray-500">No approvals pending.</div>
          ) : (
            <div className="space-y-3">
              {pendingApprovals.map((req) => (
                <div key={req.id} className="border rounded-md p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{req.employeeName || req.employeeId}</div>
                    <div className="text-xs text-gray-500">{req.fromDate} → {req.toDate} ({req.days} days)</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 text-xs bg-emerald-600 text-white rounded" onClick={() => handleApproveRequest(req.id)}>Approve</button>
                    <button className="px-2 py-1 text-xs bg-red-600 text-white rounded" onClick={() => handleRejectRequest(req.id)}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "balances" && (
        <div className="rounded-lg border bg-white p-4">
          <h2 className="font-semibold mb-3">Leave Balances</h2>
          {loadingBalances ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : balances.length === 0 ? (
            <div className="text-sm text-gray-500">No balances found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Employee</th>
                    <th className="px-3 py-2 text-left">Leave Type</th>
                    <th className="px-3 py-2 text-left">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {balances.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2">{row.employeeName || row.employeeId}</td>
                      <td className="px-3 py-2">{row.leaveTypeName || row.leaveTypeId}</td>
                      <td className="px-3 py-2">{row.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "policies" && (
        <div className="rounded-lg border bg-white p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Leave Policies</h2>
            <button className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm" onClick={handleCreatePolicy}>Create Policy</button>
          </div>
          {loadingPolicies ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : policies.length === 0 ? (
            <div className="text-sm text-gray-500">No policies found.</div>
          ) : (
            <div className="space-y-3">
              {policies.map((policy) => (
                <div key={policy.id} className="border rounded-md p-3">
                  <div className="font-medium">{policy.name}</div>
                  <div className="text-xs text-gray-500">{policy.type} • {policy.entitlementPerYear} days</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "types" && (
        <div className="rounded-lg border bg-white p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Leave Types</h2>
            <button className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm" onClick={handleCreateLeaveType}>Create Type</button>
          </div>
          {loadingTypes ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : leaveTypes.length === 0 ? (
            <div className="text-sm text-gray-500">No types found.</div>
          ) : (
            <div className="space-y-3">
              {leaveTypes.map((type) => (
                <div key={type.id} className="border rounded-md p-3">
                  <div className="font-medium">{type.name}</div>
                  <div className="text-xs text-gray-500">{type.code}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "holidays" && (
        <div className="rounded-lg border bg-white p-4">
          <h2 className="font-semibold mb-3">Holidays</h2>
          {loadingHolidays ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : holidays.length === 0 ? (
            <div className="text-sm text-gray-500">No holidays found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {holidays.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2">{row.date}</td>
                      <td className="px-3 py-2">{row.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "allocations" && (
        <div className="rounded-lg border bg-white p-4">
          <h2 className="font-semibold mb-3">Allocations</h2>
          {loadingAllocations ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : allocations.length === 0 ? (
            <div className="text-sm text-gray-500">No allocations found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Employee</th>
                    <th className="px-3 py-2 text-left">Policy</th>
                    <th className="px-3 py-2 text-left">Allocated</th>
                    <th className="px-3 py-2 text-left">Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allocations.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2">{row.employeeName || row.employeeId}</td>
                      <td className="px-3 py-2">{row.leavePolicyName || row.leavePolicyId}</td>
                      <td className="px-3 py-2">{row.allocatedDays}</td>
                      <td className="px-3 py-2">{row.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
