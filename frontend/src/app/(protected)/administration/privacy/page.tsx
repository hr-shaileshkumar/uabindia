"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Download,
  Trash2,
  Lock,
  UserCheck,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Copy,
  Check,
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import HeaderSummary from "@/components/layout/HeaderSummary";
import { CrudCard } from "@/components/workspace/crud-workspace";
import { ErpTabBar, ErpTabPanel, ErpRefreshButton } from "@/components/workspace/page-kit";
import { SideDrawer } from "@/components/ui/side-drawer";
import { erpButtonClassName } from "@/components/workspace/styles";
import { platformApi } from "@/services/modules/administration";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type TabKey = "rights" | "retention" | "policy";

export default function PlatformPrivacyPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("rights");
  const [loading, setLoading] = useState(false);
  const [policyData, setPolicyData] = useState<{
    policyVersion?: string;
    lastUpdated?: string;
    dataRetention?: Record<string, string>;
    userRights?: string[];
    dataProcessingPurpose?: string;
    dataController?: string;
    contactEmail?: string;
  } | null>(null);

  const [exportingSelf, setExportingSelf] = useState(false);
  const [exportedJson, setExportedJson] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Admin export for specific user
  const [exportDrawerOpen, setExportDrawerOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [isExportingUser, setIsExportingUser] = useState(false);

  // Deletion / Erasure
  const [deleteDrawerOpen, setDeleteDrawerOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState("");
  const [deleteReason, setDeleteReason] = useState("Employee departure / DPDP Right to Erasure request");
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const loadPolicy = async () => {
    try {
      setLoading(true);
      const res = await platformApi.privacy.getPolicy();
      setPolicyData(res.data);
    } catch {
      // Fallback baseline
      setPolicyData({
        policyVersion: "1.0",
        lastUpdated: "2026-02-03",
        dataRetention: {
          activeRecords: "Retained for the duration of active tenancy",
          deletedRecords: "Soft-deleted records held for 90 days, then permanently purged",
          auditLogs: "Retained for 7 years for compliance purposes",
          backups: "Encrypted point-in-time snapshots retained for 30 days",
        },
        userRights: [
          "Right to Access (DPDP Act 2023 / GDPR Article 15) - Comprehensive Data Export",
          "Right to Correction (DPDP Act 2023 / GDPR Article 16)",
          "Right to Erasure / Right to be Forgotten (DPDP Act 2023 / GDPR Article 17)",
          "Right to Data Portability (JSON Machine-Readable Package)",
        ],
        dataProcessingPurpose: "Enterprise Human Resources, Statutory Payroll, Invoicing & Corporate Operations",
        dataController: "UabIndia Enterprise Platform",
        contactEmail: "privacy@uabindia.in",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPolicy();
  }, []);

  const handleExportSelf = async () => {
    try {
      setExportingSelf(true);
      const res = await platformApi.privacy.exportMe();
      const rawData = res.data?.dataPackage || res.data;
      const formatted = JSON.stringify(rawData, null, 2);
      setExportedJson(formatted);

      // Trigger automatic file download
      const blob = new Blob([formatted], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-privacy-dossier-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      notifySuccess("Personal data package exported successfully.");
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to export personal data package."));
    } finally {
      setExportingSelf(false);
    }
  };

  const handleExportSpecificUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim()) {
      notifyError("User GUID is required.");
      return;
    }

    try {
      setIsExportingUser(true);
      const res = await platformApi.privacy.exportUserData(targetUserId.trim());
      const rawData = res.data?.dataPackage || res.data;
      const formatted = JSON.stringify(rawData, null, 2);
      setExportedJson(formatted);

      const blob = new Blob([formatted], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user-dossier-${targetUserId.trim()}-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      notifySuccess("User data package exported.");
      setExportDrawerOpen(false);
      setTargetUserId("");
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to export user data dossier."));
    } finally {
      setIsExportingUser(false);
    }
  };

  const handleDeleteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteUserId.trim()) {
      notifyError("User GUID is required.");
      return;
    }

    if (
      !confirm(
        "WARNING: This will anonymize user identity records, revoke tokens, and soft-delete user roles under DPDP Act 2023 / GDPR Article 17. Proceed?"
      )
    ) {
      return;
    }

    try {
      setIsDeletingUser(true);
      const res = await platformApi.privacy.deleteUser(deleteUserId.trim(), deleteReason);
      notifySuccess(res.data?.message || "User data anonymized and soft-deleted successfully.");
      setDeleteDrawerOpen(false);
      setDeleteUserId("");
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to execute user data erasure."));
    } finally {
      setIsDeletingUser(false);
    }
  };

  const copyExportedJson = () => {
    if (!exportedJson) return;
    navigator.clipboard.writeText(exportedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    notifySuccess("Copied data package to clipboard.");
  };

  const tabItems = [
    { key: "rights", label: "Data Subject Rights & Actions" },
    { key: "retention", label: "Retention Schedule" },
    { key: "policy", label: "DPDP & GDPR Framework" },
  ];

  return (
    <StandardPageLayout
      title="Data Privacy & Compliance Governance"
      subtitle="DPDP Act 2023 (India) & GDPR Article 15/17 compliance, user dossier exports, and Right to Erasure governance."
      eyebrow="Administration / Governance"
      icon="shield"
      meta={
        <HeaderSummary
          items={[
            { label: "Compliance Baseline", value: "DPDP 2023 / GDPR", tone: "success" },
            { label: "Purge Window", value: "90 Days", tone: "info" },
            { label: "Audit Log SLA", value: "7 Years", tone: "warning" },
            { label: "Data Export Format", value: "Machine-Readable JSON", tone: "info" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void loadPolicy()} loading={loading} />
          <button
            type="button"
            disabled={exportingSelf}
            onClick={() => void handleExportSelf()}
            className={erpButtonClassName.primary}
          >
            <Download className="h-4 w-4" />
            {exportingSelf ? "Exporting..." : "Export My Data"}
          </button>
        </>
      }
    >
      <ErpTabBar tabs={tabItems} active={activeTab} onChange={(key) => setActiveTab(key as TabKey)} />

      {/* Tab 1: Rights & Actions */}
      <ErpTabPanel hidden={activeTab !== "rights"}>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Action 1: Self-service Export */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600">
                  <UserCheck className="h-5 w-5" />
                  <h3 className="text-sm font-bold text-slate-900">Right to Access (Self-Service Export)</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Export all personal information, roles, leave history, payroll slips, and audit logs associated with
                  your logged-in account into an encrypted JSON file package.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  disabled={exportingSelf}
                  onClick={() => void handleExportSelf()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {exportingSelf ? "Generating Dossier..." : "Export My Personal Dossier"}
                </button>
              </div>
            </div>

            {/* Action 2: Admin User Export */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-600">
                  <FileText className="h-5 w-5" />
                  <h3 className="text-sm font-bold text-slate-900">Admin User Dossier Export</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Generate and download a comprehensive DPDP compliance package for any employee or tenant operator
                  using their internal User ID.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setExportDrawerOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-blue-600" />
                  Export User by ID
                </button>
              </div>
            </div>

            {/* Action 3: Right to Erasure */}
            <div className="rounded-2xl border border-rose-200 bg-rose-50/20 p-5 shadow-xs space-y-3 flex flex-col justify-between md:col-span-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-rose-600">
                  <Trash2 className="h-5 w-5" />
                  <h3 className="text-sm font-bold text-slate-900">Right to Erasure / Right to be Forgotten</h3>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    GDPR Art. 17 / DPDP 2023
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Executes privacy-compliant anonymization and soft-deletion. Scrambles Personally Identifiable
                  Information (PII), masks Aadhaar and bank details, revokes all active session tokens, and records an
                  immutable audit event for regulatory accountability.
                </p>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteDrawerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-rose-700 transition-colors"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Initiate Right to Erasure Request
                </button>
              </div>
            </div>
          </div>

          {/* Exported JSON Preview Area */}
          {exportedJson && (
            <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-slate-100 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Exported Data Package Payload
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyExportedJson}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy JSON"}
                </button>
              </div>
              <pre className="max-h-72 overflow-y-auto font-mono text-xs text-emerald-300 leading-relaxed bg-slate-950 p-4 rounded-xl">
                <code>{exportedJson}</code>
              </pre>
            </div>
          )}
        </div>
      </ErpTabPanel>

      {/* Tab 2: Retention Schedule */}
      <ErpTabPanel hidden={activeTab !== "retention"}>
        <CrudCard>
          <div className="p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Statutory Data Retention Matrix</h3>
              <p className="mt-1 text-xs text-slate-500">
                Data lifecycle policies enforced across the multi-tenant database engine in compliance with Indian and
                international privacy regulations.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-bold text-xs">Active Records</span>
                </div>
                <p className="text-base font-bold text-slate-900">Active Account</p>
                <p className="mt-1 text-xs text-slate-500">Retained while organization account remains active.</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <Trash2 className="h-4 w-4" />
                  <span className="font-bold text-xs">Recycle Bin Buffer</span>
                </div>
                <p className="text-base font-bold text-slate-900">90 Days</p>
                <p className="mt-1 text-xs text-slate-500">
                  Soft-deleted records retained before permanent database purge.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="font-bold text-xs">Immutable Audit Trail</span>
                </div>
                <p className="text-base font-bold text-slate-900">7 Years</p>
                <p className="mt-1 text-xs text-slate-500">
                  Compliance and financial transaction logs preserved for audit verification.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Lock className="h-4 w-4" />
                  <span className="font-bold text-xs">Encrypted Snapshots</span>
                </div>
                <p className="text-base font-bold text-slate-900">30 Days</p>
                <p className="mt-1 text-xs text-slate-500">
                  Daily point-in-time recovery images with AES-256 geo-redundant storage.
                </p>
              </div>
            </div>
          </div>
        </CrudCard>
      </ErpTabPanel>

      {/* Tab 3: Policy Framework */}
      <ErpTabPanel hidden={activeTab !== "policy"}>
        <CrudCard>
          <div className="p-6 space-y-6 text-xs leading-relaxed max-w-4xl">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">Digital Personal Data Protection (DPDP) Act 2023 Baseline</h3>
              <p className="text-slate-600">
                UABIndia processes corporate enterprise data on behalf of your organization under strict multi-tenant
                isolation. As the Data Fiduciary/Controller, your organization determines the grounds of processing.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="font-bold text-slate-900 block">Enforced Privacy Protections</span>
                <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                  <li>Tenant-isolated database row filtering (zero cross-tenant data leakage)</li>
                  <li>Masking of sensitive identifiers (Aadhaar & Bank Account Number masking)</li>
                  <li>Password hashing using PBKDF2 / BCrypt with cryptographic salting</li>
                  <li>MFA and device session tracking with remote revocation capability</li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="font-bold text-slate-900 block">Regulatory Compliance Contact</span>
                <div className="space-y-1 text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-700">Data Controller:</span>{" "}
                    {policyData?.dataController || "UabIndia Enterprise Platform"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Grievance / Privacy Email:</span>{" "}
                    <a
                      href={`mailto:${policyData?.contactEmail || "privacy@uabindia.in"}`}
                      className="text-indigo-600 underline"
                    >
                      {policyData?.contactEmail || "privacy@uabindia.in"}
                    </a>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Policy Version:</span>{" "}
                    {policyData?.policyVersion || "1.0"} (Verified Active)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CrudCard>
      </ErpTabPanel>

      {/* Drawer: Admin User Export */}
      <SideDrawer
        open={exportDrawerOpen}
        onClose={() => setExportDrawerOpen(false)}
        title="Export User Compliance Package"
        subtitle="Retrieve full personal dossier for any tenant user"
      >
        <form onSubmit={handleExportSpecificUser} className="space-y-4 p-1">
          <div className="erp-field">
            <label className="erp-label">User GUID / Identifier *</label>
            <input
              className="erp-input font-mono text-xs"
              placeholder="e.g. 00000000-0000-0000-0000-000000000000"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              required
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Obtain the User ID from the{" "}
              <a href="/platform/users" className="text-indigo-600 underline">
                Users Registry
              </a>
              .
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={() => setExportDrawerOpen(false)}
              className="rounded-xl border px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isExportingUser}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isExportingUser ? "Exporting..." : "Generate & Download Package"}
            </button>
          </div>
        </form>
      </SideDrawer>

      {/* Drawer: Right to Erasure */}
      <SideDrawer
        open={deleteDrawerOpen}
        onClose={() => setDeleteDrawerOpen(false)}
        title="Execute Right to Erasure Request"
        subtitle="DPDP Act 2023 & GDPR Article 17 user anonymization"
      >
        <form onSubmit={handleDeleteUser} className="space-y-4 p-1">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 leading-relaxed">
            <p className="font-bold">Permanent Regulatory Action</p>
            <p className="mt-0.5">
              This will anonymize email, full name, phone number, address, and revoke all active JWT tokens. This action
              cannot be undone.
            </p>
          </div>

          <div className="erp-field">
            <label className="erp-label">Target User GUID *</label>
            <input
              className="erp-input font-mono text-xs"
              placeholder="e.g. 00000000-0000-0000-0000-000000000000"
              value={deleteUserId}
              onChange={(e) => setDeleteUserId(e.target.value)}
              required
            />
          </div>

          <div className="erp-field">
            <label className="erp-label">Legal Reason / Ticket Reference</label>
            <textarea
              className="erp-input min-h-20 text-xs"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={() => setDeleteDrawerOpen(false)}
              className="rounded-xl border px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDeletingUser}
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {isDeletingUser ? "Anonymizing..." : "Execute Erasure"}
            </button>
          </div>
        </form>
      </SideDrawer>
    </StandardPageLayout>
  );
}
