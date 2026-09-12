"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  Network,
  GitBranch,
  ShieldAlert,
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  Plus,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  UserX,
  FileSpreadsheet,
} from "lucide-react";
import { hrmsApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { cn } from "@/lib/utils";
import { ErpDrawerFooter } from "@/components/workspace/page-kit";

export interface OrgTreeNode {
  id: string;
  fullName: string;
  employeeCode?: string;
  workEmail?: string;
  phone?: string;
  departmentId?: string;
  departmentName?: string;
  designationId?: string;
  designationName?: string;
  avatarUrl?: string;
  status?: string;
  reportingManagerId?: string;
  reportingManagerName?: string;
  actingManagerId?: string;
  actingManagerName?: string;
  isOrganizationHead?: boolean;
  directReportsCount: number;
  subordinates: OrgTreeNode[];
}

interface TransferItem {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  currentManagerId?: string;
  currentManagerName?: string;
  proposedManagerId?: string;
  proposedManagerName?: string;
  currentDepartmentName?: string;
  proposedDepartmentName?: string;
  transferType: string;
  reason: string;
  effectiveDate: string;
  oldManagerSignOffStatus: string;
  newManagerSignOffStatus: string;
  hrbpSignOffStatus: string;
  overallStatus: string;
  signOffNotes?: string;
  createdAt: string;
}

interface OrphanRisk {
  exitingManagerId: string;
  exitingManagerName: string;
  exitingManagerCode?: string;
  status: string;
  exitDate?: string;
  skipLevelManagerId?: string;
  skipLevelManagerName?: string;
  directReportsCount: number;
  directReports: {
    id: string;
    fullName: string;
    employeeCode?: string;
    designation?: string;
    department?: string;
  }[];
}

interface DelegationItem {
  managerId: string;
  managerName: string;
  employeeCode?: string;
  actingManagerId?: string;
  actingManagerName?: string;
  delegationStartDate?: string;
  delegationEndDate?: string;
  delegationReason?: string;
  isActive: boolean;
}

export default function OrgChartView() {
  const [activeTab, setActiveTab] = useState<"tree" | "transfers" | "orphans" | "delegations">("tree");
  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState<OrgTreeNode[]>([]);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [orphanRisks, setOrphanRisks] = useState<OrphanRisk[]>([]);
  const [delegations, setDelegations] = useState<DelegationItem[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedNode, setSelectedNode] = useState<OrgTreeNode | null>(null);

  // Modals & Drawers
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [delegationModalOpen, setDelegationModalOpen] = useState(false);
  
  // Assign Manager Form
  const [assignForm, setAssignForm] = useState({
    employeeId: "",
    reportingManagerId: "",
    reason: "",
    effectiveDate: new Date().toISOString().split("T")[0],
  });

  // Transfer Form
  const [transferForm, setTransferForm] = useState({
    employeeId: "",
    proposedManagerId: "",
    proposedDepartmentId: "",
    transferType: "Promotion",
    reason: "",
    effectiveDate: new Date().toISOString().split("T")[0],
  });

  // Delegation Form
  const [delegationForm, setDelegationForm] = useState({
    actingManagerId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    reason: "On annual leave / out of office",
  });

  // Flattened employees list for dropdown selectors
  const flatEmployees = useMemo(() => {
    const list: { id: string; fullName: string; employeeCode?: string; department?: string; designation?: string }[] = [];
    function collect(nodes: OrgTreeNode[]) {
      for (const n of nodes) {
        list.push({
          id: n.id,
          fullName: n.fullName,
          employeeCode: n.employeeCode,
          department: n.departmentName,
          designation: n.designationName,
        });
        if (n.subordinates?.length) {
          collect(n.subordinates);
        }
      }
    }
    collect(treeData);
    return list;
  }, [treeData]);

  // Load all org data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [treeRes, transRes, orphanRes, delRes] = await Promise.all([
        hrmsApi.hrms.organization.getTree(),
        hrmsApi.hrms.organization.getTransfers(),
        hrmsApi.hrms.organization.getOrphanRisks(),
        hrmsApi.hrms.organization.getDelegations(),
      ]);

      setTreeData(Array.isArray(treeRes.data) ? treeRes.data : []);
      setTransfers(Array.isArray(transRes.data) ? transRes.data : []);
      setOrphanRisks(Array.isArray(orphanRes.data) ? orphanRes.data : []);
      setDelegations(Array.isArray(delRes.data) ? delRes.data : []);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to load organization hierarchy data"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Assign Manager Submit
  const handleAssignManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.employeeId) return notifyError("Please select an employee.");
    try {
      await hrmsApi.hrms.organization.assignManager(assignForm.employeeId, {
        reportingManagerId: assignForm.reportingManagerId || null,
        reason: assignForm.reason,
        effectiveDate: assignForm.effectiveDate,
      });
      notifySuccess("Reporting manager successfully updated!");
      setAssignModalOpen(false);
      loadAllData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to assign manager"));
    }
  };

  // Request Transfer / Promotion Submit
  const handleRequestTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.employeeId) return notifyError("Please select an employee.");
    try {
      await hrmsApi.hrms.organization.requestTransfer({
        employeeId: transferForm.employeeId,
        proposedManagerId: transferForm.proposedManagerId || null,
        proposedDepartmentId: transferForm.proposedDepartmentId || null,
        transferType: transferForm.transferType,
        reason: transferForm.reason,
        effectiveDate: transferForm.effectiveDate,
      });
      notifySuccess("Transfer/Promotion request raised for 3-stage sign-off!");
      setTransferModalOpen(false);
      loadAllData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to submit transfer request"));
    }
  };

  // Sign-off Transfer
  const handleSignOff = async (id: string, role: string, decision: string) => {
    try {
      await hrmsApi.hrms.organization.signOffTransfer(id, {
        role,
        decision,
        notes: `Signed off as ${role} by HR Administrator`,
      });
      notifySuccess(`Sign-off recorded as ${decision}!`);
      loadAllData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Sign-off failed"));
    }
  };

  // Reassign Orphan Reports to Skip-Level
  const handleReassignOrphans = async (managerId: string) => {
    try {
      await hrmsApi.hrms.organization.reassignOrphans(managerId);
      notifySuccess("Orphaned direct reports successfully routed to Skip-Level Manager!");
      loadAllData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to reassign orphans"));
    }
  };

  // Delegate Authority Submit
  const handleDelegateAuthority = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegationForm.actingManagerId) return notifyError("Please select an acting manager.");
    try {
      await hrmsApi.hrms.organization.delegateAuthority({
        actingManagerId: delegationForm.actingManagerId,
        startDate: delegationForm.startDate,
        endDate: delegationForm.endDate,
        reason: delegationForm.reason,
      });
      notifySuccess("Delegation of Authority configured successfully!");
      setDelegationModalOpen(false);
      loadAllData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to set delegation"));
    }
  };

  // Revoke Delegation
  const handleRevokeDelegation = async (empId: string) => {
    try {
      await hrmsApi.hrms.organization.revokeDelegation(empId);
      notifySuccess("Delegation revoked.");
      loadAllData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to revoke delegation"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card border border-border/70 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-primary/10 text-primary font-semibold">
              <Network className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Organization Hierarchy & Reporting Structure
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Enterprise tree visualization, 3-stage transfer workflows, orphan risk safeguards, and delegation of authority.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setAssignModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <UserCheck className="w-4 h-4" />
            Assign Manager
          </button>
          <button
            onClick={() => setTransferModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all flex items-center gap-1.5 border border-border/80"
          >
            <GitBranch className="w-4 h-4" />
            Transfer / Promotion
          </button>
          <button
            onClick={() => setDelegationModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all flex items-center gap-1.5 border border-border/80"
          >
            <ShieldCheck className="w-4 h-4" />
            Delegation (DoA)
          </button>
          <button
            onClick={loadAllData}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg border border-border/70 hover:bg-muted/50"
            title="Refresh Hierarchy Data"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border/60 p-4 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Mapped Employees</p>
            <p className="text-xl font-bold">{flatEmployees.length}</p>
          </div>
        </div>

        <div className="bg-card border border-border/60 p-4 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Root Leadership</p>
            <p className="text-xl font-bold">{treeData.length}</p>
          </div>
        </div>

        <div className="bg-card border border-border/60 p-4 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Pending Transfers</p>
            <p className="text-xl font-bold">{transfers.filter((t) => t.overallStatus === "Pending").length}</p>
          </div>
        </div>

        <div className="bg-card border border-border/60 p-4 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className={cn("p-3 rounded-lg", orphanRisks.length > 0 ? "bg-rose-500/15 text-rose-600" : "bg-muted text-muted-foreground")}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Orphan Risk Alerts</p>
            <p className="text-xl font-bold text-rose-600">{orphanRisks.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border/80 gap-6">
        <button
          onClick={() => setActiveTab("tree")}
          className={cn(
            "pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all",
            activeTab === "tree"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Network className="w-4 h-4" />
          Interactive Org Tree
        </button>

        <button
          onClick={() => setActiveTab("transfers")}
          className={cn(
            "pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all",
            activeTab === "transfers"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <GitBranch className="w-4 h-4" />
          Transfers & Sign-offs
          {transfers.filter((t) => t.overallStatus === "Pending").length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-600 font-bold">
              {transfers.filter((t) => t.overallStatus === "Pending").length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("orphans")}
          className={cn(
            "pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all",
            activeTab === "orphans"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <ShieldAlert className="w-4 h-4" />
          Orphan Prevention
          {orphanRisks.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-500 text-white font-bold">
              {orphanRisks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("delegations")}
          className={cn(
            "pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all",
            activeTab === "delegations"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <ShieldCheck className="w-4 h-4" />
          Delegation of Authority (DoA)
        </button>
      </div>

      {/* TAB 1: INTERACTIVE TREE CHART */}
      {activeTab === "tree" && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs min-h-[600px] flex flex-col">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-border/60">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee, designation..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border/80 bg-background focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Zoom:</span>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
                className="p-1.5 rounded-md border border-border hover:bg-muted"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
                className="p-1.5 rounded-md border border-border hover:bg-muted"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="px-2 py-1 text-xs rounded-md border border-border hover:bg-muted"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Tree Rendering Canvas */}
          <div className="flex-1 overflow-auto py-8 px-4 flex justify-center items-start">
            <div
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top center", transition: "transform 0.15s ease" }}
              className="flex flex-col items-center"
            >
              {treeData.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Network className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-semibold text-base">No organization hierarchy mapped yet.</p>
                  <p className="text-xs mt-1">Assign reporting managers to employees to build the org tree.</p>
                </div>
              ) : (
                <div className="flex gap-12 items-start">
                  {treeData.map((root) => (
                    <OrgNodeView
                      key={root.id}
                      node={root}
                      searchQuery={searchQuery}
                      onSelect={(node) => {
                        setSelectedNode(node);
                        setAssignForm((f) => ({
                          ...f,
                          employeeId: node.id,
                          reportingManagerId: node.reportingManagerId || "",
                        }));
                        setAssignModalOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSFERS & PROMOTIONS */}
      {activeTab === "transfers" && (
        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border/70 flex items-center justify-between">
            <h3 className="font-bold text-sm">Employee Transfer & Promotion Requests</h3>
            <button
              onClick={() => setTransferModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              + Raise Transfer Request
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Current → Proposed Manager</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Old Mgr Sign-Off</th>
                  <th className="py-3 px-4 text-center">New Mgr Sign-Off</th>
                  <th className="py-3 px-4 text-center">HRBP Sign-Off</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      No transfer or promotion requests raised.
                    </td>
                  </tr>
                ) : (
                  transfers.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {t.employeeName}
                        <span className="block text-[11px] text-muted-foreground font-mono">{t.employeeCode}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
                          {t.transferType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">{t.currentManagerName || "Org Head"}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-primary" />
                          <span className="font-semibold text-foreground">{t.proposedManagerName || "Org Head"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {t.proposedDepartmentName || t.currentDepartmentName || "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <SignOffBadge status={t.oldManagerSignOffStatus} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <SignOffBadge status={t.newManagerSignOffStatus} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <SignOffBadge status={t.hrbpSignOffStatus} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[11px] font-bold",
                            t.overallStatus === "Effective" && "bg-emerald-500/15 text-emerald-600",
                            t.overallStatus === "Approved" && "bg-blue-500/15 text-blue-600",
                            t.overallStatus === "Pending" && "bg-amber-500/15 text-amber-600",
                            t.overallStatus === "Rejected" && "bg-rose-500/15 text-rose-600"
                          )}
                        >
                          {t.overallStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {t.overallStatus === "Pending" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSignOff(t.id, "HRBP", "Approved")}
                              className="px-2 py-1 text-[11px] font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleSignOff(t.id, "HRBP", "Rejected")}
                              className="px-2 py-1 text-[11px] font-semibold bg-rose-600 text-white rounded hover:bg-rose-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ORPHAN RISK PREVENTION */}
      {activeTab === "orphans" && (
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-300">
              <p className="font-semibold text-sm">Orphan Prevention Governance</p>
              <p className="mt-0.5">
                When a reporting manager resigns or is set to Notice Period/Exit, their direct reports risk becoming orphaned (unapproved leaves, missing appraisal reviews). Use one-click rerouting to safely transfer their team to the Skip-Level Manager.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orphanRisks.length === 0 ? (
              <div className="col-span-2 bg-card border border-border/80 rounded-2xl p-12 text-center text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                <p className="font-bold text-foreground">Zero Orphan Risks Detected</p>
                <p className="text-xs mt-1">All active managers are currently in good standing.</p>
              </div>
            ) : (
              orphanRisks.map((risk) => (
                <div key={risk.exitingManagerId} className="bg-card border border-rose-500/40 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-foreground">{risk.exitingManagerName}</h4>
                        <p className="text-xs text-muted-foreground font-mono">{risk.exitingManagerCode}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600">
                        Status: {risk.status}
                      </span>
                    </div>

                    <div className="bg-muted/40 p-3 rounded-lg text-xs space-y-1 mb-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Direct Reports At Risk:</span>
                        <span className="font-bold text-rose-600">{risk.directReportsCount} Employees</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Designated Skip-Level:</span>
                        <span className="font-bold text-foreground">{risk.skipLevelManagerName || "Managing Director"}</span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mb-3">
                      <span className="font-semibold text-foreground">Impacted Direct Reports:</span>
                      <ul className="mt-1 space-y-1 max-h-28 overflow-y-auto">
                        {risk.directReports.map((r) => (
                          <li key={r.id} className="flex justify-between py-0.5 border-b border-border/40">
                            <span>{r.fullName} ({r.employeeCode})</span>
                            <span className="text-muted-foreground">{r.designation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() => handleReassignOrphans(risk.exitingManagerId)}
                    className="w-full py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    Reassign All {risk.directReportsCount} Reports to Skip-Level ({risk.skipLevelManagerName || "Org Head"})
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DELEGATION OF AUTHORITY (DoA) */}
      {activeTab === "delegations" && (
        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border/70 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Delegation of Authority (DoA) Matrix</h3>
              <p className="text-xs text-muted-foreground">
                Temporary acting managers assigned to handle approvals during manager leave or absence.
              </p>
            </div>
            <button
              onClick={() => setDelegationModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              + Configure Delegation
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold">
                  <th className="py-3 px-4">Manager</th>
                  <th className="py-3 px-4">Acting Manager (Delegate)</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {delegations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No active delegations configured.
                    </td>
                  </tr>
                ) : (
                  delegations.map((d) => (
                    <tr key={d.managerId} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {d.managerName}
                        <span className="block text-[11px] text-muted-foreground font-mono">{d.employeeCode}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-primary">
                        {d.actingManagerName || "Unassigned"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {d.delegationStartDate ? new Date(d.delegationStartDate).toLocaleDateString() : "-"} →{" "}
                        {d.delegationEndDate ? new Date(d.delegationEndDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                        {d.delegationReason || "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[11px] font-bold",
                            d.isActive ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {d.isActive ? "Active Now" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRevokeDelegation(d.managerId)}
                          className="px-2 py-1 text-[11px] font-semibold bg-rose-500/10 text-rose-600 rounded hover:bg-rose-500/20"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN MANAGER */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                Assign Reporting Manager
              </h3>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignManager} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Employee</label>
                <select
                  value={assignForm.employeeId}
                  onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                  className="w-full p-2 rounded-lg border border-border bg-background"
                  required
                >
                  <option value="">-- Choose Employee --</option>
                  {flatEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.employeeCode || "No Code"}) - {e.designation || e.department || ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select New Reporting Manager</label>
                <select
                  value={assignForm.reportingManagerId}
                  onChange={(e) => setAssignForm({ ...assignForm, reportingManagerId: e.target.value })}
                  className="w-full p-2 rounded-lg border border-border bg-background"
                >
                  <option value="">-- Organization Head (No Manager / Root) --</option>
                  {flatEmployees
                    .filter((e) => e.id !== assignForm.employeeId)
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName} ({e.employeeCode}) - {e.designation}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  * Automatic cycle detection will prevent any circular hierarchy loops.
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-1">Effective Date</label>
                <input
                  type="date"
                  value={assignForm.effectiveDate}
                  onChange={(e) => setAssignForm({ ...assignForm, effectiveDate: e.target.value })}
                  className="w-full p-2 rounded-lg border border-border bg-background"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Reason / Notes</label>
                <textarea
                  value={assignForm.reason}
                  onChange={(e) => setAssignForm({ ...assignForm, reason: e.target.value })}
                  placeholder="Reason for manager re-assignment..."
                  className="w-full p-2 rounded-lg border border-border bg-background h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/70">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-muted font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  Confirm & Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFER / PROMOTION */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-primary" />
                Raise Transfer / Promotion Request
              </h3>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Employee</label>
                <select
                  value={transferForm.employeeId}
                  onChange={(e) => setTransferForm({ ...transferForm, employeeId: e.target.value })}
                  className="w-full p-2 rounded-lg border border-border bg-background"
                  required
                >
                  <option value="">-- Choose Employee --</option>
                  {flatEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Transfer Type</label>
                <select
                  value={transferForm.transferType}
                  onChange={(e) => setTransferForm({ ...transferForm, transferType: e.target.value })}
                  className="w-full p-2 rounded-lg border border-border bg-background"
                >
                  <option value="Promotion">Promotion to Senior Role</option>
                  <option value="DepartmentTransfer">Internal Mobility / Dept Transfer</option>
                  <option value="ManagerReassignment">Reporting Manager Change</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Proposed New Manager</label>
                <select
                  value={transferForm.proposedManagerId}
                  onChange={(e) => setTransferForm({ ...transferForm, proposedManagerId: e.target.value })}
                  className="w-full p-2 rounded-lg border border-border bg-background"
                >
                  <option value="">-- Retain / Top Executive --</option>
                  {flatEmployees
                    .filter((e) => e.id !== transferForm.employeeId)
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName} ({e.employeeCode}) - {e.designation}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Effective Date</label>
                <input
                  type="date"
                  value={transferForm.effectiveDate}
                  onChange={(e) => setTransferForm({ ...transferForm, effectiveDate: e.target.value })}
                  className="w-full p-2 rounded-lg border border-border bg-background"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Justification / Reason</label>
                <textarea
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  placeholder="Business justification for promotion/transfer..."
                  className="w-full p-2 rounded-lg border border-border bg-background h-20"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/70">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-muted font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  Submit for 3-Sign-Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELEGATION (DoA) */}
      {delegationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Configure Delegation of Authority (DoA)
              </h3>
              <button
                onClick={() => setDelegationModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDelegateAuthority} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Acting Manager (Delegate)</label>
                <select
                  value={delegationForm.actingManagerId}
                  onChange={(e) => setDelegationForm({ ...delegationForm, actingManagerId: e.target.value })}
                  className="w-full p-2 rounded-lg border border-border bg-background"
                  required
                >
                  <option value="">-- Choose Peer / Senior Manager --</option>
                  {flatEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.employeeCode}) - {e.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={delegationForm.startDate}
                    onChange={(e) => setDelegationForm({ ...delegationForm, startDate: e.target.value })}
                    className="w-full p-2 rounded-lg border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    value={delegationForm.endDate}
                    onChange={(e) => setDelegationForm({ ...delegationForm, endDate: e.target.value })}
                    className="w-full p-2 rounded-lg border border-border bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Reason / Scope</label>
                <textarea
                  value={delegationForm.reason}
                  onChange={(e) => setDelegationForm({ ...delegationForm, reason: e.target.value })}
                  className="w-full p-2 rounded-lg border border-border bg-background h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/70">
                <button
                  type="button"
                  onClick={() => setDelegationModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-muted font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  Activate Delegation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// RECURSIVE ORG NODE COMPONENT WITH CONNECTING BRANCH LINES
// -------------------------------------------------------------
function OrgNodeView({
  node,
  searchQuery,
  onSelect,
}: {
  node: OrgTreeNode;
  searchQuery: string;
  onSelect: (node: OrgTreeNode) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const isMatched =
    searchQuery &&
    (node.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.designationName?.toLowerCase().includes(searchQuery.toLowerCase()));

  const hasSubordinates = node.subordinates && node.subordinates.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Employee Node Card */}
      <div
        onClick={() => onSelect(node)}
        className={cn(
          "w-64 bg-card border rounded-2xl p-4 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 group relative select-none",
          isMatched
            ? "border-primary ring-2 ring-primary/30 shadow-primary/10"
            : "border-border/80 hover:border-primary/60",
          node.isOrganizationHead && "border-amber-500/50 bg-gradient-to-b from-amber-500/5 to-transparent"
        )}
      >
        {/* Top Header Tag */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {node.employeeCode || "EMP"}
          </span>
          {node.isOrganizationHead ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600">
              Org Head
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary truncate max-w-[110px]">
              {node.departmentName || "General"}
            </span>
          )}
        </div>

        {/* Avatar & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-sm shrink-0 border border-primary/20">
            {node.fullName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {node.fullName}
            </h4>
            <p className="text-xs text-muted-foreground truncate">{node.designationName || "Staff"}</p>
          </div>
        </div>

        {/* Delegation Badge */}
        {node.actingManagerName && (
          <div className="mt-2.5 px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-600 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Acting: {node.actingManagerName}</span>
          </div>
        )}

        {/* Direct Reports Expand/Collapse Pill */}
        {hasSubordinates && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            className="mt-3 w-full py-1 text-[11px] font-semibold bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg flex items-center justify-center gap-1 transition-colors"
          >
            {collapsed ? (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span>Expand ({node.directReportsCount} Direct Reports)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>{node.directReportsCount} Direct Reports</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Connecting Branch Line Down */}
      {hasSubordinates && !collapsed && (
        <div className="w-0.5 h-6 bg-border" />
      )}

      {/* Subordinates Branch Level */}
      {hasSubordinates && !collapsed && (
        <div className="relative pt-4 flex gap-8 items-start">
          {/* Top Horizontal Branch Line */}
          {node.subordinates.length > 1 && (
            <div className="absolute top-0 left-32 right-32 h-0.5 bg-border" />
          )}

          {node.subordinates.map((child) => (
            <div key={child.id} className="flex flex-col items-center relative">
              {/* Vertical Branch to Child */}
              <div className="w-0.5 h-4 bg-border -mt-4 mb-0" />
              <OrgNodeView node={child} searchQuery={searchQuery} onSelect={onSelect} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SIGN-OFF BADGE
// -------------------------------------------------------------
function SignOffBadge({ status }: { status: string }) {
  if (status === "Approved") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600">
        <CheckCircle2 className="w-3 h-3" />
        Approved
      </span>
    );
  }
  if (status === "Rejected") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600">
        <XCircle className="w-3 h-3" />
        Rejected
      </span>
    );
  }
  if (status === "NotApplicable") {
    return <span className="text-muted-foreground text-[11px]">N/A</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600">
      <Clock className="w-3 h-3" />
      Pending
    </span>
  );
}
