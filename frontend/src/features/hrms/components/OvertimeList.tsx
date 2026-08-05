"use client";

import { useState } from "react";
import { Clock, CheckCircle, XCircle, Plus, Check, X } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OvertimeRequest } from "@/types";

const INITIAL_OVERTIME: OvertimeRequest[] = [
  { id: "1", employeeId: "101", employeeName: "Rahul Verma", date: "2026-08-01", hours: 3.5, reason: "Sprint Release Deployment", status: "Pending" },
  { id: "2", employeeId: "102", employeeName: "Ananya Roy", date: "2026-07-30", hours: 2.0, reason: "Month-End Finance Reconciliation", status: "Approved" },
  { id: "3", employeeId: "103", employeeName: "Vikram Singh", date: "2026-07-28", hours: 4.0, reason: "Client Support Escalation", status: "Approved" },
  { id: "4", employeeId: "104", employeeName: "Pooja Patel", date: "2026-07-25", hours: 2.5, reason: "Quarterly Audit Preparation", status: "Rejected" },
];

export function OvertimeList() {
  const [requests, setRequests] = useState<OvertimeRequest[]>(INITIAL_OVERTIME);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = requests.filter((r) => {
    const matchesSearch = (r.employeeName || "").toLowerCase().includes(search.toLowerCase()) || r.reason?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAction = (id: string, newStatus: "Approved" | "Rejected") => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overtime Requests"
        subtitle="Review, approve, and track extra hours logged by team members"
        breadcrumbs={[
          { label: "HRMS", href: "/hrms" },
          { label: "Overtime" },
        ]}
      />

      <FilterBar
        searchPlaceholder="Search employee or reason..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Pending", value: "Pending" },
              { label: "Approved", value: "Approved" },
              { label: "Rejected", value: "Rejected" },
            ],
          },
        ]}
        activeFilters={{ status: statusFilter }}
        onFilterChange={(_, val) => setStatusFilter(val)}
        onResetFilters={() => setStatusFilter("")}
      />

      <div className="space-y-3">
        {filtered.map((req) => (
          <Card key={req.id} className="hover:border-border transition-colors">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{req.employeeName}</span>
                  <Badge variant={req.status === "Approved" ? "success" : req.status === "Pending" ? "warning" : "secondary"}>
                    {req.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Date: <span className="font-medium text-foreground">{req.date}</span> • Hours Requested: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{req.hours} hrs</span>
                </p>
                {req.reason && <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{req.reason}"</p>}
              </div>

              {req.status === "Pending" && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="text-emerald-600 hover:text-emerald-700 gap-1 h-8 text-xs" onClick={() => handleAction(req.id, "Approved")}>
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-rose-600 hover:text-rose-700 gap-1 h-8 text-xs" onClick={() => handleAction(req.id, "Rejected")}>
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
