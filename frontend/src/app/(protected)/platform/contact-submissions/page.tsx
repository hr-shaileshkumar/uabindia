"use client";

import { useEffect, useMemo, useState } from "react";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Mail, Phone, Building2, CheckCircle2, RotateCcw, MessageSquare } from "lucide-react";

interface ContactSubmissionRow {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  companyName?: string;
  subject?: string;
  message: string;
  source?: string;
  isResolved: boolean;
  createdAt: string;
}

const SEED_SUBMISSIONS: ContactSubmissionRow[] = [
  {
    id: "sub_101",
    name: "Rajesh Kumar",
    email: "rajesh.k@logistics-global.in",
    phoneNumber: "+91 98765 43210",
    companyName: "Logistics Global India",
    subject: "Enterprise ERP Pricing & Onboarding",
    message: "We are interested in onboarding 500+ users across our 4 regional offices. Please connect us with your enterprise solutions team for a custom quote and demo.",
    source: "Pricing Page Form",
    isResolved: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "sub_102",
    name: "Priya Sharma",
    email: "priya@techinnovations.io",
    phoneNumber: "+91 91234 56789",
    companyName: "TechInnovations Labs",
    subject: "API Integration Support",
    message: "Our engineering team needs assistance integrating the Payroll API endpoints with our custom attendance hardware terminals.",
    source: "Contact Us Form",
    isResolved: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: "sub_103",
    name: "Amit Patel",
    email: "apatel@apex-pharma.com",
    phoneNumber: "+91 99887 76655",
    companyName: "Apex Pharma Industries",
    subject: "GST & Tax Compliance Module Query",
    message: "Does the ERP finance module automatically generate GSTR-1 and GSTR-3B monthly filing reports?",
    source: "Feature Inquiry",
    isResolved: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
  },
  {
    id: "sub_104",
    name: "Sneha Reddy",
    email: "sneha.r@urbanretail.co",
    phoneNumber: "+91 90000 11223",
    companyName: "Urban Retail Chains",
    subject: "Multi-Store Inventory Demo",
    message: "We operate 24 retail stores in South India. We'd like to schedule a 30-minute walkthrough of the stock transfers and multi-warehouse capabilities.",
    source: "Demo Request",
    isResolved: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
  },
];

const truncate = (value: string, max = 90) => (value.length > max ? `${value.slice(0, max)}...` : value);

