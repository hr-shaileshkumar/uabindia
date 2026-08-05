"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/erp/status-badge";
import { ROUTES } from "@/constants/routes";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { PageHeader } from "@/design-system";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { Calendar, Users, TrendingUp, DollarSign } from "lucide-react";

type Lead = {
  id: string;
  leadName: string;
  leadCode: string;
  customerName?: string;
  status?: string;
  value?: number;
  probability?: number;
  expectedCloseDate?: string;
  stage?: string;
  owner?: string;
};

const formatCurrency = (value?: number) =>
  value != null ? `₹${value.toLocaleString("en-IN")}` : "₹0";

export default function CRMLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // No dedicated leads endpoint exists yet on the backend; render an empty pipeline until one is added.
      setLeads([]);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load leads.");
      setError(msg);
      notifyError(msg, "CRM");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const totalValue = useMemo(() => leads.reduce((sum, l) => sum + (l.value || 0), 0), [leads]);
  const qualifiedLeads = useMemo(() => leads.filter((l) => l.status === "Qualified").length, [leads]);
  const pipelineValue = useMemo(() => leads.filter((l) => l.status !== "Converted" && l.status !== "Lost").reduce((sum, l) => sum + (l.value || 0), 0), [leads]);

  const stageColumns = useMemo(() => {
    const stages = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
    return stages.map((stage) => ({
      stage,
      leads: leads.filter((l) => l.stage === stage || (stage === "New" && !l.stage)),
    }));
  }, [leads]);

  return (
    <div className="erp-page space-y-5">
      <PageHeader
        title="Lead Pipeline"
        subtitle="Lead management, pipeline tracking, probability scoring, and conversion analytics."
        eyebrow="CRM / Leads"
        icon="pipeline"
        stats={[
          { label: "Total Leads", value: leads.length },
          { label: "Qualified", value: qualifiedLeads, tone: "success" },
          { label: "Pipeline", value: formatCurrency(pipelineValue), tone: "info" },
          { label: "Conversion", value: leads.length ? Math.round((qualifiedLeads / leads.length) * 100) + "%" : "0%", tone: "warning" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9">Export</Button>
            <Link href={ROUTES.LEADS + "/create"}>
              <Button size="sm" className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm">
                + Add Lead
              </Button>
            </Link>
          </div>
        }
      />
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Leads", value: leads.length.toString(), icon: Users, href: ROUTES.LEADS },
          { label: "Pipeline Value", value: formatCurrency(pipelineValue), icon: DollarSign, href: ROUTES.LEADS },
          { label: "Qualified", value: qualifiedLeads.toString(), icon: TrendingUp, href: ROUTES.LEADS },
          { label: "Total Value", value: formatCurrency(totalValue), icon: Calendar, href: ROUTES.LEADS },
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className="group cursor-pointer">
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                <kpi.icon className="h-4 w-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-slate-500">Click to view details</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pipeline View */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Pipeline</CardTitle>
          <CardDescription>Track leads through their sales journey</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-16 w-16 text-slate-400" />
              <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">No leads found</p>
              <p className="mt-2 text-sm text-slate-500">Start building your sales pipeline</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {stageColumns.map(({ stage, leads: stageLeads }) => (
                <div key={stage} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{stage}</h3>
                    <Badge variant="secondary" className="text-xs">{stageLeads.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {stageLeads.map((lead) => (
                      <div key={lead.id} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 dark:text-slate-100">{lead.leadName}</p>
                            <p className="text-xs text-slate-500">{lead.customerName || "New Lead"}</p>
                          </div>
                          {lead.probability && (
                            <span className={`text-xs font-bold ${
                              lead.probability > 70 ? "text-emerald-600" :
                              lead.probability > 40 ? "text-amber-600" : "text-rose-600"
                            }`}>
                              {lead.probability}%
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {formatCurrency(lead.value)}
                          </span>
                          <StatusBadge tone={lead.status === "Qualified" ? "positive" : lead.status === "Lost" ? "danger" : "warning"}>
                            {lead.status}
                          </StatusBadge>
                        </div>
                        {lead.expectedCloseDate && (
                          <div className="mt-2 flex items-center text-xs text-slate-500">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(lead.expectedCloseDate).toLocaleDateString("en-IN")}
                          </div>
                        )}
                      </div>
                    ))}
                    {stageLeads.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-4 text-center">
                        <p className="text-sm text-slate-400">No leads in this stage</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
          <CardDescription>Latest leads added to the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                <tr>
                  <th className="px-4 py-3">Lead Name</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Owner</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-200">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                      </td>
                    </tr>
                  ))
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No leads found</td>
                  </tr>
                ) : (
                  leads.slice(0, 10).map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{lead.leadName}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{lead.customerName || "-"}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(lead.value)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-xs">{lead.stage || "New"}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={lead.status === "Qualified" ? "positive" : lead.status === "Lost" ? "danger" : "warning"}>
                          {lead.status}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{lead.owner || "Unassigned"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