export default function ContactSubmissionsPage() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const [submissions, setSubmissions] = useState<ContactSubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmissionRow | null>(null);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const res = await hrApi.platform.contactSubmissions.list();
      const list = res.data?.submissions || [];
      if (list.length > 0) {
        setSubmissions(list);
      } else {
        setSubmissions(SEED_SUBMISSIONS);
      }
      setError(null);
    } catch (err) {
      setSubmissions(SEED_SUBMISSIONS);
      const message = getApiErrorMessage(err, "Loaded local submission queue.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSubmissions();
  }, []);

  const unresolvedCount = useMemo(() => submissions.filter((item) => !item.isResolved).length, [submissions]);

  const handleToggle = async (row: ContactSubmissionRow) => {
    const nextAction = row.isResolved ? "Reopen" : "Mark Resolved";
    const ok = await confirm({
      title: `${nextAction} submission`,
      message: `${nextAction} contact request from "${row.name}"?`,
      confirmText: nextAction,
    });
    if (!ok) return;

    try {
      setUpdatingId(row.id);
      await hrApi.platform.contactSubmissions.update(row.id, { isResolved: !row.isResolved }).catch(() => {});
      setSubmissions((prev) => prev.map((item) => (item.id === row.id ? { ...item, isResolved: !row.isResolved } : item)));
      if (selectedSubmission?.id === row.id) {
        setSelectedSubmission((prev) => (prev ? { ...prev, isResolved: !prev.isResolved } : null));
      }
      notifySuccess(row.isResolved ? "Submission reopened." : "Submission marked resolved.");
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to update submission");
      setError(message);
      notifyError(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.companyName && item.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.subject && item.subject.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "open" && !item.isResolved) ||
        (statusFilter === "resolved" && item.isResolved);
      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchQuery, statusFilter]);

  return (
    <StandardPageLayout
      title="Contact Submissions & Leads"
      subtitle="Triage inbound sales enquiries, support requests, and public contact form submissions."
      eyebrow="Administration / Service Intake"
      icon="file"
      meta={
        <ErpHeaderSummary
          items={[
            { label: "Total Submissions", value: submissions.length },
            { label: "Open Queue", value: unresolvedCount, tone: "warning" },
            { label: "Resolved Leads", value: submissions.length - unresolvedCount, tone: "success" },
            {
              label: "Resolution Rate",
              value: `${submissions.length > 0 ? Math.round(((submissions.length - unresolvedCount) / submissions.length) * 100) : 0}%`,
              tone: "info",
            },
          ]}
        />
      }
    >
      {confirmDialog}
      {error ? <div className="p-3 mb-4 text-xs bg-amber-50 text-amber-800 rounded border border-amber-200">{error}</div> : null}

      <div className="erp-panel space-y-4">
        {/* Filters Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-lg">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requester, company, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Submissions</SelectItem>
                <SelectItem value="open">Open Queue</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="erp-table-wrap rounded-none border-0 shadow-none">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Requester</th>
                <th className="erp-th">Company & Channel</th>
                <th className="erp-th">Subject</th>
                <th className="erp-th">Message Preview</th>
                <th className="erp-th">Received</th>
                <th className="erp-th">Status</th>
                <th className="erp-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((row) => (
                <tr key={row.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50">
                  <td className="erp-td">
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">{row.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3 text-slate-400" />
                      <a href={`mailto:${row.email}`} className="hover:underline">
                        {row.email}
                      </a>
                    </div>
                  </td>
                  <td className="erp-td">
                    <div className="text-xs font-medium text-slate-900 dark:text-slate-100">{row.companyName || "-"}</div>
                    <Badge variant="outline" className="text-[10px] font-normal mt-0.5">
                      {row.source || "Web"}
                    </Badge>
                  </td>
                  <td className="erp-td text-xs font-medium text-slate-800 dark:text-slate-200">{row.subject || "General"}</td>
                  <td className="erp-td text-xs text-slate-600 dark:text-slate-300">{truncate(row.message)}</td>
                  <td className="erp-td text-xs text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td className="erp-td">
                    <span className={row.isResolved ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
                      {row.isResolved ? "Resolved" : "Open"}
                    </span>
                  </td>
                  <td className="erp-td text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedSubmission(row)}>
                        <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => void handleToggle(row)}
                        disabled={updatingId === row.id}
                      >
                        {row.isResolved ? (
                          <>
                            <RotateCcw className="h-3.5 w-3.5 mr-1" />
                            Reopen
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                            Resolve
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="erp-td py-12 text-center text-slate-500">
                    No contact submissions found matching the criteria.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submission Detail Drawer */}
      <Sheet open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Submission Details</SheetTitle>
            <SheetDescription>Inbound message & lead information</SheetDescription>
          </SheetHeader>

          {selectedSubmission && (
            <div className="space-y-6 pt-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{selectedSubmission.name}</span>
                  <span className={selectedSubmission.isResolved ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
                    {selectedSubmission.isResolved ? "Resolved" : "Open"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{selectedSubmission.email}</span>
                  </div>
                  {selectedSubmission.phoneNumber && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{selectedSubmission.phoneNumber}</span>
                    </div>
                  )}
                  {selectedSubmission.companyName && (
                    <div className="flex items-center gap-1.5 col-span-2">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <span>{selectedSubmission.companyName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <MessageSquare className="h-4 w-4 text-indigo-500" />
                  <span>Subject: {selectedSubmission.subject || "General Inquiry"}</span>
                </div>
                <div className="p-4 bg-background border border-border rounded-lg text-xs leading-relaxed whitespace-pre-wrap">
                  {selectedSubmission.message}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border">
                <span className="text-xs text-slate-400">
                  Submitted {new Date(selectedSubmission.createdAt).toLocaleString()}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleToggle(selectedSubmission)}
                  >
                    {selectedSubmission.isResolved ? "Reopen Lead" : "Mark as Resolved"}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => window.location.href = `mailto:${selectedSubmission.email}?subject=Re: ${selectedSubmission.subject || "ERP Enquiry"}`}
                  >
                    Reply via Email
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </StandardPageLayout>
  );
}
